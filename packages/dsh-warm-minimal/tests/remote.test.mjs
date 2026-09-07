import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { WarmMinimalRemote } from '../lib/remote.js'
import { TYPERT } from '../lib/typert.host.js'

describe('warm-minimal inventory Remote', () => {
  it('returns stable source ids, roster defaults, and readable contributions', async () => {
    const ctx = new Context()
    const snapshot = {
      promptSources: [{
        source: 'host-source:plugin-row',
        defaultAssignment: 'parent-only',
        sections: ['persona'],
        contexts: ['workspace'],
      }],
      tools: [{
        id: 'tool-schema:v1:WyJob3N0LXNvdXJjZTpwbHVnaW4tcm93IiwiYmFzaCJd',
        source: 'host-source:plugin-row',
        name: 'bash',
        description: 'Run commands.',
        defaultAssignment: 'shared',
      }],
    }
    const remote = new WarmMinimalRemote(ctx, {
      queryInventory: async () => structuredClone(snapshot),
    })

    assert.deepEqual(await remote.queryInventory(), snapshot)
    assert.deepEqual(TYPERT.invocations[0].result.schema.parse(snapshot), snapshot)
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
