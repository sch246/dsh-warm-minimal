import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { WarmMinimalRemote } from '../lib/remote.js'
import { TYPERT } from '../lib/typert.host.js'

describe('warm-minimal inventory Remote', () => {
  it('returns stable source ids, roster defaults, and readable contributions', async () => {
    const ctx = new Context()
    const snapshot = [{
      source: 'host-source:plugin-row',
      promptDefault: 'parent-only',
      toolDefault: 'shared',
      sections: ['persona'],
      contexts: ['workspace'],
      tools: [{ name: 'bash', description: 'Run commands.' }],
    }]
    const remote = new WarmMinimalRemote(ctx, {
      queryInventory: async () => structuredClone(snapshot),
    })

    assert.deepEqual(await remote.queryInventory(), snapshot)
    assert.equal(typeof ctx.get('warmMinimal')?.queryInventory, 'function')
  })

  it('publishes one generated read-only endpoint', () => {
    assert.deepEqual(TYPERT.invocations.map(invocation => ({
      service: invocation.service,
      namespace: invocation.namespace,
      method: invocation.method,
      parameters: invocation.parameters,
    })), [{
      service: 'warmMinimal',
      namespace: 'warmMinimal',
      method: 'queryInventory',
      parameters: [],
    }])
  })
})
