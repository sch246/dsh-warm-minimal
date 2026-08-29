const ROSTER_ASSIGNMENTS = new Map([
  ['persona', 'parent-only'],
  ['worker-persona', 'child-only'],
  ['agent-instructions', 'shared'],
  ['persistent-shell:persistent-bash', 'shared'],
  ['persistent-shell:persistent-pwsh', 'shared'],
  ['filesystem:str-replace-editor', 'shared'],
  ['tool-fs', 'child-only'],
  ['tool-fs-search', 'child-only'],
  ['tool-jobs', 'child-only'],
  ['tool-skill', 'shared'],
  ['tool-goal', 'parent-only'],
  ['planning:plan-mode', 'parent-only'],
  ['delegation:tool-subagent-control', 'parent-only'],
  ['delegation:tool-subagent-list-agents', 'parent-only'],
  ['delegation:tool-subagent', 'parent-only'],
  ['delegation:tool-subagent-fork', 'parent-only'],
  ['delegation:tool-subagent-codex', 'parent-only'],
  ['delegation:tool-subagent-claude-code', 'parent-only'],
  ['delegation:workflow-worker-thread', 'parent-only'],
  ['delegation:tool-workflow', 'parent-only'],
  ['delegation:tool-ralph', 'parent-only'],
  ['tool-ask-user', 'parent-only'],
  ['tool-todo', 'parent-only'],
  ['tool-web', 'child-only'],
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

/** Project exact Loader entry ids to stable Host sources without name guessing. */
export function applyPresetProjection(ctx, { hostSourceId, registerRoster }) {
  const owner = owningEntry(ctx)
  if (owner === undefined) throw new Error('dsh-warm-minimal: roster projection is not owned by a Loader entry')
  const promptAssignments = {}
  const toolAssignments = {}
  for (const entry of owner.parent.tree.entries()) {
    const assignment = ROSTER_ASSIGNMENTS.get(entry.id)
    if (assignment === undefined || entry.fiber === undefined) continue
    const source = hostSourceId(entry.fiber.ctx)
    promptAssignments[source] = assignment
    toolAssignments[source] = assignment
  }
  return registerRoster({ promptAssignments, toolAssignments })
}

export const PACKAGE_ROSTER_ENTRY_IDS = Object.freeze([...ROSTER_ASSIGNMENTS.keys()])
