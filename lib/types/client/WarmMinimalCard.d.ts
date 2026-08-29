/** Official Plugins-page card for the warm-minimal Host configuration. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type SourceAssignment } from './contract.ts';
import type { WarmMinimalCardObservable } from './controller.ts';
/** Slot face injected by this card's registration. */
export interface WarmMinimalCardFace {
    hooks: {
        /** Controller snapshot bound by the renderer as `useWarmMinimalCard`. */
        warmMinimalCard: WarmMinimalCardObservable;
    };
    /** Stage bootstrap enablement. */
    setBootstrapEnabled: (enabled: boolean) => void;
    /** Stage the bootstrap user-role message. */
    setBootstrapMessage: (message: string) => void;
    /** Stage post-bootstrap main-agent guidance. */
    setGuidance: (guidance: string) => void;
    /** Stage one stable source assignment. */
    assign: (list: 'prompt' | 'tool', sourceId: string, assignment: SourceAssignment) => void;
    /** Drop the current draft. */
    discard: () => void;
    /** Re-query the read-only Host inventory. */
    reloadInventory: () => void;
    /** Submit the current revision-fenced draft. */
    save: () => void;
}
/** Props composed by the `settings.plugin.item` slot runtime. */
export type WarmMinimalCardProps = PropsRuntime<'settings.plugin.item'> & PropsLocale<'warm-minimal.settings'> & InjectFace<WarmMinimalCardFace>;
/**
 * Render the warm-minimal settings card.
 * @param props - locale, authoritative snapshot hook, and staged form actions.
 * @returns the card element tree.
 */
export declare function WarmMinimalCard(props: WarmMinimalCardProps): import("react").JSX.Element;
//# sourceMappingURL=WarmMinimalCard.d.ts.map