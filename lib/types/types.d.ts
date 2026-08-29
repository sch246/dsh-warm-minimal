/** Client-safe inventory returned by the warm-minimal Host Remote. */
/** Post-bootstrap model visibility assigned to one Host source. */
export type WarmMinimalSourceAssignment = 'parent-only' | 'child-only' | 'shared';
/** Readable tool contribution projected without its parameter schema. */
export interface WarmMinimalInventoryTool {
    /** Model-visible tool name. */
    readonly name: string;
    /** Model-visible description, when the source reached a complete assembly. */
    readonly description?: string;
}
/** Model-visible contribution names grouped under one stable Host source id. */
export interface WarmMinimalInventorySource {
    /** Stable identity retained across discovery order changes. */
    readonly source: string;
    /** Package roster default for prompt and context visibility. */
    readonly promptDefault: WarmMinimalSourceAssignment;
    /** Package roster default for tool-schema visibility. */
    readonly toolDefault: WarmMinimalSourceAssignment;
    /** System-prompt section names contributed by this source. */
    readonly sections: readonly string[];
    /** Runtime-context names contributed by this source. */
    readonly contexts: readonly string[];
    /** Model-visible tools contributed by this source. */
    readonly tools: readonly WarmMinimalInventoryTool[];
}
/** Current read-only contribution inventory. */
export type WarmMinimalInventory = readonly WarmMinimalInventorySource[];
//# sourceMappingURL=types.d.ts.map