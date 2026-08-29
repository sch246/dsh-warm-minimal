import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_CONFIG } from '../config.mjs'
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
      toolAssignments: { 'source-shared': 'shared', 'source-parent': 'parent-only', 'source-child': 'child-only' },
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
      toolAssignments: { 'source-shared': 'shared', 'source-parent': 'parent-only', 'source-child': 'child-only' },
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
    assert.deepEqual(test.runtime.inventorySnapshot().find(row => row.source === 'source-child'), {
      source: 'source-child',
      sections: ['child-prompt'],
      contexts: ['child-context'],
      tools: ['read_file'],
    })
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
      'source:persona': 'shared',
      'source:delegate': 'parent-only',
    })
    assert.deepEqual(defaults.toolAssignments, defaults.promptAssignments)
    assert.equal(PACKAGE_ROSTER_ENTRY_IDS.includes('nested:persona'), false)
  })
})
