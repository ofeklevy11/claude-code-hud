import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Meter } from '../types'

const meter = atom({ plugin: 'context-meter', key: 'meter' } as const, null)
const CELLS = 24

const short = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  : n >= 1_000 ? `${Math.round(n / 1_000)}K`
  : String(n)

const tone = (p: number): string => (p >= 80 ? 'red' : p >= 50 ? 'yellow' : 'green')
const mood = (p: number): string =>
  p >= 90 ? 'almost full, compaction soon' : p >= 80 ? 'filling up, consider wrapping up' : p >= 50 ? 'halfway' : 'plenty of room'

async function refresh($: any): Promise<void> {
  const { context } = await $.session.usage()
  const m: Meter = { tokens: context.tokens ?? null, window: context.window, percent: context.percent ?? null }
  await update($, meter, () => m)
  $.ui.status(
    m.percent === null
      ? `🧠 Context window: ${short(m.window)} free`
      : `🧠 Context window ${m.percent}% · ${short(m.tokens ?? 0)} of ${short(m.window)}`,
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await refresh($)
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    await refresh($)
    return r
  })

  on('tool.call', async ($, e, next) => {
    const r = await next(e)
    await refresh($)
    return r
  })

  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    await refresh($)
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Keep every other band (e.g. session-hud) beneath this one
    const below = await next(e)
    const m = await read($, meter)
    if (e.props.hasSurvey || m === null) return below

    const { Box, Text } = $.ui.resolve(e)
    const p = m.percent ?? 0
    const pct = m.percent === null ? '—' : `${p}%`
    const left = m.tokens === null ? m.window : Math.max(0, m.window - m.tokens)
    const W = Math.max(20, (e.props.bodyColumns ?? 80) - 6)

    // One Text per row with colored spans inside: no row ever splits into columns
    const bar = (cells: number) => {
      const filled = Math.max(m.percent === null ? 0 : 1, Math.round((p / 100) * cells))
      return [
        <Text color={tone(p)}>{'█'.repeat(filled)}</Text>,
        <Text dimColor>{'░'.repeat(cells - filled)}</Text>,
      ]
    }
    const detail = m.tokens === null ? 'no data yet' : `${short(m.tokens)} of ${short(m.window)} · ${short(left)} left`

    // Wide: everything on one line
    if (W >= 84) {
      const cells = Math.min(CELLS, W - 64)
      return (
        <Box flexDirection="column">
        <Text wrap="truncate">
          <Text bold>🧠 Context window </Text>
          {bar(cells)}
          <Text bold color={tone(p)}> {pct}</Text>
          <Text dimColor>{`   ${detail}${m.tokens === null ? '' : ` · ${mood(p)}`}`}</Text>
        </Text>
        {below}
        </Box>
      )
    }

    // Medium: title and bar, then the figures
    if (W >= 46) {
      return (
        <Box flexDirection="column">
          <Text wrap="truncate">
            <Text bold>🧠 Context window </Text>
            <Text bold color={tone(p)}>{pct} </Text>
            {bar(Math.max(8, Math.min(CELLS, W - 26)))}
          </Text>
          <Text dimColor wrap="truncate">{`   ${detail}${m.tokens === null ? '' : ` · ${mood(p)}`}`}</Text>
          {below}
        </Box>
      )
    }

    // Narrow (split view): compact bar, then the essentials
    return (
      <Box flexDirection="column">
        <Text wrap="truncate">
          <Text bold>🧠 </Text>
          <Text bold color={tone(p)}>{pct} </Text>
          {bar(Math.max(6, W - 10))}
        </Text>
        <Text dimColor wrap="truncate">{m.tokens === null ? 'no data yet' : `${short(left)} left of ${short(m.window)}`}</Text>
        {below}
      </Box>
    )
  })
}
