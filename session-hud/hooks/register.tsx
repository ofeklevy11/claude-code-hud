import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Hud, Limit } from '../types'

const EMPTY: Hud = { limits: [], costUsd: null, turnCostUsd: null, isRunning: false, turnSeconds: 0, turnTools: 0 }
const hud = atom({ plugin: 'session-hud', key: 'hud' } as const, EMPTY)

const CELLS = 12
const LABELS: Record<string, string> = { five_hour: '5-hour', seven_day: 'Weekly', spend_limit: 'Spend' }
const ICONS: Record<string, string> = { five_hour: '⚡', seven_day: '📅', spend_limit: '💳' }

const tone = (p: number): string => (p >= 85 ? 'red' : p >= 60 ? 'yellow' : 'green')
const clock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
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

async function pull($: any, costAtStart: number | null): Promise<void> {
  const u = await $.session.usage()
  const limits: Limit[] = (u.rateLimits ?? []).map((r: any) => ({ kind: r.kind, percent: r.percentUsed, resetsAt: r.resetsAt ?? null }))
  const cost = u.cost?.usd ?? null
  await update($, hud, st => ({
    ...st,
    limits,
    costUsd: cost,
    turnCostUsd: cost !== null && costAtStart !== null ? Math.max(0, cost - costAtStart) : st.turnCostUsd,
  }))
}

export const register: Register = on => {
  let startedAt = 0
  let costAtStart: number | null = null
  let tick: { cancel: () => void } | null = null

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await pull($, null)
    return r
  })

  on('prompt.submit', async ($, e, next) => {
    startedAt = await $.clock.now()
    costAtStart = (await $.session.usage()).cost?.usd ?? null
    await update($, hud, st => ({ ...st, isRunning: true, turnSeconds: 0, turnTools: 0, turnCostUsd: 0 }))
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
    await update($, hud, st => ({ ...st, isRunning: false, turnSeconds: s }))
    await pull($, costAtStart)
    if (s >= 120) $.ui.toast(`✅ Turn finished in ${clock(s)}`)
    return r
  })

  // Count every tool call of the turn
  on('tool.call', async ($, e, next) => {
    const r = await next(e)
    await update($, hud, st => ({ ...st, turnTools: st.turnTools + 1 }))
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below

    const st = await read($, hud)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)
    const W = Math.max(20, (e.props.bodyColumns ?? 80) - 6)
    const SEP = '   │   '

    // Each piece is a list of spans; a row is one Text holding them, so it never splits into columns
    const limitSpans = (l: Limit, cells: number, compact: boolean) => {
      const filled = Math.max(l.percent > 0 ? 1 : 0, Math.min(cells, Math.round((l.percent / 100) * cells)))
      const reset = inTime(l.resetsAt, now)
      return [
        <Text bold>{`${ICONS[l.kind] ?? '•'} ${compact ? '' : `${LABELS[l.kind] ?? l.kind} `}`}</Text>,
        <Text color={tone(l.percent)}>{'█'.repeat(filled)}</Text>,
        <Text dimColor>{'░'.repeat(cells - filled)}</Text>,
        <Text bold color={tone(l.percent)}>{` ${Math.round(l.percent)}%`}</Text>,
        <Text dimColor>{reset ? ` ${compact ? reset.replace('resets in ', '↻ ') : reset}` : ''}</Text>,
      ]
    }
    const turnSpans = (compact: boolean) => [
      st.isRunning
        ? <Text bold color="cyan">{`⏱ ${compact ? '' : 'Turn '}${clock(st.turnSeconds)}`}</Text>
        : <Text bold>{`⏱ ${compact ? '' : 'Last turn '}${clock(st.turnSeconds)}`}</Text>,
      <Text dimColor>{` · ${st.turnTools} ${compact ? 'tools' : 'tool calls'}`}</Text>,
    ]
    const costSpans = (compact: boolean) => [
      <Text bold color="green">{`💵 ${compact ? '' : 'Session '}${usd(st.costUsd)}`}</Text>,
    ]
    const row = (...spans: any[]) => <Text wrap="truncate">{spans}</Text>
    const sep = <Text dimColor>{SEP}</Text>
    const noLimits = <Text dimColor wrap="truncate">⚡ 5-hour limit appears after the first reply</Text>
    // Only the 5-hour window is shown
    const five = st.limits.find(l => l.kind === 'five_hour')

    let rows: any[]
    if (W >= 84) {
      // Wide: one row
      const cells = Math.max(8, Math.min(CELLS, W - 64))
      rows = [
        row(
          ...(five ? limitSpans(five, cells, false) : [<Text dimColor>⚡ 5-hour limit after the first reply</Text>]),
          sep, ...turnSpans(false),
          sep, ...costSpans(false),
        ),
      ]
    } else if (W >= 46) {
      // Medium: the limit, then the turn
      const cells = Math.max(8, Math.min(CELLS, W - 36))
      rows = [
        five ? row(...limitSpans(five, cells, false)) : noLimits,
        row(...turnSpans(false), sep, ...costSpans(false)),
      ]
    } else {
      // Narrow (split view): compact rows, short labels
      const cells = Math.max(5, Math.min(10, W - 22))
      rows = [
        five ? row(...limitSpans(five, cells, true)) : noLimits,
        row(...turnSpans(true)),
        row(...costSpans(true)),
      ]
    }

    return (
      <Box flexDirection="column">
        {rows}
        {below}
      </Box>
    )
  })
}
