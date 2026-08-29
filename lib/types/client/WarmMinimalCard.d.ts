/** Official Plugins-page summary and modal editor for warm-minimal configuration. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type SourceAssignment } from './contract.ts';
import type { WarmMinimalCardObservable, WarmMinimalCardView } from './controller.ts';
import type { WarmMinimalLocaleKey } from './locales.ts';
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
type Translate = (key: WarmMinimalLocaleKey) => string;
/** Props for the configuration content rendered inside the modal. */
export interface WarmMinimalSettingsContentProps {
    /** Current controller projection. */
    state: WarmMinimalCardView;
    /** Warm-minimal dictionary lookup. */
    t: Translate;
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
/**
 * Render the complete editable form placed inside the modal.
 * @param props - controller snapshot, translations, and staged form actions.
 * @returns the configuration element tree.
 */
export declare function WarmMinimalSettingsContent(props: WarmMinimalSettingsContentProps): import("react").JSX.Element;
/**
 * Render the warm-minimal settings summary card and modal.
 * @param props - locale, authoritative snapshot hook, and staged form actions.
 * @returns the card element tree.
 */
export declare function WarmMinimalCard(props: WarmMinimalCardProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=WarmMinimalCard.d.ts.map