/** Browser half: a warm-minimal card on the official Plugins settings page. */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type WarmMinimalLocaleKey } from './locales.ts';
export type { AssignedPromptSource, AssignedSource, AssignedToolSource, InventoryPromptSource, InventoryTool, SourceAssignment, ToolSchemaId, WarmMinimalInventory, WarmMinimalSettings, } from './contract.ts';
export type { WarmMinimalCardObservable, WarmMinimalCardView, WarmMinimalInventoryRemote, } from './controller.ts';
export type { WarmMinimalCardFace, WarmMinimalCardProps, WarmMinimalSettingsContentProps, } from './WarmMinimalCard.tsx';
/** Host settings namespace and keyed Plugins-card dispatch value. */
export declare const WARM_MINIMAL_SETTINGS_NAMESPACE = "warm-minimal";
/** Browser locale namespace. */
export declare const WARM_MINIMAL_LOCALE_NAMESPACE = "warm-minimal.settings";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Warm-minimal Plugins-card copy. */
        'warm-minimal.settings': WarmMinimalLocaleKey;
    }
}
/** Services required to mount the generated Remote and official settings scope. */
export declare const inject: string[];
/**
 * Mount the read-only inventory Remote and register the namespace-keyed card.
 * @param ctx - browser Client plugin context.
 */
export declare function apply(ctx: ClientContext): Promise<void>;
//# sourceMappingURL=index.d.ts.map