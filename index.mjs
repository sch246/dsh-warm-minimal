/**
 * dsh-warm-minimal host half: fake a high-quality first round the moment a
 * blank warm-minimal session is created.
 *
 * This plugin mounts through the bundle layer at profile boot, so it is live
 * before any session exists. It writes a canonical round 1 (we / let's
 * reasoning, one truthful pwsh tool call, a short ready reply), and the
 * user's real input therefore arrives as round 2 — where AGENTS.md, runtime
 * context, and the skill catalog inject normally.
 *
 * Zero external imports on purpose: bundle rows resolve bare specifiers from
 * the profile, where `@deepseek-ai/*` packages are not directly installed.
 */

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-warm-minimal'

/** Reasonable defaults, overridable from the bundle row config. */
const DEFAULT_USER_TEXT = 'Get ready. First confirm the current working directory.'
const DEFAULT_READY_TEXT = 'Ready.'

/** First-round reasoning style: first sentence opens with `we need to`, no `let me`. */
const SEED_REASONING = [
  'We need to confirm the current working directory first.',
  "Let's check where we are before doing anything.",
  'We need one concrete step at a time, and we should wait for the task before touching files.',
].join('\n')

/** The seed is an injection, never treated as a real user message. */
const SEED_SOURCE = {
  kind: 'plugin',
  plugin: 'dsh-warm-minimal',
}

/** Model-shaped source for the seeded assistant messages. */
const SEED_MODEL_SOURCE = {
  kind: 'model',
  provider: 'dsh-warm-minimal',
  model: 'dsh-warm-minimal',
}

/**
 * Write the fake first round into one blank session.
 * @param session - durable session; must still have zero events.
 * @param config - text overrides from the bundle row.
 */
function seedRound(session, config = {}) {
  const userText = config.userText ?? DEFAULT_USER_TEXT
  const readyText = config.readyText ?? DEFAULT_READY_TEXT
  const cwd = session.cwd ?? process.cwd()
  const callId = `seed_${session.id.replaceAll('-', '').slice(0, 8)}_1`
  const argumentsJson = JSON.stringify({
    command: 'Get-Location',
    description: 'Confirm the working directory',
  })
  const resultText = `Path\n----\n${cwd}`

  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })

  session.append('user/message', {
    content: [{ type: 'text', text: userText }],
    source: SEED_SOURCE,
  }, { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: {
      role: 'assistant',
      content: [
        { type: 'reasoning', text: SEED_REASONING },
        { type: 'tool-call', id: callId, name: 'pwsh', arguments: argumentsJson },
      ],
      source: SEED_MODEL_SOURCE,
    },
  }, { surfaceOp: 'append' })
  session.append('tool/call', {
    turn: 1,
    step: 1,
    callId,
    name: 'pwsh',
    arguments: argumentsJson,
  })
  session.append('tool/result', {
    turn: 1,
    step: 1,
    message: {
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
      role: 'assistant',
      content: [{ type: 'text', text: readyText }],
      source: SEED_MODEL_SOURCE,
    },
  }, { surfaceOp: 'append' })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
}

/**
 * Seed blank warm-minimal sessions once, as they are created.
 * @param ctx - Cordis context carrying this bundle's scope.
 * @param config - bundle row config.
 */
export function apply(ctx, config = {}) {
  ctx.effect(() => ctx.root.on('agent/created', ({ agent }) => {
    const session = agent.session
    if (session.header?.agentPreset !== 'warm-minimal') return
    if (session.events.some((event) => event.type === 'turn/start')) return
    try {
      seedRound(session, config)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      ctx.logger.warn(`dsh-warm-minimal: failed to seed ${session.id}: ${message}`)
    }
  }, { global: true }), 'dsh-warm-minimal: seed blank warm-minimal sessions')
}
