import { makeToolSchemaId } from './config.mjs'

const PACKAGE_ROSTER = new Map([
  ['persona', { prompt: 'parent-only', tools: [] }],
  ['worker-persona', { prompt: 'child-only', tools: [] }],
  ['agent-instructions', { prompt: 'shared', tools: [] }],
  ['persistent-shell:persistent-bash', { prompt: 'shared', tools: [['bash', 'shared']] }],
  ['persistent-shell:persistent-pwsh', { prompt: 'shared', tools: [['pwsh', 'shared']] }],
  ['filesystem:str-replace-editor', { prompt: 'shared', tools: [['str_replace_editor', 'shared']] }],
  ['tool-fs', { prompt: 'child-only', tools: [
    ['read', 'child-only'],
    ['edit', 'child-only'],
    ['write', 'child-only'],
    ['read_image', 'child-only'],
  ] }],
  ['tool-fs-search', { prompt: 'child-only', tools: [
    ['glob', 'child-only'],
    ['grep', 'child-only'],
  ] }],
  ['tool-jobs', { prompt: 'child-only', tools: [
    ['job_output', 'child-only'],
    ['job_list', 'child-only'],
    ['job_kill', 'child-only'],
  ] }],
  ['skill-filesystem', { prompt: 'shared', tools: [] }],
  ['tool-skill', { prompt: 'shared', tools: [['skill', 'shared']] }],
  ['tool-goal', { prompt: 'parent-only', tools: [
    ['get_goal', 'parent-only'],
    ['create_goal', 'parent-only'],
    ['update_goal', 'parent-only'],
  ] }],
  ['planning:plan-mode', { prompt: 'parent-only', tools: [['exit_plan_mode', 'parent-only']] }],
  ['delegation:tool-subagent-control', { prompt: 'parent-only', tools: [
    ['send_message', 'parent-only'],
    ['interrupt_agent', 'parent-only'],
  ] }],
  ['delegation:tool-subagent-list-agents', { prompt: 'parent-only', tools: [['list_agents', 'parent-only']] }],
  ['delegation:tool-subagent', { prompt: 'parent-only', tools: [['subagent', 'parent-only']] }],
  ['tool-ask-user', { prompt: 'parent-only', tools: [['ask_user_question', 'parent-only']] }],
  ['tool-todo', { prompt: 'parent-only', tools: [['todo_write', 'parent-only']] }],
  ['tool-web', { prompt: 'child-only', tools: [
    ['web_search', 'child-only'],
    ['web_fetch', 'child-only'],
  ] }],
])

function owningEntry(ctx) {
  let fiber = ctx.fiber
  while (true) {
    if (fiber.entry !== undefined) return fiber.entry
    const parent = fiber.parent.fiber
    if (parent === fiber) return undefined
    fiber = parent
  }
}

/** Project exact Loader entry ids and exact tool names to package defaults. */
export function applyPresetProjection(ctx, { hostSourceId, registerRoster }) {
  const owner = owningEntry(ctx)
  if (owner === undefined) throw new Error('dsh-warm-minimal: roster projection is not owned by a Loader entry')
  const promptAssignments = {}
  const toolAssignments = {}
  for (const entry of owner.parent.tree.entries()) {
    const defaults = PACKAGE_ROSTER.get(entry.id)
    if (defaults === undefined || entry.fiber === undefined) continue
    const source = hostSourceId(entry.fiber.ctx)
    promptAssignments[source] = defaults.prompt
    for (const [name, assignment] of defaults.tools) {
      toolAssignments[makeToolSchemaId(source, name)] = assignment
    }
  }
  return registerRoster({ promptAssignments, toolAssignments })
}

export const PACKAGE_ROSTER_ENTRY_IDS = Object.freeze([...PACKAGE_ROSTER.keys()])
