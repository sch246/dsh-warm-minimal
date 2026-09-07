import Schema from '@deepseek-ai/schemastery'
import { promptAssemblySourceInventory } from '@deepseek-ai/dsh-system-prompt'
import { ASSIGNMENTS, DEFAULT_CONFIG, parseToolSchemaId } from './config.mjs'
import { createWarmRuntime } from './runtime.mjs'
import { WarmMinimalRemote } from '#warm-minimal-remote'

const Assignment = Schema.union(ASSIGNMENTS.map(value => Schema.const(value)))
const ToolSchemaId = Schema.transform(Schema.string(), (value) => {
  parseToolSchemaId(value)
  return value
}, true)

export const Config = Schema.object({
  bootstrapEnabled: Schema.boolean().default(DEFAULT_CONFIG.bootstrapEnabled),
  bootstrapMessage: Schema.string().default(DEFAULT_CONFIG.bootstrapMessage),
  guidance: Schema.string().default(DEFAULT_CONFIG.guidance),
  promptAssignments: Schema.dict(Assignment).default({}),
  toolAssignments: Schema.dict(Assignment, ToolSchemaId).default({}),
})

/** Register the one settings authority and install the Host-plane runtime. */
export function applyHost(ctx, config) {
  const settings = ctx.settings.register('warm-minimal', Config, {
    base: config,
    applies: 'live',
  })
  const runtime = createWarmRuntime({
    agents: ctx.agents,
    promptAssemblySourceInventory,
    getConfig: () => settings.get(),
  })
  ctx.provide('warmMinimalRuntime', runtime)
  new WarmMinimalRemote(ctx, {
    async queryInventory() {
      const scope = await ctx.agentPresets.standingKeyFor('warm-minimal')
      const assembly = await ctx.systemPrompt.assemble({ scope })
      return runtime.inventoryFor(assembly)
    },
  })
  runtime.install(ctx)
}
