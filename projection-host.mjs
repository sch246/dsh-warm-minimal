import { hostSourceId } from '@deepseek-ai/dsh-system-prompt'
import { applyPresetProjection } from './projection.mjs'

export const name = 'dsh-warm-minimal-roster-projection'
export const inject = ['warmMinimalRuntime']

/** Apply package roster defaults from this preset Loader tree. */
export function apply(ctx) {
  return applyPresetProjection(ctx, {
    hostSourceId,
    registerRoster: defaults => ctx.warmMinimalRuntime.registerRoster(defaults),
  })
}

