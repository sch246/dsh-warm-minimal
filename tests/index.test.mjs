import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import { apply } from '../index.mjs'

const DONOR_REASONING = 'We need respond in Chinese likely. User says: 检查当前工作目录，确认后仅回复 Ready. Means check current working directory, after confirming reply only "Ready." We should run pwd and maybe ls. The instruction says "仅回复 Ready." But tool call needed. Let\'s run pwd and ls to inspect. Then final reply exactly "Ready." Perhaps with tool use first, no commentary? We can do bash pwd and ls. Then final "Ready."'

function harness() {
  let inserted
  const warnings = []
  const ctx = {
    root: {
      on(event, listener) {
        assert.equal(event, 'agent/inbox/inserted')
        inserted = listener
        return () => {}
      },
    },
    effect(register) { register() },
    logger: { warn(message) { warnings.push(message) } },
  }
  apply(ctx)
  assert.equal(typeof inserted, 'function')
  return { inserted, warnings }
}

function session(preset = 'warm-minimal') {
  const value = {
    id: 'session-12345678-aaaa-bbbb-cccc-123456789abc',
    header: { agentPreset: preset, cwd: '/work/project' },
    events: [],
    append(type, data, options) {
      value.events.push({ type, data, options })
    },
  }
  return value
}

describe('dsh-warm-minimal timing', () => {
  it('keeps a new session empty until the first real user message enters the inbox', () => {
    const { inserted } = harness()
    const value = session()
    assert.deepEqual(value.events, [])

    inserted({ agent: { session: value }, message: { source: { kind: 'plugin' } } })
    assert.deepEqual(value.events, [])

    inserted({ agent: { session: value }, message: { source: { kind: 'user' } } })
    assert.deepEqual(value.events.map(event => event.type), [
      'turn/start', 'step/start', 'user/message', 'assistant/message',
      'tool/call', 'tool/result', 'assistant/message', 'step/end', 'turn/end',
    ])
    assert.equal(value.events[2].data.role, 'user')
    assert.match(value.events[2].data.id, /^seed-/)
    assert.equal(value.events[2].data.source.form, 'warmup')
    assert.equal(value.events[3].data.message.role, 'assistant')
    assert.match(value.events[3].data.message.id, /^seed-/)
    assert.equal(value.events[5].data.message.role, 'user')
    assert.match(value.events[5].data.message.id, /^seed-/)
    assert.equal(
      value.events[5].data.message.content[0].content[0].text,
      '/work/project',
    )
  })

  it('seeds only once and only for the warm-minimal preset', () => {
    const { inserted } = harness()
    const warm = session()
    const standard = session('standard')
    const input = { source: { kind: 'user' } }

    inserted({ agent: { session: standard }, message: input })
    assert.deepEqual(standard.events, [])

    inserted({ agent: { session: warm }, message: input })
    const seededEventCount = warm.events.length
    inserted({ agent: { session: warm }, message: input })
    assert.equal(warm.events.filter(event => event.type === 'turn/start').length, 1)
    assert.equal(warm.events.length, seededEventCount)
  })

  it('uses the latest runtime preset selection instead of the creation header', () => {
    const { inserted } = harness()
    const input = { source: { kind: 'user' } }

    const switchedAway = session('warm-minimal')
    switchedAway.events.push({
      type: 'agent-preset/selected',
      data: { agentPreset: 'standard' },
    })
    inserted({ agent: { session: switchedAway }, message: input })
    assert.equal(switchedAway.events.some(event => event.type === 'turn/start'), false)

    const switchedToWarm = session('standard')
    switchedToWarm.events.push({
      type: 'agent-preset/selected',
      data: { agentPreset: 'warm-minimal' },
    })
    inserted({ agent: { session: switchedToWarm }, message: input })
    assert.equal(switchedToWarm.events.filter(event => event.type === 'turn/start').length, 1)
  })

  it('copies the fixed donor round and varies only its workspace result', () => {
    const { inserted } = harness()
    const value = session()
    inserted({ agent: { session: value }, message: { source: { kind: 'user' } } })

    const seededUser = value.events.find(event => event.type === 'user/message')
    assert.equal(seededUser.data.content[0].text, '检查当前工作目录，确认后仅回复 Ready.')
    assert.equal(seededUser.data.source.form, 'warmup')

    const assistantMessages = value.events
      .filter(event => event.type === 'assistant/message')
      .map(event => event.data.message)
    assert.equal(assistantMessages[0].content[0].text, DONOR_REASONING)
    const seededCall = assistantMessages[0].content[1]
    assert.equal(seededCall.type, 'tool-call')
    assert.match(seededCall.id, /^seed_/)
    assert.equal(seededCall.name, 'bash')
    assert.equal(seededCall.arguments, '{"command": "pwd && ls -la"}')
    assert.deepEqual(assistantMessages[1].content, [{ type: 'text', text: 'Ready.' }])

    const toolResult = value.events.find(event => event.type === 'tool/result')
    assert.equal(toolResult.data.message.content[0].content[0].text, '/work/project')
    assert.equal(value.events.some(event => event.type === 'context/message'), false)
  })

  it('does not invent a workspace when session metadata has no usable cwd', () => {
    const { inserted, warnings } = harness()
    const missing = session()
    delete missing.header.cwd
    const blank = session()
    blank.header.cwd = '   '

    inserted({ agent: { session: missing }, message: { source: { kind: 'user' } } })
    inserted({ agent: { session: blank }, message: { source: { kind: 'user' } } })

    assert.deepEqual(missing.events, [])
    assert.deepEqual(blank.events, [])
    assert.equal(warnings.length, 2)
    for (const warning of warnings) {
      assert.match(warning, /session header does not contain a working directory/)
    }
  })
})

describe('warm-minimal preset composition', () => {
  it('is minimal-equivalent: complete fixed prompt, two tools, no extra contexts', async () => {
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
