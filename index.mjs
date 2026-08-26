/**
 * Run a real minimal bootstrap immediately before the first real request in a
 * blank warm-minimal session. DSH remains responsible for every durable event.
 */

export const name = 'dsh-warm-minimal'

const BOOTSTRAP_ID_PREFIX = 'dsh-warm-minimal:bootstrap:'
const BOOTSTRAP_TEXT = '检查当前工作目录，确认后仅回复 Ready.'

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

function bootstrapMessage() {
  return {
    id: `${BOOTSTRAP_ID_PREFIX}${globalThis.crypto.randomUUID()}`,
    role: 'user',
    content: [{ type: 'text', text: BOOTSTRAP_TEXT }],
    source: { kind: 'user' },
  }
}

async function runBootstrap(ctx, agent, state, active) {
  const { session } = agent
  try {
    agent.followup(bootstrapMessage())
    await agent.whenIdle()
  } catch (error) {
    ctx.logger.warn(
      `dsh-warm-minimal: bootstrap failed for ${session.id}: ${errorMessage(error)}`,
    )
  }

  // Stop intercepting our own restoration while preserving all held inputs in
  // their original arrival order.
  state.restoring = true
  for (const message of state.held) {
    try {
      agent.followup(message)
    } catch (error) {
      ctx.logger.warn(
        `dsh-warm-minimal: failed to restore ${message.id} for ${session.id}: ${errorMessage(error)}`,
      )
    }
  }
  active.delete(session)
}

export function apply(ctx) {
  const active = new WeakMap()

  ctx.effect(() => ctx.root.on('agent/inbox/inserted', ({ agent, message: input }) => {
    if (input.source?.kind !== 'user') return
    if (typeof input.id === 'string' && input.id.startsWith(BOOTSTRAP_ID_PREFIX)) return

    const { session } = agent
    const state = active.get(session)
    if (state) {
      if (state.restoring) return
      if (agent.inbox.remove(input.id)) {
        state.held.push(input)
      } else {
        ctx.logger.warn(
          `dsh-warm-minimal: failed to hold ${input.id} during bootstrap for ${session.id}`,
        )
      }
      return
    }

    if (resolveSessionPreset(session) !== 'warm-minimal') return
    if (session.events.some(event => event.type === 'turn/start')) return
    if (!agent.inbox.remove(input.id)) {
      ctx.logger.warn(
        `dsh-warm-minimal: failed to hold first input ${input.id} for ${session.id}`,
      )
      return
    }

    const next = { held: [input], restoring: false }
    active.set(session, next)
    void runBootstrap(ctx, agent, next, active)
  }, { global: true }), 'dsh-warm-minimal: native bootstrap before first real request')
}
