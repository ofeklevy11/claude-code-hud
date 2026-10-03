import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Hud, Limit } from '../types'

const EMPTY: Hud = { limits: [], costUsd: null, isRunning: false, turnSeconds: 0, totalSeconds: 0, ctxTokens: null, ctxWindow: 0, ctxPercent: null, nudged: false }
const hud = atom({ plugin: 'session-hud', key: 'hud' } as const, EMPTY)

const tone = (p: number): string => (p >= 85 ? 'red' : p >= 60 ? 'yellow' : 'green')
const clock = (s: number): string => {
  const hrs = Math.floor(s / 3600)
  const min = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return hrs > 0 ? `${hrs}:${String(min).padStart(2, '0')}:${sec}` : `${min}:${sec}`
}
const short = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(n)
// When to recommend /compact (rule of thumb: quality drops around 300-400K tokens, task dependent)
// soft: suggest at 300K (or 50% of a smaller window); hard: urge at 400K (or 70%)
const compactAt = (win: number): number => Math.min(300_000, Math.round(win * 0.5))
const compactHard = (win: number): number => Math.min(400_000, Math.round(win * 0.7))
const usd = (n: number | null): string => (n === null ? '—' : `$${n.toFixed(2)}`)
const inTime = (iso: string | null, now: number): string => {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (!(ms > 0)) return 'resets now'
  const m = Math.round(ms / 60000)
  const d = Math.floor(m / 1440)
  const hr = Math.floor((m % 1440) / 60)
  return d > 0 ? `resets in ${d}d ${hr}h` : hr > 0 ? `resets in ${hr}h ${m % 60}m` : `resets in ${m}m`
}

async function pull($: any): Promise<void> {
  const u = await $.session.usage()
  const limits: Limit[] = (u.rateLimits ?? []).map((r: any) => ({ kind: r.kind, percent: r.percentUsed, resetsAt: r.resetsAt ?? null }))
  const c = u.context ?? {}
  await update($, hud, st => ({
    ...st, limits, costUsd: u.cost?.usd ?? null,
    ctxTokens: c.tokens ?? null, ctxWindow: c.window ?? st.ctxWindow, ctxPercent: c.percent ?? null,
  }))
  // One nudge per crossing; it re-arms after a compaction brings the window back under
  const st = await read($, hud)
  const isOver = st.ctxTokens !== null && st.ctxWindow > 0 && st.ctxTokens >= compactAt(st.ctxWindow)
  if (isOver && !st.nudged) {
    $.ui.toast(`💡 Context passed ${short(compactAt(st.ctxWindow))} tokens: Compact recommended 300-400K+ (if 1M context window)`)
    await update($, hud, x => ({ ...x, nudged: true }))
  } else if (!isOver && st.nudged) {
    await update($, hud, x => ({ ...x, nudged: false }))
  }
}

export const register: Register = on => {
  let startedAt = 0
  let tick: { cancel: () => void } | null = null

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await pull($)
    return r
  })

  on('prompt.submit', async ($, e, next) => {
    startedAt = await $.clock.now()
    await update($, hud, st => ({ ...st, isRunning: true, turnSeconds: 0 }))
    tick?.cancel()
    tick = $.clock.every(1000, async () => {
      const s = Math.round(((await $.clock.now()) - startedAt) / 1000)
      await update($, hud, st => ({ ...st, turnSeconds: s }))
    })
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    tick?.cancel()
    tick = null
    const s = Math.round(((await $.clock.now()) - startedAt) / 1000)
    // Every finished prompt adds its time to the session total
    await update($, hud, st => ({ ...st, isRunning: false, turnSeconds: s, totalSeconds: (st.totalSeconds ?? 0) + s }))
    await pull($)
    if (s >= 120) $.ui.toast(`✅ Turn finished in ${clock(s)}`)
    return r
  })

  // Keep the context window live during a turn
  on('tool.call', async ($, e, next) => {
    const r = await next(e)
    await pull($)
    return r
  })

  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    await pull($)
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below

    const st = await read($, hud)
    const now = await $.clock.now()
    const { Box, Text, Button } = $.ui.resolve(e)
    const W = Math.max(20, (e.props.bodyColumns ?? 80) - 6)

    // Section header: the mod's name
    const header = <Text bold color="blueBright" wrap="truncate">{'⚡ Session Tracker'}</Text>
    const five = st.limits.find(l => l.kind === 'five_hour')

    const ctxLeft = st.ctxTokens === null ? st.ctxWindow : Math.max(0, st.ctxWindow - st.ctxTokens)
    // Two clocks: the prompt running now (or the last one), and every prompt of the session added up
    const total = (st.totalSeconds ?? 0) + (st.isRunning ? st.turnSeconds : 0)
    // Labels in blue, values in their own color
    const label = (t: string) => <Text bold color="blueBright">{t}</Text>

    // Side-by-side cards: each metric is a small titled column, and the cards wrap with the width
    const bar = (cells: number, pct: number | null) => {
      const p = pct ?? 0
      const filled = Math.max(pct === null ? 0 : 1, Math.min(cells, Math.round((p / 100) * cells)))
      return [
        <Text color={tone(p)}>{'█'.repeat(filled)}</Text>,
        <Text dimColor>{'░'.repeat(Math.max(0, cells - filled))}</Text>,
        <Text bold color={tone(p)}>{pct === null ? ' —' : ` ${Math.round(p)}%`}</Text>,
      ]
    }
    const reset5 = five ? inTime(five.resetsAt, now) : ''
    const card = (width: number, ...rowsOfSpans: any[][]) => (
      <Box flexDirection="column" width={width}>
        {rowsOfSpans.map(spans => <Text wrap="truncate">{spans}</Text>)}
      </Box>
    )
    const isOver = st.ctxTokens !== null && st.ctxWindow > 0 && st.ctxTokens >= compactAt(st.ctxWindow)
    const isHard = isOver && st.ctxTokens !== null && st.ctxTokens >= compactHard(st.ctxWindow)
    const compactBtn = (
      <Button
        key="compact"
        label={isOver ? 'Compact now' : 'Compact'}
        variant={isOver ? 'primary' : 'secondary'}
        onPress={() => $.session.compact()}
      />
    )
    const ctxNote = st.ctxTokens === null
      ? <Text dimColor>no data yet</Text>
      : isHard
        ? <Text bold color="red">{`⚠ ${short(st.ctxTokens)} · Compact recommended 300-400K+ (if 1M context window)`}</Text>
        : isOver
        ? <Text color="yellow">{`💡 ${short(st.ctxTokens)} · Compact recommended 300-400K+ (if 1M context window)`}</Text>
        : <Text dimColor>{`${short(ctxLeft)} left of ${short(st.ctxWindow)}`}</Text>
    const ctxCard = (w: number) => (
      <Box flexDirection="column" width={w}>
        <Text wrap="truncate">{label('🧠 Context window')}</Text>
        <Text wrap="truncate">{bar(Math.max(4, w - 6), st.ctxPercent)}</Text>
        <Text wrap="truncate">{ctxNote}</Text>
        {compactBtn}
      </Box>
    )
    const fiveCard = (w: number) => card(w,
      [label('⚡ 5-hour limit')],
      five ? bar(Math.max(4, w - 6), five.percent) : [<Text dimColor>after the first reply</Text>],
      [<Text dimColor>{reset5 ? `↻ ${reset5.replace('resets in ', '')}` : ''}</Text>],
    )
    const timeCard = (w: number) => card(w,
      [label('⏱ Prompt time')],
      [<Text dimColor>{st.isRunning ? 'now  ' : 'last  '}</Text>, <Text bold color={st.isRunning ? 'cyan' : undefined}>{clock(st.turnSeconds)}</Text>],
      [<Text dimColor>{'all   '}</Text>, <Text bold>{clock(total)}</Text>],
    )
    const costCard = (w: number) => card(w,
      [label('💵 Session cost')],
      [<Text bold color="green">{usd(st.costUsd)}</Text>],
      [<Text dimColor>{'this session'}</Text>],
    )
    // One line for the clocks and the cost, used when only two cards fit across
    const statsLine = (
      <Text wrap="truncate">
        {label('⏱ ')}<Text bold color={st.isRunning ? 'cyan' : undefined}>{clock(st.turnSeconds)}</Text>
        <Text dimColor>{st.isRunning ? ' now' : ' last'}</Text>
        <Text dimColor>{'  ·  '}</Text>
        {label('⌛ ')}<Text bold>{clock(total)}</Text><Text dimColor>{' all'}</Text>
        <Text dimColor>{'  ·  '}</Text>
        {label('💵 ')}<Text bold color="green">{usd(st.costUsd)}</Text>
      </Text>
    )

    const GAP = 3
    let rows: any[]
    if (W >= 96) {
      // Wide: four cards in one band
      const w = Math.floor((W - GAP * 3) / 4)
      rows = [<Box flexDirection="row" columnGap={GAP}>{ctxCard(w)}{fiveCard(w)}{timeCard(w)}{costCard(w)}</Box>]
    } else if (W >= 40) {
      // Medium and split view: the two gauges side by side, then one stats line
      const w = Math.floor((W - GAP) / 2)
      rows = [<Box flexDirection="row" columnGap={GAP}>{ctxCard(w)}{fiveCard(w)}</Box>, statsLine]
    } else {
      // Very narrow: one compact line per gauge, then the stats
      const cells = Math.max(4, W - 26)
      rows = [
        <Text wrap="truncate">{label('🧠 ')}{bar(cells, st.ctxPercent)}<Text dimColor>{st.ctxTokens === null ? '' : ` ${short(ctxLeft)} left`}</Text></Text>,
        <Text wrap="truncate">{label('⚡ ')}{five ? bar(cells, five.percent) : <Text dimColor>—</Text>}<Text dimColor>{reset5 ? ` ↻ ${reset5.replace('resets in ', '')}` : ''}</Text></Text>,
        statsLine,
        <Box>{isOver ? <Text color="yellow">{'💡 Compact recommended 300-400K+ (if 1M context window)  '}</Text> : <Text>{''}</Text>}{compactBtn}</Box>,
      ]
    }

    return (
      <Box flexDirection="column">
        {header}
        {rows}
        {below}
      </Box>
    )
  })
}
