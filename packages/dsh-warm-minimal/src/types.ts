/** Client-safe inventory returned by the warm-minimal Host Remote. */

/** Post-bootstrap model visibility assigned to one model input. */
export type WarmMinimalSourceAssignment = 'parent-only' | 'child-only' | 'shared'

/** Stable opaque identity of one provider-owned model-visible tool schema. */
export type WarmMinimalToolSchemaId = string

/** Prompt and context contributions grouped under one stable Host source id. */
export interface WarmMinimalInventoryPromptSource {
  /** Stable provider identity retained across discovery order changes. */
  readonly source: string
  /** Package roster default for prompt and context visibility. */
  readonly defaultAssignment: WarmMinimalSourceAssignment
  /** System-prompt section names contributed by this source. */
  readonly sections: readonly string[]
  /** Runtime-context names contributed by this source. */
  readonly contexts: readonly string[]
}

/** One independently assignable model-visible tool schema. */
export interface WarmMinimalInventoryTool {
  /** Stable opaque settings identity bound to `source` and `name`. */
  readonly id: WarmMinimalToolSchemaId
  /** Read-only provider provenance. */
  readonly source: string
  /** Model-visible tool name. */
  readonly name: string
  /** Model-visible description from the assembled schema. */
  readonly description: string
  /** Exact package roster default, or the closed unknown fallback. */
  readonly defaultAssignment: WarmMinimalSourceAssignment
}

/** Current read-only contribution inventory from one scope-only assembly. */
export interface WarmMinimalInventory {
  /** Source-grouped prompt and context contributions. */
  readonly promptSources: readonly WarmMinimalInventoryPromptSource[]
  /** Atomic per-schema tool contributions. */
  readonly tools: readonly WarmMinimalInventoryTool[]
}
