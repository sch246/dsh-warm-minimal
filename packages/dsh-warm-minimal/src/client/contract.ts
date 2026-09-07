/** Client-owned view types for the warm-minimal Plugins card. */

/** Post-bootstrap visibility assigned to one model input. */
export type SourceAssignment = 'parent-only' | 'child-only' | 'shared'

/** Stable opaque identity of one provider-owned tool schema. */
export type ToolSchemaId = string & { readonly __warmMinimalToolSchemaId: never }

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
  /** Tool-schema visibility overrides keyed by opaque schema identity. */
  toolAssignments: Record<ToolSchemaId, SourceAssignment>
}

/** One prompt source returned by the read-only inventory Remote. */
export interface InventoryPromptSource {
  /** Stable Host identity used as the prompt settings-map key. */
  readonly source: string
  /** Package roster default for prompt and context visibility. */
  readonly defaultAssignment: SourceAssignment
  /** System-prompt section names contributed by this source. */
  readonly sections: readonly string[]
  /** Runtime-context names contributed by this source. */
  readonly contexts: readonly string[]
}

/** One independently assignable tool returned by the inventory Remote. */
export interface InventoryTool {
  /** Stable opaque settings-map key. */
  readonly id: ToolSchemaId
  /** Read-only provider provenance. */
  readonly source: string
  /** Model-visible tool name. */
  readonly name: string
  /** Model-visible description from the assembled schema. */
  readonly description: string
  /** Exact roster default, or the closed unknown fallback. */
  readonly defaultAssignment: SourceAssignment
}

/** Atomic inventory returned by one preset-scope assembly. */
export interface WarmMinimalInventory {
  /** Prompt and context contributions grouped by source. */
  readonly promptSources: readonly InventoryPromptSource[]
  /** One row per model-visible tool schema. */
  readonly tools: readonly InventoryTool[]
}

/** One prompt assignment row with section and context contributions kept distinct. */
export interface AssignedPromptSource {
  /** Stable Host source identity. */
  source: string
  /** Current effective assignment. */
  assignment: SourceAssignment
  /** System-prompt section names contributed by this source. */
  sections: readonly string[]
  /** Runtime-context names contributed by this source. */
  contexts: readonly string[]
}

/** One independently assignable tool row. */
export interface AssignedToolSource {
  /** Opaque settings identity for this exact schema. */
  id: ToolSchemaId
  /** Read-only provider provenance. */
  source: string
  /** Model-visible tool name. */
  name: string
  /** Model-visible description from the assembled schema. */
  description: string
  /** Current effective assignment. */
  assignment: SourceAssignment
}

/** One UI-readable assignment row. */
export type AssignedSource = AssignedPromptSource | AssignedToolSource

/** Narrow a settings mirror value beyond its serialized Host schema. */
export function decodeWarmMinimalSettings(value: unknown): WarmMinimalSettings | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.bootstrapEnabled !== 'boolean'
    || typeof candidate.bootstrapMessage !== 'string'
    || typeof candidate.guidance !== 'string'
    || !isAssignments(candidate.promptAssignments)
    || !isToolAssignments(candidate.toolAssignments)
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

/** @returns whether a wire string is one canonical v1 tool-schema identity. */
export function isToolSchemaId(value: string): value is ToolSchemaId {
  try {
    const prefix = 'tool-schema:v1:'
    if (!value.startsWith(prefix)) return false
    const encoded = value.slice(prefix.length)
    if (encoded.length === 0 || !/^[A-Za-z0-9_-]+$/u.test(encoded)) return false
    const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    const tuple: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!Array.isArray(tuple) || tuple.length !== 2) return false
    const [source, name] = tuple
    if (typeof source !== 'string' || source.length === 0 || source.length > 4096 || !source.isWellFormed()) return false
    if (typeof name !== 'string' || name.length === 0 || name.length > 256 || !name.isWellFormed()) return false
    const canonicalBytes = new TextEncoder().encode(JSON.stringify([source, name]))
    let canonicalBinary = ''
    for (const byte of canonicalBytes) canonicalBinary += String.fromCharCode(byte)
    const canonical = btoa(canonicalBinary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
    return encoded === canonical
  } catch {
    return false
  }
}

function isAssignments(value: unknown): value is Record<string, SourceAssignment> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value).every(entry => typeof entry === 'string' && isSourceAssignment(entry))
}

function isToolAssignments(value: unknown): value is Record<ToolSchemaId, SourceAssignment> {
  if (!isAssignments(value)) return false
  return Object.keys(value).every(isToolSchemaId)
}
