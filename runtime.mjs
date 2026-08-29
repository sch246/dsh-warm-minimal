import { assignmentFor, DEFAULT_CONFIG } from './config.mjs'

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

function groupedInventory(inventory, defaultAssignmentFor) {
  const sources = new Map()
  for (const kind of ['sections', 'contexts']) {
    for (const entry of inventory[kind]) {
      let row = sources.get(entry.source)
      if (row === undefined) {
        row = { source: entry.source, sections: [], contexts: [], tools: [] }
        sources.set(entry.source, row)
      }
      if (!row[kind].includes(entry.name)) row[kind].push(entry.name)
    }
  }
  for (const entry of inventory.tools) {
    let row = sources.get(entry.source)
    if (row === undefined) {
      row = { source: entry.source, sections: [], contexts: [], tools: [] }
      sources.set(entry.source, row)
    }
    const index = row.tools.findIndex(tool => tool.name === entry.name)
    const tool = entry.description === undefined
      ? { name: entry.name }
      : { name: entry.name, description: entry.description }
    if (index === -1) row.tools.push(tool)
    else if (row.tools[index].description === undefined && tool.description !== undefined) row.tools[index] = tool
  }
  return [...sources.values()].map(row => ({
    source: row.source,
    promptDefault: defaultAssignmentFor('prompt', row.source),
    toolDefault: defaultAssignmentFor('tool', row.source),
    sections: [...row.sections],
    contexts: [...row.contexts],
    tools: row.tools.map(tool => ({ ...tool })),
  }))
}

/** Build the dependency-injected warm runtime used by the Host plugin. */
export function createWarmRuntime({ agents, promptAssemblySourceInventory, getConfig = () => DEFAULT_CONFIG }) {
  const active = new WeakMap()
  const rosterRegistrations = new Set()
  const observedCandidates = new WeakMap()
  let inventory = []

  const rosterFor = (kind) => {
    const merged = new Map()
    for (const registration of rosterRegistrations) {
      for (const [source, assignment] of registration[kind]) {
        const previous = merged.get(source)
        if (previous !== undefined && previous !== assignment) {
          throw new Error(`dsh-warm-minimal: conflicting package assignment for source ${JSON.stringify(source)}`)
        }
        merged.set(source, assignment)
      }
    }
    return merged
  }

  const defaultAssignmentFor = (kind, source) => assignmentFor(source, {}, rosterFor(kind))

  const resolvedAssignmentFor = (kind, source, config) => {
    const saved = kind === 'tool' ? config.toolAssignments : config.promptAssignments
    return saved[source] ?? defaultAssignmentFor(kind, source)
  }

  const registerRoster = ({ promptAssignments, toolAssignments }) => {
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

  const observeCandidate = (context, candidate) => {
    let candidates = observedCandidates.get(context)
    if (candidates === undefined) {
      candidates = []
      observedCandidates.set(context, candidates)
    }
    candidates.push(candidate)
  }

  const admitSource = (context, candidate) => {
    const role = resolvedRole(context)
    if (role === undefined) return true
    observeCandidate(context, candidate)
    const state = active.get(context.agent.session)
    if (state !== undefined && !state.promoted) return true
    const config = getConfig()
    const kind = candidate.kind === 'tool' ? 'tool' : 'prompt'
    return allowed(resolvedAssignmentFor(kind, candidate.source, config), role)
  }

  async function runBootstrap(ctx, agent, state) {
    const { session } = agent
    try {
      agent.followup(bootstrapMessage(getConfig().bootstrapMessage))
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
    if (!getConfig().bootstrapEnabled) return
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
    const sourceInventory = promptAssemblySourceInventory(assembly)
    const observed = observedCandidates.get(context) ?? []
    observedCandidates.delete(context)
    inventory = groupedInventory({
      sections: [
        ...observed.filter(candidate => candidate.kind === 'section').map(candidate => ({ name: candidate.name, source: candidate.source })),
        ...sourceInventory.sections,
      ],
      contexts: [
        ...observed.filter(candidate => candidate.kind === 'context').map(candidate => ({ name: candidate.name, source: candidate.source })),
        ...sourceInventory.contexts,
      ],
      tools: [
        ...observed.filter(candidate => candidate.kind === 'tool').map(candidate => ({ name: candidate.name, source: candidate.source })),
        ...sourceInventory.tools.map((entry, index) => ({
          ...entry,
          description: assembly.tools[index]?.description,
        })),
      ],
    }, defaultAssignmentFor)
    const agent = context.agent
    if (agent === undefined) return assembly
    const state = active.get(agent.session)
    if (state !== undefined && !state.promoted) return minimalBootstrapAssembly(assembly)
    if (resolveSessionPreset(agent.session) !== 'warm-minimal') return assembly
    const config = getConfig()
    const role = roleOf(agents, agent)
    const filter = (entries, sources, kind) => entries.filter((_entry, index) => {
      const source = sources[index]?.source
      return source !== undefined && allowed(resolvedAssignmentFor(kind, source, config), role)
    })
    const sections = filter(assembly.sections, sourceInventory.sections, 'prompt')
    const contexts = filter(assembly.contexts, sourceInventory.contexts, 'prompt')
    const tools = filter(assembly.tools, sourceInventory.tools, 'tool')
    return {
      ...assembly,
      sections: role === 'parent' && config.guidance.length > 0
        ? [...sections, { name: 'dsh-warm-minimal:guidance', text: config.guidance }]
        : sections,
      contexts,
      tools,
    }
  }

  return {
    registerRoster,
    inventorySnapshot: () => structuredClone(inventory),
    install(ctx) {
      ctx.effect(() => ctx.root.on('agent/inbox/inserted', payload => onInserted(ctx, payload), { global: true }), 'dsh-warm-minimal: optional native bootstrap before first real request')
      ctx.effect(() => ctx.systemPrompt.admitSources(admitSource), 'dsh-warm-minimal: role-aware registry source admission')
      ctx.effect(() => ctx.on('system-prompt/assemble', async (_assembly, context, next) => project(await next(), context)), 'dsh-warm-minimal: role-aware model assembly projection')
    },
    admitSource,
    project,
  }
}
