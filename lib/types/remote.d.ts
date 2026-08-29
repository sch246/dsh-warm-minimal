/** Read-only Host Remote for the warm-minimal contribution inventory. */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { WarmMinimalInventory } from './types.ts';
/** Runtime capability exposed to the inventory Remote. */
export interface WarmMinimalInventoryRuntime {
    /** Assemble the preset scope without a model request and return its atomic inventory. */
    queryInventory(): Promise<WarmMinimalInventory>;
}
/** Read-only Remote registered under the `warmMinimal` namespace. */
export declare class WarmMinimalRemote extends TypertRemoteService {
    private readonly runtime;
    /**
     * @param ctx - Host-plane plugin context.
     * @param runtime - warm-minimal runtime that owns inventory discovery.
     */
    constructor(ctx: Context, runtime: WarmMinimalInventoryRuntime);
    /**
     * Read one inventory from the current preset-scope assembly.
     * @returns grouped prompt sources and independently assignable tool schemas.
     */
    queryInventory(): Promise<WarmMinimalInventory>;
}
//# sourceMappingURL=remote.d.ts.map