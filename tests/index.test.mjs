import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import { apply } from '../index.mjs'

const BOOTSTRAP_TEXT = '检查当前工作目录，确认后仅回复 Ready.'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function nextTask() {
  return new Promise(resolve => setImmediate(resolve))
}

function harness() {
  let inserted
  let assemble
  const warnings = []
  const ctx = {
    root: {
      on(event, listener, options) {
        assert.equal(event, 'agent/inbox/inserted')
        assert.deepEqual(options, { global: true })
        inserted = listener
        return () => {}
      },
    },
    on(event, listener) {
      assert.equal(event, 'system-prompt/assemble')
      assemble = listener
      return () => {}
    },
    effect(register) { register() },
    logger: { warn(message) { warnings.push(message) } },
  }
  apply(ctx)
  assert.equal(typeof inserted, 'function')
  assert.equal(typeof assemble, 'function')
  return { inserted, assemble, warnings }
}

function session(preset = 'warm-minimal') {
  return {
    id: 'session-12345678-aaaa-bbbb-cccc-123456789abc',
    header: { agentPreset: preset },
    events: [],
  }
}

function userMessage(id, text) {
  return {
    id,
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'user' },
  }
}

function agentHarness(inserted, value, idle = deferred()) {
  const pending = new Set()
  const removed = []
  const followed = []
  const agent = {
    session: value,
    inbox: {
      remove(id) {
        if (!pending.delete(id)) return false
        removed.push(id)
        return true
      },
    },
    followup(message) {
      followed.push(message)
      pending.add(message.id)
      inserted({ agent, message })
    },
    whenIdle() { return idle.promise },
  }
  return {
    agent,
    idle,
    removed,
    followed,
    insert(message) {
      pending.add(message.id)
      inserted({ agent, message })
    },
  }
}

function fullAssembly() {
  return {
    sections: [{ name: 'persona', text: 'You are a helpful software engineer assistant.' }],
    contexts: [],
    tools: [
      { name: 'bash', description: 'shell' },
      { name: 'dev_extra', description: 'host-registered tool' },
      { name: 'image_scan', description: 'host-registered tool' },
      { name: 'str_replace_editor', description: 'editor' },
    ],
    variables: {},
  }
}

async function assemble(assembleListener, agent, assembly = fullAssembly()) {
  return assembleListener(assembly, { agent }, async () => assembly)
}

describe('dsh-warm-minimal native bootstrap', () => {
  it('holds the first real input, runs a marked native bootstrap, then restores the input', async () => {
    const { inserted } = harness()
    const value = session()
    const runner = agentHarness(inserted, value)
    const original = userMessage('user-1', '你好')

    assert.deepEqual(value.events, [])
    runner.insert(original)

    assert.deepEqual(runner.removed, ['user-1'])
    assert.equal(runner.followed.length, 1)
    const bootstrap = runner.followed[0]
    assert.match(bootstrap.id, /^dsh-warm-minimal:bootstrap:/)
    assert.equal(bootstrap.role, 'user')
    assert.deepEqual(bootstrap.source, { kind: 'user' })
    assert.deepEqual(bootstrap.content, [{ type: 'text', text: BOOTSTRAP_TEXT }])

    runner.idle.resolve()
    await nextTask()

    assert.deepEqual(runner.followed, [bootstrap, original])
    assert.equal(runner.removed.includes(bootstrap.id), false)
  })

  it('preserves arrival order for user inputs received during bootstrap', async () => {
    const { inserted } = harness()
    const runner = agentHarness(inserted, session())
    const first = userMessage('user-1', '第一条')
    const second = userMessage('user-2', '第二条')

    runner.insert(first)
    runner.insert(second)

    assert.deepEqual(runner.removed, ['user-1', 'user-2'])
    assert.equal(runner.followed.length, 1)

    runner.idle.resolve()
    await nextTask()

    assert.deepEqual(runner.followed.slice(1), [first, second])
  })

  it('restores held input when the native bootstrap fails', async () => {
    const { inserted, warnings } = harness()
    const runner = agentHarness(inserted, session())
    const original = userMessage('user-1', '仍然处理我')

    runner.insert(original)
    runner.idle.reject(new Error('provider unavailable'))
    await nextTask()

    assert.deepEqual(runner.followed.slice(1), [original])
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /bootstrap failed.*provider unavailable/)
  })

  it('uses the latest effective preset and never bootstraps a started session', () => {
    const { inserted } = harness()

    const switchedAway = session('warm-minimal')
    switchedAway.events.push({
      type: 'agent-preset/selected',
      data: { agentPreset: 'standard' },
    })
    const away = agentHarness(inserted, switchedAway)
    away.insert(userMessage('away', '普通模式'))
    assert.deepEqual(away.removed, [])
    assert.deepEqual(away.followed, [])

    const switchedToWarm = session('standard')
    switchedToWarm.events.push({
      type: 'agent-preset/selected',
      data: { agentPreset: 'warm-minimal' },
    })
    const warm = agentHarness(inserted, switchedToWarm)
    warm.insert(userMessage('warm', '切换后'))
    assert.deepEqual(warm.removed, ['warm'])
    assert.equal(warm.followed.length, 1)

    const started = session()
    started.events.push({ type: 'turn/start', data: { turn: 1 } })
    const later = agentHarness(inserted, started)
    later.insert(userMessage('later', '后续消息'))
    assert.deepEqual(later.removed, [])
    assert.deepEqual(later.followed, [])
  })

  it('ignores plugin-originated input', () => {
    const { inserted } = harness()
    const runner = agentHarness(inserted, session())
    runner.insert({
      id: 'plugin-1',
      role: 'user',
      content: [{ type: 'text', text: 'internal' }],
      source: { kind: 'plugin', plugin: 'other' },
    })
    assert.deepEqual(runner.removed, [])
    assert.deepEqual(runner.followed, [])
  })

  it('limits the bootstrap turn to the two minimal tools and restores the full catalog afterwards', async () => {
    const { inserted, assemble: assembleListener } = harness()
    const runner = agentHarness(inserted, session())
    const original = userMessage('user-1', '真实任务')

    runner.insert(original)

    const bootAssembly = await assemble(assembleListener, runner.agent)
    assert.deepEqual(
      bootAssembly.tools.map(tool => tool.name),
      ['bash', 'str_replace_editor'],
    )
    assert.equal(bootAssembly.sections[0].text, 'You are a helpful software engineer assistant.')

    runner.idle.resolve()
    await nextTask()

    const promotedAssembly = await assemble(assembleListener, runner.agent)
    assert.deepEqual(
      promotedAssembly.tools.map(tool => tool.name),
      ['bash', 'dev_extra', 'image_scan', 'str_replace_editor'],
    )
    assert.deepEqual(runner.followed.slice(1), [original])
  })

  it('never gates assemblies without an in-flight warm-minimal bootstrap', async () => {
    const { assemble: assembleListener } = harness()
    const runner = agentHarness(assembleListener, session())
    const assembly = await assemble(assembleListener, runner.agent)
    assert.deepEqual(assembly.tools.map(tool => tool.name), ['bash', 'dev_extra', 'image_scan', 'str_replace_editor'])
  })

  it('leaves non-agent assemblies untouched during bootstrap', async () => {
    const { inserted, assemble: assembleListener } = harness()
    const runner = agentHarness(inserted, session())
    runner.insert(userMessage('user-1', '真实任务'))
    const assembly = await assemble(assembleListener, undefined)
    assert.deepEqual(assembly.tools.map(tool => tool.name), ['bash', 'dev_extra', 'image_scan', 'str_replace_editor'])
  })

  it('does not gate a bootstrap for another effective preset', async () => {
    const { inserted, assemble: assembleListener } = harness()
    const value = session('standard')
    value.events.push({ type: 'agent-preset/selected', data: { agentPreset: 'standard' } })
    const runner = agentHarness(inserted, value)
    runner.insert(userMessage('user-1', '标准模式消息'))
    const assembly = await assemble(assembleListener, runner.agent)
    assert.deepEqual(assembly.tools.map(tool => tool.name), ['bash', 'dev_extra', 'image_scan', 'str_replace_editor'])
  })
})

describe('warm-minimal preset composition', () => {
  it('is minimal-equivalent: complete fixed prompt, two platform tools, no extra contexts', async () => {
    const preset = await readFile(new URL('../presets/warm-minimal/agent.cordis.yml', import.meta.url), 'utf8')

    assert.match(preset, /text: You are a helpful software engineer assistant\./)
    assert.match(preset, /complete: true/)
    assert.match(preset, /includeRuntimeContext: false/)
    assert.match(preset, /@deepseek-ai\/dsh-tool-bash-persistent/)
    assert.match(preset, /@deepseek-ai\/dsh-tool-pwsh-persistent/)
    assert.match(preset, /@deepseek-ai\/dsh-tool-str-replace-editor/)

    for (const forbidden of [
      '@deepseek-ai/dsh-agent-instructions',
      '@deepseek-ai/dsh-skill-filesystem',
      '@deepseek-ai/dsh-tool-skill',
      '@deepseek-ai/dsh-tool-jobs',
      '@deepseek-ai/dsh-tool-goal',
      '@deepseek-ai/dsh-plan-mode',
      'reasoning-style.mjs',
    ]) {
      assert.equal(preset.includes(forbidden), false, `unexpected minimal component: ${forbidden}`)
    }
  })
})
