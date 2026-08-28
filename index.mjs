/**
 * Run a real minimal bootstrap immediately before the first real request in a
 * blank warm-minimal session. DSH remains responsible for every durable event.
 *
 * The bootstrap turn must see the same model-visible face as the official
 * minimal preset on its first request: the complete one-sentence system prompt
 * and exactly the platform shell plus `str_replace_editor`. DeepSeek v4 pro is
 * highly sensitive to its initial prompt and tool face, so any host-registered
 * tool (dev plugins, image readers, weather, ...) is withheld from that first
 * turn and re-exposed from the second turn onward, when the original real
 * request runs.
 */

export const name = 'dsh-warm-minimal'

const BOOTSTRAP_ID_PREFIX = 'dsh-warm-minimal:bootstrap:'
const BOOTSTRAP_TEXT = '检查当前工作目录，确认后仅回复 Ready.'
const PLATFORM_SHELL = process.platform === 'win32' ? 'pwsh' : 'bash'
const BOOTSTRAP_TOOL_NAMES = new Set([PLATFORM_SHELL, 'str_replace_editor'])

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

function gateBootstrapTools(assembly) {
  const tools = assembly.tools.filter(tool => BOOTSTRAP_TOOL_NAMES.has(tool.name))
  if (tools.length !== BOOTSTRAP_TOOL_NAMES.size) return assembly
  return { ...assembly, tools }
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

  // The bootstrap turn is complete. Promote to the full naturally-assembled
  // catalog before restoring any held input, so the original request becomes
  // the first full-tool turn.
  state.promoted = true

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

    const next = { held: [input], restoring: false, promoted: false }
    active.set(session, next)
    void runBootstrap(ctx, agent, next, active)
  }, { global: true }), 'dsh-warm-minimal: native bootstrap before first real request')

  ctx.effect(() => ctx.on('system-prompt/assemble', async (assembly, context, next) => {
    const assembled = await next()
    const session = context.agent?.session
    const state = session === undefined ? undefined : active.get(session)
    if (state === undefined || state.promoted) return assembled
    if (resolveSessionPreset(session) !== 'warm-minimal') return assembled
    return gateBootstrapTools(assembled)
  }), 'dsh-warm-minimal: minimal two-tool face during bootstrap, full catalog from turn two')
}
