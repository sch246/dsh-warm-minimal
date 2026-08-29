import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { WarmMinimalCardController } from '../../lib/types/client/controller.js'

function settings() {
  return {
    bootstrapEnabled: true,
    bootstrapMessage: '检查当前工作目录，确认后仅回复 Ready.',
    guidance: 'Coordinate.',
    promptAssignments: { 'source:known': 'shared', retained: 'parent-only' },
    toolAssignments: { 'source:known': 'child-only' },
  }
}

function scopeDouble(initial = settings()) {
  let snapshot = {
    status: 'ready', value: structuredClone(initial), base: structuredClone(initial), user: {},
    revision: 7, writable: true, mode: 'host',
  }
  const listeners = new Set()
  const writes = []
  return {
    writes,
    scope: {
      getSnapshot: () => snapshot,
      subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
      async set(field, value) {
        writes.push({ field, value: structuredClone(value) })
        snapshot = {
          ...snapshot,
          revision: snapshot.revision + 1,
          value: { ...snapshot.value, [field]: structuredClone(value) },
          user: { ...snapshot.user, [field]: structuredClone(value) },
        }
        for (const listener of listeners) listener()
      },
      async unset(field) {
        writes.push({ field, unset: true })
      },
    },
  }
}

function remoteDouble() {
  let calls = 0
  return {
    get calls() { return calls },
    remote: {
      async queryInventory() {
        calls += 1
        return {
          ok: true,
          value: [
            {
              source: 'source:known',
              promptDefault: 'parent-only',
              toolDefault: 'shared',
              sections: ['persona', 'duplicate'],
              contexts: ['workspace', 'duplicate'],
              tools: [
                { name: 'bash', description: 'Run commands.' },
                { name: 'str_replace_editor' },
              ],
            },
            {
              source: 'unknown:very-long-source-identity-that-needs-a-short-browser-value:tail',
              promptDefault: 'shared',
              toolDefault: 'child-only',
              sections: ['extra'],
              contexts: [],
              tools: [],
            },
          ],
        }
      },
    },
  }
}

describe('WarmMinimalCardController', () => {
  it('reads inventory defaults through Remote and retains prompt, context, and tool detail', async () => {
    const host = scopeDouble()
    const inventory = remoteDouble()
    const controller = new WarmMinimalCardController(host.scope, inventory.remote)

    await Promise.all([controller.loadInventory(), controller.loadInventory()])

    assert.equal(inventory.calls, 1)
    assert.deepEqual(controller.getSnapshot().promptSources[0], {
      source: 'source:known',
      sections: ['persona', 'duplicate'],
      contexts: ['workspace', 'duplicate'],
      assignment: 'shared',
    })
    assert.equal(controller.getSnapshot().promptSources[1].assignment, 'shared')
    assert.deepEqual(controller.getSnapshot().toolSources[0], {
      source: 'source:known',
      tools: [
        { name: 'bash', description: 'Run commands.' },
        { name: 'str_replace_editor' },
      ],
      assignment: 'child-only',
    })
  })

  it('saves only the five settings fields through settingsScope and never inventory metadata', async () => {
    const host = scopeDouble()
    const inventory = remoteDouble()
    const controller = new WarmMinimalCardController(host.scope, inventory.remote)
    await controller.loadInventory()

    controller.setBootstrapEnabled(false)
    controller.setBootstrapMessage('Editable while disabled')
    controller.setGuidance('Own integration.')
    controller.assign('prompt', 'source:known', 'child-only')
    controller.assign('tool', 'source:known', 'shared')
    await controller.save()

    assert.deepEqual(host.writes.map(write => write.field), [
      'bootstrapEnabled', 'bootstrapMessage', 'guidance', 'promptAssignments', 'toolAssignments',
    ])
    assert.deepEqual(host.writes[3].value, {
      'source:known': 'child-only', retained: 'parent-only',
    })
    assert.deepEqual(host.writes[4].value, { 'source:known': 'shared' })
    assert.equal(JSON.stringify(host.writes).includes('persona'), false)
    assert.equal(JSON.stringify(host.writes).includes('description'), false)
    assert.equal(controller.getSnapshot().dirty, false)
  })

  it('keeps rejected staged values when settingsScope does not accept the write', async () => {
    const host = scopeDouble()
    host.scope.set = async (field, value) => {
      host.writes.push({ field, value })
    }
    const inventory = remoteDouble()
    const controller = new WarmMinimalCardController(host.scope, inventory.remote)
    await controller.loadInventory()
    controller.setBootstrapMessage('rejected')

    await controller.save()

    assert.equal(controller.getSnapshot().dirty, true)
    assert.match(controller.getSnapshot().failure, /did not accept/)
    assert.equal(controller.getSnapshot().draft.bootstrapMessage, 'rejected')
  })
})
