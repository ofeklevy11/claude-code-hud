export type Limit = { kind: string; percent: number; resetsAt: string | null }
export type Hud = {
  limits: Limit[]
  costUsd: number | null
  turnCostUsd: number | null
  isRunning: boolean
  turnSeconds: number
  totalSeconds: number
}

declare module 'claude-code' {
  interface PluginState {
    'session-hud': { hud: Hud }
  }
}
