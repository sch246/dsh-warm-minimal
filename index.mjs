/** Warm-minimal Host-plane bootstrap, settings authority, and model projection. */
import { Config, applyHost } from './host.mjs'

export const name = 'dsh-warm-minimal'
export const inject = ['agents', 'settings', 'systemPrompt']
export { Config }

export function apply(ctx, config) {
  applyHost(ctx, config)
}
