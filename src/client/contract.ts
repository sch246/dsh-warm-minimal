/** Client-owned view types for the warm-minimal Plugins card. */

/** Post-bootstrap visibility assigned to one stable contribution source. */
export type SourceAssignment = 'parent-only' | 'child-only' | 'shared'

/** The complete settings section served under the `warm-minimal` namespace. */
export interface WarmMinimalSettings {
  /** Whether the first real input is preceded by the bootstrap turn. */
  bootstrapEnabled: boolean
  /** User-role text submitted for the bootstrap turn. */
  bootstrapMessage: string
  /** Short coordinator guidance shown after bootstrap. */
  guidance: string
  /** Prompt/context visibility overrides keyed by stable source identity. */
  promptAssignments: Record<string, SourceAssignment>
  /** Tool-schema visibility overrides keyed by stable source identity. */
  toolAssignments: Record<string, SourceAssignment>
}

/** One source returned by the read-only inventory Remote. */
export interface InventorySource {
  /** Stable Host identity used as the settings-map key. */
  readonly source: string
  /** System-prompt section names contributed by this source. */
  readonly sections: readonly string[]
  /** Runtime-context names contributed by this source. */
  readonly contexts: readonly string[]
  /** Tool-schema names contributed by this source. */
  readonly tools: readonly string[]
}

/** One inventory row projected for either assignment list. */
export interface AssignedSource {
  /** Stable Host source identity. */
  source: string
  /** Compact rendering of the stable identity. */
  shortSource: string
  /** Section/context or tool names contributed by the source. */
  names: readonly string[]
  /** Current effective assignment exposed by the settings section. */
  assignment: SourceAssignment
}

/** Narrow a settings mirror value beyond its serialized Host schema. */
export function decodeWarmMinimalSettings(value: unknown): WarmMinimalSettings | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.bootstrapEnabled !== 'boolean'
    || typeof candidate.bootstrapMessage !== 'string'
    || typeof candidate.guidance !== 'string'
    || !isAssignments(candidate.promptAssignments)
    || !isAssignments(candidate.toolAssignments)
  ) return undefined
  return {
    bootstrapEnabled: candidate.bootstrapEnabled,
    bootstrapMessage: candidate.bootstrapMessage,
    guidance: candidate.guidance,
    promptAssignments: { ...candidate.promptAssignments },
    toolAssignments: { ...candidate.toolAssignments },
  }
}

/** @returns whether a browser select value is a supported source assignment. */
export function isSourceAssignment(value: string): value is SourceAssignment {
  return value === 'parent-only' || value === 'child-only' || value === 'shared'
}

function isAssignments(value: unknown): value is Record<string, SourceAssignment> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value).every(entry => typeof entry === 'string' && isSourceAssignment(entry))
}
