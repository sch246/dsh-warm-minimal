/** Read-only Host Remote for the warm-minimal contribution inventory. */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { WarmMinimalInventory } from './types.ts'

/** Runtime capability exposed to the inventory Remote. */
export interface WarmMinimalInventoryRuntime {
  /** Refresh the preset inventory without a model request and return an isolated snapshot. */
  queryInventory(): Promise<WarmMinimalInventory>
}

/** Read-only Remote registered under the `warmMinimal` namespace. */
export class WarmMinimalRemote extends TypertRemoteService {
  /**
   * @param ctx - Host-plane plugin context.
   * @param runtime - warm-minimal runtime that owns inventory discovery.
   */
  constructor(ctx: Context, private readonly runtime: WarmMinimalInventoryRuntime) {
    super(ctx, 'warmMinimal')
  }

  /**
   * Read the latest inventory discovered by model assembly.
   * @returns stable source ids with section, context, and tool names only.
   */
  @Remote('queryInventory')
  queryInventory(): Promise<WarmMinimalInventory> {
    return this.runtime.queryInventory()
  }
}
