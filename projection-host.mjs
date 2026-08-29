import Schema from '@deepseek-ai/schemastery'
import { hostSourceId, PERSONA_ORDER } from '@deepseek-ai/dsh-system-prompt'
import { applyPresetProjection } from './projection.mjs'

export const name = 'dsh-warm-minimal-roster-projection'
export const inject = ['systemPrompt', 'warmMinimalRuntime']

export const Config = Schema.object({
  workerPersona: Schema.string().required(),
})

/** Apply package roster defaults from this preset Loader tree. */
export function apply(ctx, config) {
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'dsh-warm-minimal:worker-persona',
    order: PERSONA_ORDER,
    text: config.workerPersona,
  }), 'dsh-warm-minimal: child-only worker persona')
  return applyPresetProjection(ctx, {
    hostSourceId,
    registerRoster: defaults => ctx.warmMinimalRuntime.registerRoster(defaults),
  })
}
