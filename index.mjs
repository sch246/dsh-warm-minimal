/**
 * dsh-warm-minimal host half: prepend the selected minimal donor round after
 * the first real user message enters a blank warm-minimal session.
 *
 * This plugin mounts through the bundle layer at profile boot, so it is live
 * before any user input arrives. A new session therefore keeps the official
 * empty state. The first real user message enters the inbox, this plugin
 * synchronously writes canonical round 1 (fixed donor reasoning, one synthetic
 * bash trace, a short ready reply), and only then may the agent loop wake and
 * record the real input as round 2.
 *
 * Zero external imports on purpose: bundle rows resolve bare specifiers from
 * the profile, where `@deepseek-ai/*` packages are not directly installed.
 */

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-warm-minimal'

/** Fixed model-visible donor fields. Only the tool result workspace varies. */
const SEED_USER_TEXT = '检查当前工作目录，确认后仅回复 Ready.'
const SEED_READY_TEXT = 'Ready.'
const SEED_TOOL_ARGUMENTS = '{"command": "pwd && ls -la"}'

/** Assistant reasoning copied from the user-selected minimal donor session. */
const SEED_REASONING = 'We need respond in Chinese likely. User says: 检查当前工作目录，确认后仅回复 Ready. Means check current working directory, after confirming reply only "Ready." We should run pwd and maybe ls. The instruction says "仅回复 Ready." But tool call needed. Let\'s run pwd and ls to inspect. Then final reply exactly "Ready." Perhaps with tool use first, no commentary? We can do bash pwd and ls. Then final "Ready."'

/** The seed is an injection, never treated as a real user message. */
const SEED_SOURCE = {
  kind: 'plugin',
  plugin: 'dsh-warm-minimal',
  form: 'warmup',
}

/** Model-shaped source for the seeded assistant messages. */
const SEED_MODEL_SOURCE = {
  kind: 'model',
  provider: 'dsh-warm-minimal',
  model: 'dsh-warm-minimal',
}

/**
 * Resolve the preset currently selected for a session. DSH keeps the creation
 * preset in the header and appends later successful selections to the event
 * log, so the latest selection must override that initial value.
 */
function resolveSessionPreset(session) {
  for (let index = session.events.length - 1; index >= 0; index -= 1) {
    const event = session.events[index]
    if (event.type === 'agent-preset/selected') return event.data.agentPreset
  }
  return session.header?.agentPreset
}

/**
 * Write the fake first round into one not-yet-started session.
 * @param session - durable session; must not contain a turn yet.
 */
function seedRound(session) {
  const cwd = session.header?.cwd
  if (typeof cwd !== 'string' || cwd.trim().length === 0) {
    throw new Error('session header does not contain a working directory')
  }
  const callId = `seed_${session.id.replaceAll('-', '').slice(0, 8)}_1`
  const resultText = cwd

  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })

  session.append('user/message', {
    id: `seed-${callId}-user`,
    role: 'user',
    content: [{ type: 'text', text: SEED_USER_TEXT }],
    source: SEED_SOURCE,
  }, { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: {
      id: `seed-${callId}-assistant-1`,
      role: 'assistant',
      content: [
        { type: 'reasoning', text: SEED_REASONING },
        { type: 'tool-call', id: callId, name: 'bash', arguments: SEED_TOOL_ARGUMENTS },
      ],
      source: SEED_MODEL_SOURCE,
    },
  }, { surfaceOp: 'append' })
  session.append('tool/call', {
    turn: 1,
    step: 1,
    callId,
    name: 'bash',
    arguments: SEED_TOOL_ARGUMENTS,
  })
  session.append('tool/result', {
    turn: 1,
    step: 1,
    message: {
      id: `seed-${callId}-tool`,
      role: 'user',
      source: { kind: 'tool', callId },
      content: [{
        type: 'tool-result',
        toolCallId: callId,
        content: [{ type: 'text', text: resultText }],
        isError: false,
      }],
    },
  }, { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: {
      id: `seed-${callId}-assistant-2`,
      role: 'assistant',
      content: [{ type: 'text', text: SEED_READY_TEXT }],
      source: SEED_MODEL_SOURCE,
    },
  }, { surfaceOp: 'append' })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
}

/**
 * Seed a blank warm-minimal session after its first real user message enters
 * the inbox but before the loop wakes. Inbox insertion notifications are
 * synchronous, so the durable seed becomes round 1 and the triggering input
 * becomes round 2 without showing seed content on the empty-session screen.
 * @param ctx - Cordis context carrying this bundle's scope.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.root.on('agent/inbox/inserted', ({ agent, message: input }) => {
    if (input.source?.kind !== 'user') return
    const session = agent.session
    if (resolveSessionPreset(session) !== 'warm-minimal') return
    if (session.events.some((event) => event.type === 'turn/start')) return
    try {
      seedRound(session)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      ctx.logger.warn(`dsh-warm-minimal: failed to seed ${session.id}: ${message}`)
    }
  }, { global: true }), 'dsh-warm-minimal: seed after the first real user message')
}
