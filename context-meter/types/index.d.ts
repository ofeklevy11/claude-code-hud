export type Meter = { tokens: number | null; window: number; percent: number | null }

declare module 'claude-code' {
  interface PluginState {
    'context-meter': { meter: Meter | null }
  }
}
