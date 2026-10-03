export type Limit = { kind: string; percent: number; resetsAt: string | null }
export type Hud = {
  limits: Limit[]
  costUsd: number | null
  isRunning: boolean
  turnSeconds: number
  totalSeconds: number
  ctxTokens: number | null
  ctxWindow: number
  ctxPercent: number | null
  nudged: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'session-hud': { hud: Hud }
  }
}
