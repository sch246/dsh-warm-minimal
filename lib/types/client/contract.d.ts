/** Client-owned view types for the warm-minimal Plugins card. */
/** Post-bootstrap visibility assigned to one model input. */
export type SourceAssignment = 'parent-only' | 'child-only' | 'shared';
/** Stable opaque identity of one provider-owned tool schema. */
export type ToolSchemaId = string & {
    readonly __warmMinimalToolSchemaId: never;
};
/** The complete settings section served under the `warm-minimal` namespace. */
export interface WarmMinimalSettings {
    /** Whether the first real input is preceded by the bootstrap turn. */
    bootstrapEnabled: boolean;
    /** User-role text submitted for the bootstrap turn. */
    bootstrapMessage: string;
    /** Short coordinator guidance shown after bootstrap. */
    guidance: string;
    /** Prompt/context visibility overrides keyed by stable source identity. */
    promptAssignments: Record<string, SourceAssignment>;
    /** Tool-schema visibility overrides keyed by opaque schema identity. */
    toolAssignments: Record<ToolSchemaId, SourceAssignment>;
}
/** One prompt source returned by the read-only inventory Remote. */
export interface InventoryPromptSource {
    /** Stable Host identity used as the prompt settings-map key. */
    readonly source: string;
    /** Package roster default for prompt and context visibility. */
    readonly defaultAssignment: SourceAssignment;
    /** System-prompt section names contributed by this source. */
    readonly sections: readonly string[];
    /** Runtime-context names contributed by this source. */
    readonly contexts: readonly string[];
}
/** One independently assignable tool returned by the inventory Remote. */
export interface InventoryTool {
    /** Stable opaque settings-map key. */
    readonly id: ToolSchemaId;
    /** Read-only provider provenance. */
    readonly source: string;
    /** Model-visible tool name. */
    readonly name: string;
    /** Model-visible description from the assembled schema. */
    readonly description: string;
    /** Exact roster default, or the closed unknown fallback. */
    readonly defaultAssignment: SourceAssignment;
}
/** Atomic inventory returned by one preset-scope assembly. */
export interface WarmMinimalInventory {
    /** Prompt and context contributions grouped by source. */
    readonly promptSources: readonly InventoryPromptSource[];
    /** One row per model-visible tool schema. */
    readonly tools: readonly InventoryTool[];
}
/** One prompt assignment row with section and context contributions kept distinct. */
export interface AssignedPromptSource {
    /** Stable Host source identity. */
    source: string;
    /** Current effective assignment. */
    assignment: SourceAssignment;
    /** System-prompt section names contributed by this source. */
    sections: readonly string[];
    /** Runtime-context names contributed by this source. */
    contexts: readonly string[];
}
/** One independently assignable tool row. */
export interface AssignedToolSource {
    /** Opaque settings identity for this exact schema. */
    id: ToolSchemaId;
    /** Read-only provider provenance. */
    source: string;
    /** Model-visible tool name. */
    name: string;
    /** Model-visible description from the assembled schema. */
    description: string;
    /** Current effective assignment. */
    assignment: SourceAssignment;
}
/** One UI-readable assignment row. */
export type AssignedSource = AssignedPromptSource | AssignedToolSource;
/** Narrow a settings mirror value beyond its serialized Host schema. */
export declare function decodeWarmMinimalSettings(value: unknown): WarmMinimalSettings | undefined;
/** @returns whether a browser select value is a supported source assignment. */
export declare function isSourceAssignment(value: string): value is SourceAssignment;
/** @returns whether a wire string is one canonical v1 tool-schema identity. */
export declare function isToolSchemaId(value: string): value is ToolSchemaId;
//# sourceMappingURL=contract.d.ts.map