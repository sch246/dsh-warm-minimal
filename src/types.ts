/** Client-safe inventory returned by the warm-minimal Host Remote. */

/** Model-visible contribution names grouped under one stable Host source id. */
export interface WarmMinimalInventorySource {
  /** Stable identity retained across discovery order changes. */
  readonly source: string
  /** System-prompt section names contributed by this source. */
  readonly sections: readonly string[]
  /** Runtime-context names contributed by this source. */
  readonly contexts: readonly string[]
  /** Model-visible tool names contributed by this source. */
  readonly tools: readonly string[]
}

/** Current read-only contribution inventory. */
export type WarmMinimalInventory = readonly WarmMinimalInventorySource[]
