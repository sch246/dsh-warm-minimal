import {
  assignmentFor,
  DEFAULT_CONFIG,
  makeToolSchemaId,
  validateToolAssignmentMap,
} from './config.mjs'

export const BOOTSTRAP_ID_PREFIX = 'dsh-warm-minimal:bootstrap:'
export const PLATFORM_SHELL = process.platform === 'win32' ? 'pwsh' : 'bash'
export const BOOTSTRAP_TOOL_NAMES = Object.freeze([PLATFORM_SHELL, 'str_replace_editor'])
export const BOOTSTRAP_SYSTEM_PROMPT = 'You are a helpful software engineer assistant.'

function resolveSessionPreset(session) {
  for (let index = session.events.length - 1; index >= 0; index -= 1) {
    const event = session.events[index]
    if (event.type === 'agent-preset/selected') return event.data.agentPreset
  }
  return session.header?.agentPreset
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function bootstrapMessage(text) {
  return {
    id: `${BOOTSTRAP_ID_PREFIX}${globalThis.crypto.randomUUID()}`,
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'user' },
  }
}

function minimalBootstrapAssembly(assembly) {
  const tools = BOOTSTRAP_TOOL_NAMES.map((name) => {
    const matches = assembly.tools.filter(tool => tool.name === name)
    if (matches.length !== 1) {
      throw new Error('dsh-warm-minimal: required bootstrap tools are unavailable or ambiguous')
    }
    return matches[0]
  })
  return {
    ...assembly,
    sections: [{ name: 'dsh-warm-minimal:bootstrap', text: BOOTSTRAP_SYSTEM_PROMPT }],
    contexts: [],
    tools,
    variables: {},
  }
}

function roleOf(agents, agent) {
  if ((agent.session.header?.delegationDepth ?? 0) > 0) return 'child'
  const live = agents.get(agent.id)
  if (live !== agent) return 'parent'
  return agents.roots().includes(agent) ? 'parent' : 'child'
}

function allowed(assignment, role) {
  return assignment === 'shared' || assignment === `${role}-only`
}

function assertContributionPart(label, value, maximum) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximum) {
    throw new TypeError(`dsh-warm-minimal: ${label} must contain 1-${maximum} characters`)
  }
}

function assertAssignment(assignment, id) {
  if (assignment !== 'parent-only' && assignment !== 'child-only' && assignment !== 'shared') {
    throw new TypeError(`dsh-warm-minimal: invalid package assignment for ${JSON.stringify(id)}`)
  }
}

/** Build the dependency-injected warm runtime used by the Host plugin. */
export function createWarmRuntime({ agents, promptAssemblySourceInventory, getConfig = () => DEFAULT_CONFIG }) {
  const active = new WeakMap()
  const rosterRegistrations = new Set()

  const rosterFor = (kind) => {
    const merged = new Map()
    for (const registration of rosterRegistrations) {
      for (const [id, assignment] of registration[kind]) {
        const previous = merged.get(id)
        if (previous !== undefined && previous !== assignment) {
          throw new Error(`dsh-warm-minimal: conflicting package assignment for ${JSON.stringify(id)}`)
        }
        merged.set(id, assignment)
      }
    }
    return merged
  }

  const defaultAssignmentFor = (kind, id) => assignmentFor(id, {}, rosterFor(kind))

  const resolvedConfig = () => {
    const config = getConfig()
    validateToolAssignmentMap(config.toolAssignments)
    return config
  }

  const resolvedAssignmentFor = (kind, id, config) => {
    const saved = kind === 'tool' ? config.toolAssignments : config.promptAssignments
    return saved[id] ?? defaultAssignmentFor(kind, id)
  }

  const registerRoster = ({ promptAssignments, toolAssignments }) => {
    validateToolAssignmentMap(toolAssignments)
    for (const [source, assignment] of Object.entries(promptAssignments)) {
      assertContributionPart('prompt source', source, 4096)
      assertAssignment(assignment, source)
    }
    const registration = {
      prompt: new Map(Object.entries(promptAssignments)),
      tool: new Map(Object.entries(toolAssignments)),
    }
    rosterRegistrations.add(registration)
    return () => rosterRegistrations.delete(registration)
  }

  const resolvedRole = (context) => {
    const agent = context.agent
    if (agent === undefined || resolveSessionPreset(agent.session) !== 'warm-minimal') return undefined
    return roleOf(agents, agent)
  }

  const admitSource = (context, candidate) => {
    const role = resolvedRole(context)
    if (role === undefined) return true
    const state = active.get(context.agent.session)
    if (state !== undefined && !state.promoted) return true
    const config = resolvedConfig()
    if (candidate.kind === 'tool') {
      const id = makeToolSchemaId(candidate.source, candidate.name)
      return allowed(resolvedAssignmentFor('tool', id, config), role)
    }
    assertContributionPart('prompt source', candidate.source, 4096)
    assertContributionPart(`${candidate.kind} name`, candidate.name, 1024)
    return allowed(resolvedAssignmentFor('prompt', candidate.source, config), role)
  }

  const sourceInventoryFor = (assembly) => {
    const inventory = promptAssemblySourceInventory(assembly)
    for (const kind of ['sections', 'contexts', 'tools']) {
      const entries = assembly[kind]
      const sources = inventory[kind]
      if (!Array.isArray(sources) || sources.length !== entries.length) {
        throw new Error(`dsh-warm-minimal: ${kind} source inventory does not align with assembly`)
      }
      for (let index = 0; index < entries.length; index += 1) {
        const sourceEntry = sources[index]
        if (sourceEntry?.name !== entries[index]?.name) {
          throw new Error(`dsh-warm-minimal: ${kind} source/name inventory does not align at index ${index}`)
        }
        assertContributionPart(`${kind} source`, sourceEntry.source, 4096)
        assertContributionPart(`${kind} name`, sourceEntry.name, kind === 'tools' ? 256 : 1024)
      }
    }
    const seen = new Set()
    for (const entry of inventory.tools) {
      const id = makeToolSchemaId(entry.source, entry.name)
      if (seen.has(id)) {
        throw new Error(`dsh-warm-minimal: duplicate tool schema contribution ${JSON.stringify(id)}`)
      }
      seen.add(id)
    }
    return inventory
  }

  const inventoryFor = (assembly) => {
    const sourceInventory = sourceInventoryFor(assembly)
    const grouped = new Map()
    for (const kind of ['sections', 'contexts']) {
      for (const entry of sourceInventory[kind]) {
        let row = grouped.get(entry.source)
        if (row === undefined) {
          row = { source: entry.source, sections: [], contexts: [] }
          grouped.set(entry.source, row)
        }
        if (!row[kind].includes(entry.name)) row[kind].push(entry.name)
      }
    }
    return {
      promptSources: [...grouped.values()].map(row => ({
        source: row.source,
        defaultAssignment: defaultAssignmentFor('prompt', row.source),
        sections: [...row.sections],
        contexts: [...row.contexts],
      })),
      tools: sourceInventory.tools.map((entry, index) => {
        const id = makeToolSchemaId(entry.source, entry.name)
        return {
          id,
          source: entry.source,
          name: entry.name,
          description: assembly.tools[index].description,
          defaultAssignment: defaultAssignmentFor('tool', id),
        }
      }),
    }
  }

  async function runBootstrap(ctx, agent, state) {
    const { session } = agent
    try {
      agent.followup(bootstrapMessage(resolvedConfig().bootstrapMessage))
      await agent.whenIdle()
    } catch (error) {
      ctx.logger.warn(`dsh-warm-minimal: bootstrap failed for ${session.id}: ${errorMessage(error)}`)
    }
    state.promoted = true
    state.restoring = true
    for (const message of state.held) {
      try {
        agent.followup(message)
      } catch (error) {
        ctx.logger.warn(`dsh-warm-minimal: failed to restore ${message.id} for ${session.id}: ${errorMessage(error)}`)
      }
    }
    active.delete(session)
  }

  const onInserted = (ctx, { agent, message: input }) => {
    if (input.source?.kind !== 'user') return
    if (typeof input.id === 'string' && input.id.startsWith(BOOTSTRAP_ID_PREFIX)) return
    const { session } = agent
    const state = active.get(session)
    if (state !== undefined) {
      if (state.restoring) return
      if (agent.inbox.remove(input.id)) state.held.push(input)
      else ctx.logger.warn(`dsh-warm-minimal: failed to hold ${input.id} during bootstrap for ${session.id}`)
      return
    }
    if (!resolvedConfig().bootstrapEnabled) return
    if (resolveSessionPreset(session) !== 'warm-minimal') return
    if (session.events.some(event => event.type === 'turn/start')) return
    if (!agent.inbox.remove(input.id)) {
      ctx.logger.warn(`dsh-warm-minimal: failed to hold first input ${input.id} for ${session.id}`)
      return
    }
    const next = { held: [input], restoring: false, promoted: false }
    active.set(session, next)
    void runBootstrap(ctx, agent, next)
  }

  const project = (assembly, context) => {
    const sourceInventory = sourceInventoryFor(assembly)
    const agent = context.agent
    if (agent === undefined) return assembly
    const state = active.get(agent.session)
    if (state !== undefined && !state.promoted) return minimalBootstrapAssembly(assembly)
    if (resolveSessionPreset(agent.session) !== 'warm-minimal') return assembly
    const config = resolvedConfig()
    const role = roleOf(agents, agent)
    const filterPrompts = (entries, sources) => entries.filter((_entry, index) =>
      allowed(resolvedAssignmentFor('prompt', sources[index].source, config), role))
    const admittedTools = assembly.tools.flatMap((tool, index) => {
      const source = sourceInventory.tools[index].source
      const id = makeToolSchemaId(source, tool.name)
      return allowed(resolvedAssignmentFor('tool', id, config), role) ? [{ tool, source }] : []
    })
    const sourceByName = new Map()
    for (const { tool, source } of admittedTools) {
      const previous = sourceByName.get(tool.name)
      if (previous !== undefined && previous !== source) {
        throw new Error(`dsh-warm-minimal: ambiguous ${role} tool ${JSON.stringify(tool.name)} from different sources`)
      }
      sourceByName.set(tool.name, source)
    }
    const sections = filterPrompts(assembly.sections, sourceInventory.sections)
    const contexts = filterPrompts(assembly.contexts, sourceInventory.contexts)
    return {
      ...assembly,
      sections: role === 'parent' && config.guidance.length > 0
        ? [...sections, { name: 'dsh-warm-minimal:guidance', text: config.guidance }]
        : sections,
      contexts,
      tools: admittedTools.map(entry => entry.tool),
    }
  }

  return {
    registerRoster,
    inventoryFor,
    install(ctx) {
      ctx.effect(() => ctx.root.on('agent/inbox/inserted', payload => onInserted(ctx, payload), { global: true }), 'dsh-warm-minimal: optional native bootstrap before first real request')
      ctx.effect(() => ctx.systemPrompt.admitSources(admitSource), 'dsh-warm-minimal: role-aware registry source admission')
      ctx.effect(() => ctx.on('system-prompt/assemble', async (_assembly, context, next) => project(await next(), context)), 'dsh-warm-minimal: role-aware model assembly projection')
    },
    admitSource,
    project,
  }
}
