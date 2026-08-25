import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { apply } from '../index.mjs'

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
    cwd: '/work/project',
    header: { agentPreset: preset },
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
    assert.equal(value.events[3].data.message.role, 'assistant')
    assert.match(value.events[3].data.message.id, /^seed-/)
    assert.equal(value.events[5].data.message.role, 'user')
    assert.match(value.events[5].data.message.id, /^seed-/)
  })

  it('seeds only once and only for the warm-minimal preset', () => {
    const { inserted } = harness()
    const warm = session()
    const standard = session('standard')
    const input = { source: { kind: 'user' } }

    inserted({ agent: { session: standard }, message: input })
    assert.deepEqual(standard.events, [])

    inserted({ agent: { session: warm }, message: input })
    inserted({ agent: { session: warm }, message: input })
    assert.equal(warm.events.filter(event => event.type === 'turn/start').length, 1)
  })
})
