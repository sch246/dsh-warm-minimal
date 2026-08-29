import Schema from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { promptAssemblySourceInventory } from '@deepseek-ai/dsh-system-prompt'
import { ASSIGNMENTS, DEFAULT_CONFIG } from './config.mjs'
import { createWarmRuntime } from './runtime.mjs'

const Assignment = Schema.union(ASSIGNMENTS.map(value => Schema.const(value)))

export const Config = Schema.object({
  bootstrapEnabled: Schema.boolean().default(DEFAULT_CONFIG.bootstrapEnabled),
  bootstrapMessage: Schema.string().default(DEFAULT_CONFIG.bootstrapMessage),
  guidance: Schema.string().default(DEFAULT_CONFIG.guidance),
  promptAssignments: Schema.dict(Assignment).default({}),
  toolAssignments: Schema.dict(Assignment).default({}),
})

/** Register the one settings authority and install the Host-plane runtime. */
export function applyHost(ctx, config) {
  const settings = ctx.settings.register(settingsNamespace('warm-minimal'), Config, {
    base: config,
    applies: 'live',
  })
  const runtime = createWarmRuntime({
    agents: ctx.agents,
    promptAssemblySourceInventory,
    getConfig: () => settings.get(),
  })
  ctx.provide('warmMinimalRuntime', runtime)
  runtime.install(ctx)
}
