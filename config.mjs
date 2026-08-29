/** Post-bootstrap visibility assignment for one stable Host source. */
export const ASSIGNMENTS = Object.freeze(['parent-only', 'child-only', 'shared'])

export const DEFAULT_BOOTSTRAP_MESSAGE = '检查当前工作目录，确认后仅回复 Ready.'
export const DEFAULT_GUIDANCE = 'Delegated agents have broader tools. Own local inspection, integration, coordination, and user interaction.'

/** Composition baseline passed below the settings provider's user section. */
export const DEFAULT_CONFIG = Object.freeze({
  bootstrapEnabled: true,
  bootstrapMessage: DEFAULT_BOOTSTRAP_MESSAGE,
  guidance: DEFAULT_GUIDANCE,
  promptAssignments: Object.freeze({}),
  toolAssignments: Object.freeze({}),
})

/** Resolve a source through saved config, package roster, then the closed default. */
export function assignmentFor(source, saved, roster) {
  return saved[source] ?? roster.get(source) ?? 'child-only'
}

