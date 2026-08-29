/** Staged Plugins-card form over one official settings namespace scope. */
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { AssignedPromptSource, AssignedToolSource, InventorySource, SourceAssignment, WarmMinimalSettings } from './contract.ts';
/** Read-only generated Remote face consumed by the controller. */
export interface WarmMinimalInventoryRemote {
    /** Query the current contribution inventory. */
    queryInventory(): Promise<RemoteResult<readonly InventorySource[]>>;
}
/** Immutable projection rendered by the settings card. */
export interface WarmMinimalCardView {
    /** Settings and inventory readiness. */
    status: 'loading' | 'ready' | 'unavailable' | 'error';
    /** Current settings namespace revision. */
    revision: number | undefined;
    /** Whether the Host document accepts writes. */
    writable: boolean;
    /** Effective settings plus browser-local staged edits. */
    draft: WarmMinimalSettings | undefined;
    /** Prompt and context sources with their contribution kinds retained. */
    promptSources: readonly AssignedPromptSource[];
    /** Tool sources with their model-visible names and descriptions. */
    toolSources: readonly AssignedToolSource[];
    /** Whether the browser holds edits not yet accepted by the Host. */
    dirty: boolean;
    /** Whether staged fields are crossing the settings scope. */
    saving: boolean;
    /** Last inventory or settings-write failure. */
    failure: string | undefined;
}
/** Observable consumed by the slot renderer's generated hook. */
export interface WarmMinimalCardObservable {
    /** @returns the current immutable card projection. */
    getSnapshot(): WarmMinimalCardView;
    /** @returns a disposer for the registered listener. */
    subscribe(listener: () => void): () => void;
}
/** One settings card controller; Remote data never enters its write plan. */
export declare class WarmMinimalCardController implements WarmMinimalCardObservable {
    private readonly scope;
    private readonly remote;
    private readonly listeners;
    private readonly staged;
    private inventory;
    private inventoryLoading;
    private saving;
    private failure;
    private loadPromise;
    private disposed;
    private readonly stopScope;
    private view;
    /**
     * @param scope - official `warm-minimal` settings namespace scope.
     * @param remote - generated read-only inventory Remote namespace.
     */
    constructor(scope: SettingsScope<WarmMinimalSettings>, remote: WarmMinimalInventoryRemote);
    /** @returns the current immutable card projection. */
    getSnapshot: () => WarmMinimalCardView;
    /** @returns a disposer for the registered listener. */
    subscribe: (listener: () => void) => (() => void);
    /** Query the read-only Host inventory, collapsing concurrent requests. */
    loadInventory(): Promise<void>;
    /** Stage bootstrap enablement without writing. */
    setBootstrapEnabled(enabled: boolean): void;
    /** Stage bootstrap user-role text without writing. */
    setBootstrapMessage(message: string): void;
    /** Stage post-bootstrap coordinator guidance without writing. */
    setGuidance(guidance: string): void;
    /** Stage one assignment in the settings-owned source map. */
    assign(list: 'prompt' | 'tool', source: string, assignment: SourceAssignment): void;
    /** Drop every browser-local edit. */
    discard(): void;
    /** Write staged fields only through settingsScope, which owns CAS and serialization. */
    save(): Promise<void>;
    /** Release the settings subscription and silence later Remote settlements. */
    dispose(): void;
    private readInventory;
    private stage;
    private effective;
    private project;
    private publish;
}
/** Project prompt inventory separately from the settings write model. */
declare function projectPromptSources(inventory: readonly InventorySource[], assignments: Readonly<Record<string, SourceAssignment>>): AssignedPromptSource[];
/** Project tool inventory separately from the settings write model. */
declare function projectToolSources(inventory: readonly InventorySource[], assignments: Readonly<Record<string, SourceAssignment>>): AssignedToolSource[];
export { projectPromptSources, projectToolSources };
//# sourceMappingURL=controller.d.ts.map
