import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_CONFIG,
  makeToolSchemaId,
  parseToolSchemaId,
  validateToolAssignmentMap,
} from '../config.mjs'
import {
  BOOTSTRAP_SYSTEM_PROMPT,
  BOOTSTRAP_TOOL_NAMES,
  createWarmRuntime,
} from '../runtime.mjs'
import { applyPresetProjection, PACKAGE_ROSTER_ENTRY_IDS } from '../projection.mjs'

function deferred() {
  const result = Promise.withResolvers()
  return result
}

function nextTask() {
  return new Promise(resolve => setImmediate(resolve))
}

function setup(config = {}) {
  let inserted
  let assemble
  let admitSource
  const registrations = []
  const warnings = []
  const roots = []
  const live = new Map()
  const sourceOf = new WeakMap()
  let resolved = {
    ...DEFAULT_CONFIG,
    ...config,
    promptAssignments: { ...DEFAULT_CONFIG.promptAssignments, ...config.promptAssignments },
    toolAssignments: { ...DEFAULT_CONFIG.toolAssignments, ...config.toolAssignments },
  }
  const agents = {
    get: id => live.get(id),
    roots: () => [...roots],
  }
  const promptAssemblySourceInventory = assembly => ({
    sections: assembly.sections.map(entry => ({ name: entry.name, source: sourceOf.get(entry) ?? 'host-source:unknown' })),
    contexts: assembly.contexts.map(entry => ({ name: entry.name, source: sourceOf.get(entry) ?? 'host-source:unknown' })),
    tools: assembly.tools.map(entry => ({ name: entry.name, source: sourceOf.get(entry) ?? 'host-source:unknown' })),
  })
  const runtime = createWarmRuntime({ agents, promptAssemblySourceInventory, getConfig: () => resolved })
  const ctx = {
    root: {
      on(event, listener, options) {
        registrations.push(event)
        assert.deepEqual(options, { global: true })
        inserted = listener
        return () => {}
      },
    },
    on(event, listener) {
      registrations.push(event)
      assemble = listener
      return () => {}
    },
    systemPrompt: {
      admitSources(predicate) {
        registrations.push('systemPrompt.admitSources')
        admitSource = predicate
        return () => {}
      },
    },
    effect(register) { register() },
    logger: { warn(message) { warnings.push(message) } },
  }
  runtime.install(ctx)
  return {
    runtime,
    warnings,
    registrations,
    mark(source, entry) { sourceOf.set(entry, source); return entry },
    config(next) { resolved = { ...resolved, ...next } },
    root(agent) { live.set(agent.id, agent); roots.push(agent) },
    child(agent) { live.set(agent.id, agent) },
    insert: payload => inserted(payload),
    admitSource: (context, candidate) => admitSource(context, candidate),
    assemble: (assembly, context) => assemble(assembly, context, async () => assembly),
  }
}

const toolId = (source, name) => makeToolSchemaId(source, name)

function session(depth = 0) {
  return {
    id: `session-${depth}`,
    header: { agentPreset: 'warm-minimal', delegationDepth: depth },
    events: [],
  }
}

function userMessage(id, text) {
  return { id, role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }
}

function agentHarness(test, value = session(), idle = deferred()) {
  const pending = new Set()
  const removed = []
  const followed = []
  const agent = {
    id: value.id,
    session: value,
    inbox: { remove(id) { if (!pending.delete(id)) return false; removed.push(id); return true } },
    followup(message) {
      followed.push(message)
      pending.add(message.id)
      test.insert({ agent, message })
    },
    whenIdle: () => idle.promise,
  }
  return {
    agent,
    idle,
    removed,
    followed,
    insert(message) { pending.add(message.id); test.insert({ agent, message }) },
  }
}

function fullAssembly(test) {
  const section = (source, name, text) => test.mark(source, { name, text })
  const tool = (source, name) => test.mark(source, { name, description: name, parameters: {} })
  return {
    sections: [
      section('source-shared', 'persona', 'persona'),
      section('source-parent', 'parent-prompt', 'parent'),
      section('source-child', 'child-prompt', 'child'),
      section('source-unknown', 'unknown-prompt', 'unknown'),
    ],
    contexts: [
      section('source-parent', 'parent-context', 'parent'),
      section('source-child', 'child-context', 'child'),
    ],
    tools: [
      tool('source-shared', BOOTSTRAP_TOOL_NAMES[0]),
      tool('source-parent', 'ask_user'),
      tool('source-child', 'read_file'),
      tool('source-shared', 'str_replace_editor'),
      tool('source-unknown', 'third_party'),
    ],
    variables: { secret: 'not bootstrap-visible' },
  }
}

describe('warm-minimal runtime seam', () => {
  it('holds ordered input for one configured native bootstrap and restores it after failure', async () => {
    const test = setup({ bootstrapMessage: 'Configured bootstrap.' })
    const runner = agentHarness(test)
    const first = userMessage('first', 'one')
    const second = userMessage('second', 'two')
    runner.insert(first)
    runner.insert(second)

    assert.deepEqual(runner.removed, ['first', 'second'])
    assert.equal(runner.followed.length, 1)
    assert.match(runner.followed[0].id, /^dsh-warm-minimal:bootstrap:/)
    assert.deepEqual(runner.followed[0].content, [{ type: 'text', text: 'Configured bootstrap.' }])

    runner.idle.reject(new Error('provider unavailable'))
    await nextTask()
    assert.deepEqual(runner.followed.slice(1), [first, second])
    assert.match(test.warnings[0], /bootstrap failed.*provider unavailable/)
  })

  it('does not insert a bootstrap when disabled', () => {
    const test = setup({ bootstrapEnabled: false })
    const runner = agentHarness(test)
    runner.insert(userMessage('first', 'real request'))
    assert.deepEqual(runner.removed, [])
    assert.deepEqual(runner.followed, [])
  })

  it('does not bootstrap plugin input, another preset, or an already-started session', () => {
    const test = setup()

    const plugin = agentHarness(test)
    plugin.insert({
      id: 'plugin',
      role: 'user',
      content: [{ type: 'text', text: 'internal' }],
      source: { kind: 'plugin', plugin: 'other' },
    })

    const otherSession = session()
    otherSession.header.agentPreset = 'standard'
    const other = agentHarness(test, otherSession)
    other.insert(userMessage('other', 'ordinary request'))

    const startedSession = session()
    startedSession.events.push({ type: 'turn/start', data: { turn: 1 } })
    const started = agentHarness(test, startedSession)
    started.insert(userMessage('started', 'later request'))

    assert.deepEqual(plugin.removed, [])
    assert.deepEqual(other.removed, [])
    assert.deepEqual(started.removed, [])
  })

  it('makes the bootstrap face exact and fails loud without exposing an unfiltered request', async () => {
    const test = setup()
    const runner = agentHarness(test)
    runner.insert(userMessage('first', 'real'))
    const projected = await test.assemble(fullAssembly(test), { agent: runner.agent })
    assert.deepEqual(projected.sections, [{ name: 'dsh-warm-minimal:bootstrap', text: BOOTSTRAP_SYSTEM_PROMPT }])
    assert.deepEqual(projected.contexts, [])
    assert.deepEqual(projected.tools.map(tool => tool.name), BOOTSTRAP_TOOL_NAMES)
    assert.deepEqual(projected.variables, {})

    const missing = fullAssembly(test)
    missing.tools = missing.tools.filter(tool => tool.name !== 'str_replace_editor')
    await assert.rejects(test.assemble(missing, { agent: runner.agent }), /required bootstrap tools are unavailable or ambiguous/)
  })

  it('promotes to configured parent projection before restoring the held request', async () => {
    const test = setup({ guidance: 'Coordinate.' })
    test.runtime.registerRoster({
      promptAssignments: { 'source-shared': 'shared', 'source-parent': 'parent-only', 'source-child': 'child-only' },
      toolAssignments: {
        [toolId('source-shared', BOOTSTRAP_TOOL_NAMES[0])]: 'shared',
        [toolId('source-shared', 'str_replace_editor')]: 'shared',
        [toolId('source-parent', 'ask_user')]: 'parent-only',
        [toolId('source-child', 'read_file')]: 'child-only',
      },
    })
    const runner = agentHarness(test)
    test.root(runner.agent)
    const original = userMessage('first', 'real')
    runner.insert(original)

    runner.idle.resolve()
    await nextTask()

    const projected = await test.assemble(fullAssembly(test), { agent: runner.agent })
    assert.deepEqual(projected.sections.map(entry => entry.name), [
      'persona',
      'parent-prompt',
      'dsh-warm-minimal:guidance',
    ])
    assert.deepEqual(runner.followed.slice(1), [original])
  })

  it('projects parent and child model assemblies from stable source assignments', async () => {
    const test = setup({ bootstrapEnabled: false, guidance: 'Coordinate.' })
    test.runtime.registerRoster({
      promptAssignments: { 'source-shared': 'shared', 'source-parent': 'parent-only', 'source-child': 'child-only' },
      toolAssignments: {
        [toolId('source-shared', BOOTSTRAP_TOOL_NAMES[0])]: 'shared',
        [toolId('source-shared', 'str_replace_editor')]: 'shared',
        [toolId('source-parent', 'ask_user')]: 'parent-only',
        [toolId('source-child', 'read_file')]: 'child-only',
      },
    })
    const parent = agentHarness(test).agent
    const child = agentHarness(test, session(1)).agent
    test.root(parent)
    test.child(child)

    assert.equal(test.admitSource({ agent: parent }, {
      kind: 'section',
      name: 'complete-child-prompt',
      source: 'source-child',
    }), false)
    assert.equal(test.admitSource({ agent: child }, {
      kind: 'section',
      name: 'complete-child-prompt',
      source: 'source-child',
    }), true)

    const parentView = await test.assemble(fullAssembly(test), { agent: parent })
    assert.deepEqual(parentView.sections.map(entry => entry.name), ['persona', 'parent-prompt', 'dsh-warm-minimal:guidance'])
    assert.deepEqual(parentView.contexts.map(entry => entry.name), ['parent-context'])
    assert.deepEqual(parentView.tools.map(entry => entry.name), [BOOTSTRAP_TOOL_NAMES[0], 'ask_user', 'str_replace_editor'])

    const childView = await test.assemble(fullAssembly(test), { agent: child })
    assert.deepEqual(childView.sections.map(entry => entry.name), ['persona', 'child-prompt', 'unknown-prompt'])
    assert.deepEqual(childView.contexts.map(entry => entry.name), ['child-context'])
    assert.deepEqual(childView.tools.map(entry => entry.name), [BOOTSTRAP_TOOL_NAMES[0], 'read_file', 'str_replace_editor', 'third_party'])

    const scopeOnly = fullAssembly(test)
    assert.equal(await test.assemble(scopeOnly, { scope: {} }), scopeOnly)
  })

  it('uses saved stable-source overrides and keeps inventory metadata out of config', async () => {
    const promptAssignments = { 'source-unknown': 'parent-only' }
    const test = setup({ bootstrapEnabled: false, promptAssignments })
    const parent = agentHarness(test).agent
    test.root(parent)
    const view = await test.assemble(fullAssembly(test), { agent: parent })
    assert.deepEqual(view.sections.map(entry => entry.name), ['unknown-prompt', 'dsh-warm-minimal:guidance'])
    assert.deepEqual(promptAssignments, { 'source-unknown': 'parent-only' })
    const inventory = test.runtime.inventoryFor(fullAssembly(test))
    assert.deepEqual(inventory.promptSources.find(row => row.source === 'source-child'), {
      source: 'source-child',
      defaultAssignment: 'child-only',
      sections: ['child-prompt'],
      contexts: ['child-context'],
    })
    assert.deepEqual(inventory.tools.find(tool => tool.name === 'read_file'), {
      id: toolId('source-child', 'read_file'),
      source: 'source-child',
      name: 'read_file',
      description: 'read_file',
      defaultAssignment: 'child-only',
    })
  })

  it('publishes roster defaults and complete tool descriptions without saved overrides', async () => {
    const test = setup({ bootstrapEnabled: false })
    test.runtime.registerRoster({
      promptAssignments: { 'source-parent': 'parent-only' },
      toolAssignments: {
        [toolId('source-shared', BOOTSTRAP_TOOL_NAMES[0])]: 'shared',
        [toolId('source-shared', 'str_replace_editor')]: 'shared',
      },
    })

    const inventory = test.runtime.inventoryFor(fullAssembly(test))

    assert.deepEqual(inventory.promptSources.find(row => row.source === 'source-parent'), {
      source: 'source-parent',
      defaultAssignment: 'parent-only',
      sections: ['parent-prompt'],
      contexts: ['parent-context'],
    })
    assert.deepEqual(inventory.tools.filter(tool => tool.source === 'source-shared'), [
      {
        id: toolId('source-shared', BOOTSTRAP_TOOL_NAMES[0]),
        source: 'source-shared',
        name: BOOTSTRAP_TOOL_NAMES[0],
        description: BOOTSTRAP_TOOL_NAMES[0],
        defaultAssignment: 'shared',
      },
      {
        id: toolId('source-shared', 'str_replace_editor'),
        source: 'source-shared',
        name: 'str_replace_editor',
        description: 'str_replace_editor',
        defaultAssignment: 'shared',
      },
    ])
  })

  it('returns each inventory from its own assembly without a mutable snapshot', () => {
    const test = setup({ bootstrapEnabled: false })
    const first = test.runtime.inventoryFor(fullAssembly(test))
    const second = test.runtime.inventoryFor({
      sections: [], contexts: [], variables: {},
      tools: [test.mark('source-next', { name: 'next', description: 'Next.', parameters: {} })],
    })

    assert.equal('inventorySnapshot' in test.runtime, false)
    assert.equal(first.tools.length, 5)
    assert.deepEqual(second, {
      promptSources: [],
      tools: [{
        id: toolId('source-next', 'next'),
        source: 'source-next',
        name: 'next',
        description: 'Next.',
        defaultAssignment: 'child-only',
      }],
    })
  })

  it('assigns two schemas from one provider independently and keeps new schemas child-only', async () => {
    const alpha = toolId('source-mixed', 'alpha')
    const beta = toolId('source-mixed', 'beta')
    const test = setup({
      bootstrapEnabled: false,
      toolAssignments: { [alpha]: 'parent-only', [beta]: 'child-only' },
    })
    const parent = agentHarness(test).agent
    const child = agentHarness(test, session(1)).agent
    test.root(parent)
    test.child(child)
    const mixedAssembly = () => ({
      sections: [], contexts: [], variables: {},
      tools: [
        test.mark('source-mixed', { name: 'alpha', parameters: {} }),
        test.mark('source-mixed', { name: 'beta', parameters: {} }),
        test.mark('source-mixed', { name: 'new_tool', parameters: {} }),
      ],
    })

    assert.equal(test.admitSource({ agent: parent }, { kind: 'tool', source: 'source-mixed', name: 'alpha' }), true)
    assert.equal(test.admitSource({ agent: parent }, { kind: 'tool', source: 'source-mixed', name: 'beta' }), false)
    assert.equal(test.admitSource({ agent: child }, { kind: 'tool', source: 'source-mixed', name: 'alpha' }), false)
    assert.equal(test.admitSource({ agent: child }, { kind: 'tool', source: 'source-mixed', name: 'beta' }), true)
    assert.deepEqual((await test.assemble(mixedAssembly(), { agent: parent })).tools.map(tool => tool.name), ['alpha'])
    assert.deepEqual((await test.assemble(mixedAssembly(), { agent: child })).tools.map(tool => tool.name), ['beta', 'new_tool'])
  })

  it('keeps tool ids stable across metadata drift and rejects malformed or legacy keys', () => {
    const test = setup({ bootstrapEnabled: false })
    const schema = (source, name, description, parameters) => ({
      sections: [], contexts: [], variables: {},
      tools: [test.mark(source, { name, description, parameters })],
    })
    const first = test.runtime.inventoryFor(schema('source-a', 'alpha', 'first', { type: 'object' })).tools[0].id
    const metadataDrift = test.runtime.inventoryFor(schema('source-a', 'alpha', 'second', { type: 'string' })).tools[0].id
    const sourceDrift = test.runtime.inventoryFor(schema('source-b', 'alpha', 'second', { type: 'string' })).tools[0].id
    const nameDrift = test.runtime.inventoryFor(schema('source-a', 'beta', 'second', { type: 'string' })).tools[0].id

    assert.equal(first, metadataDrift)
    assert.notEqual(first, sourceDrift)
    assert.notEqual(first, nameDrift)
    assert.deepEqual(parseToolSchemaId(first), { source: 'source-a', name: 'alpha' })
    assert.deepEqual(validateToolAssignmentMap({}), {})
    assert.throws(() => validateToolAssignmentMap({ 'source-a': 'shared' }), /invalid tool schema id/)
    assert.throws(() => validateToolAssignmentMap({ 'tool-schema:v1:not-base64!': 'shared' }), /invalid tool schema id/)
  })

  it('fails loud when one source contributes the same tool name twice', () => {
    const test = setup({ bootstrapEnabled: false })
    const duplicate = {
      sections: [], contexts: [], variables: {},
      tools: [
        test.mark('source-a', { name: 'alpha', description: 'first', parameters: {} }),
        test.mark('source-a', { name: 'alpha', description: 'second', parameters: {} }),
      ],
    }

    assert.throws(() => test.runtime.inventoryFor(duplicate), /duplicate tool schema contribution/)
  })

  it('rejects legacy provider-scoped tool settings on the runtime path', async () => {
    const test = setup({
      bootstrapEnabled: false,
      toolAssignments: { 'source-a': 'parent-only' },
    })
    const parent = agentHarness(test).agent
    test.root(parent)

    await assert.rejects(test.assemble(fullAssembly(test), { agent: parent }), /invalid tool schema id/)
  })

  it('does not install an execution restriction for a hidden registered tool', async () => {
    const test = setup({ bootstrapEnabled: false })
    const parent = agentHarness(test).agent
    test.root(parent)
    const view = await test.assemble(fullAssembly(test), { agent: parent })
    assert.equal(view.tools.some(tool => tool.name === 'read_file'), false)
    let executions = 0
    const registeredTool = () => { executions += 1; return 'ordinary result' }
    assert.equal(registeredTool(), 'ordinary result')
    assert.equal(executions, 1)
    assert.deepEqual(test.registrations.sort(), [
      'agent/inbox/inserted',
      'system-prompt/assemble',
      'systemPrompt.admitSources',
    ])
  })
})
describe('preset-plane roster projection', () => {
  it('maps only exact complete entry ids through hostSourceId', () => {
    const entries = [
      { id: 'persona', fiber: { ctx: { token: 'persona' } } },
      { id: 'delegation:tool-subagent', fiber: { ctx: { token: 'delegate' } } },
      { id: 'nested:persona', fiber: { ctx: { token: 'same-name-wrong-path' } } },
      { id: 'unknown-row', fiber: { ctx: { token: 'unknown' } } },
    ]
    const tree = { entries: () => entries }
    const owner = { parent: { tree } }
    const ctx = { fiber: { entry: owner, parent: { fiber: undefined } } }
    let defaults
    const dispose = () => {}
    const returned = applyPresetProjection(ctx, {
      hostSourceId: entryCtx => `source:${entryCtx.token}`,
      registerRoster(value) { defaults = value; return dispose },
    })
    assert.equal(returned, dispose)
    assert.deepEqual(defaults.promptAssignments, {
      'source:persona': 'parent-only',
      'source:delegate': 'parent-only',
    })
    assert.deepEqual(defaults.toolAssignments, {
      [toolId('source:delegate', 'subagent')]: 'parent-only',
    })
    assert.equal(PACKAGE_ROSTER_ENTRY_IDS.includes('nested:persona'), false)
  })

  it('keeps parent and worker personas distinct and gives broad execution to children', () => {
    const entries = [
      { id: 'persona', fiber: { ctx: { token: 'parent-persona' } } },
      { id: 'worker-persona', fiber: { ctx: { token: 'worker-persona' } } },
      { id: 'agent-instructions', fiber: { ctx: { token: 'agents' } } },
      { id: 'persistent-shell:persistent-bash', fiber: { ctx: { token: 'shell' } } },
      { id: 'filesystem:str-replace-editor', fiber: { ctx: { token: 'editor' } } },
      { id: 'tool-skill', fiber: { ctx: { token: 'skill' } } },
      { id: 'tool-jobs', fiber: { ctx: { token: 'jobs' } } },
      { id: 'tool-web', fiber: { ctx: { token: 'web' } } },
    ]
    const owner = { parent: { tree: { entries: () => entries } } }
    const ctx = { fiber: { entry: owner, parent: { fiber: undefined } } }
    let defaults
    applyPresetProjection(ctx, {
      hostSourceId: entryCtx => `source:${entryCtx.token}`,
      registerRoster(value) { defaults = value; return () => {} },
    })

    assert.deepEqual(defaults.promptAssignments, {
      'source:parent-persona': 'parent-only',
      'source:worker-persona': 'child-only',
      'source:agents': 'shared',
      'source:shell': 'shared',
      'source:editor': 'shared',
      'source:skill': 'shared',
      'source:jobs': 'child-only',
      'source:web': 'child-only',
    })
    assert.deepEqual(defaults.toolAssignments, {
      [toolId('source:shell', 'bash')]: 'shared',
      [toolId('source:editor', 'str_replace_editor')]: 'shared',
      [toolId('source:skill', 'skill')]: 'shared',
      [toolId('source:jobs', 'job_output')]: 'child-only',
      [toolId('source:jobs', 'job_list')]: 'child-only',
      [toolId('source:jobs', 'job_kill')]: 'child-only',
      [toolId('source:web', 'web_search')]: 'child-only',
      [toolId('source:web', 'web_fetch')]: 'child-only',
    })
    assert.equal(PACKAGE_ROSTER_ENTRY_IDS.includes('delegation:tool-subagent-fork'), false)
  })

  it('declares exact per-tool defaults for the complete known DSH roster', () => {
    const entries = PACKAGE_ROSTER_ENTRY_IDS.map(id => ({ id, fiber: { ctx: { token: id } } }))
    const owner = { parent: { tree: { entries: () => entries } } }
    const ctx = { fiber: { entry: owner, parent: { fiber: undefined } } }
    let defaults
    applyPresetProjection(ctx, {
      hostSourceId: entryCtx => `source:${entryCtx.token}`,
      registerRoster(value) { defaults = value; return () => {} },
    })
    const expected = (source, names, assignment) => Object.fromEntries(
      names.map(name => [toolId(`source:${source}`, name), assignment]),
    )

    assert.deepEqual(defaults.toolAssignments, {
      ...expected('persistent-shell:persistent-bash', ['bash'], 'shared'),
      ...expected('persistent-shell:persistent-pwsh', ['pwsh'], 'shared'),
      ...expected('filesystem:str-replace-editor', ['str_replace_editor'], 'shared'),
      ...expected('tool-fs', ['read', 'edit', 'write', 'read_image'], 'child-only'),
      ...expected('tool-fs-search', ['glob', 'grep'], 'child-only'),
      ...expected('tool-jobs', ['job_output', 'job_list', 'job_kill'], 'child-only'),
      ...expected('tool-skill', ['skill'], 'shared'),
      ...expected('tool-goal', ['get_goal', 'create_goal', 'update_goal'], 'parent-only'),
      ...expected('planning:plan-mode', ['exit_plan_mode'], 'parent-only'),
      ...expected('delegation:tool-subagent-control', ['send_message', 'interrupt_agent'], 'parent-only'),
      ...expected('delegation:tool-subagent-list-agents', ['list_agents'], 'parent-only'),
      ...expected('delegation:tool-subagent', ['subagent'], 'parent-only'),
      ...expected('tool-ask-user', ['ask_user_question'], 'parent-only'),
      ...expected('tool-todo', ['todo_write'], 'parent-only'),
      ...expected('tool-web', ['web_search', 'web_fetch'], 'child-only'),
    })
  })
})
