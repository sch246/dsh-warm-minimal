import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Official Plugins-page summary and modal editor for warm-minimal configuration. */
import { useId, useState } from 'react';
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { isSourceAssignment, } from "./contract.js";
/** Assignment values in segmented-control order. */
const ASSIGNMENTS = ['parent-only', 'child-only', 'shared'];
/** Translate an assignment value. */
function assignmentLabel(t, assignment) {
    switch (assignment) {
        case 'parent-only': return t('parentOnly');
        case 'child-only': return t('childOnly');
        case 'shared': return t('shared');
    }
}
/** Count the three effective assignments in a source list. */
function assignmentCounts(sources) {
    const counts = { 'parent-only': 0, 'child-only': 0, shared: 0 };
    for (const source of sources)
        counts[source.assignment] += 1;
    return counts;
}
/** Render one compact assignment summary. */
function AssignmentSummary(props) {
    const counts = assignmentCounts(props.sources);
    return (_jsxs("span", { className: "dsh-warm-settings-assignment-summary", "data-parent-only": counts['parent-only'], "data-child-only": counts['child-only'], "data-shared": counts.shared, children: [props.t('parentOnly'), " ", counts['parent-only'], _jsx("span", { "aria-hidden": "true", children: " \u00B7 " }), props.t('childOnly'), " ", counts['child-only'], _jsx("span", { "aria-hidden": "true", children: " \u00B7 " }), props.t('shared'), " ", counts.shared] }));
}
/** Render the native-radio segmented assignment control for one source. */
function AssignmentControl(props) {
    const controlId = useId();
    return (_jsxs("fieldset", { className: "dsh-warm-settings-segments", role: "radiogroup", "aria-label": `${props.t('assignment')}: ${sourceHeading(props.source, props.t)}`, disabled: props.disabled, children: [_jsxs("legend", { className: "dsh-warm-settings-sr-only", children: [props.t('assignment'), ": ", sourceHeading(props.source, props.t)] }), ASSIGNMENTS.map((assignment) => {
                const inputId = `${controlId}-${assignment}`;
                return (_jsxs("label", { className: "dsh-warm-settings-segment", "data-checked": props.source.assignment === assignment, htmlFor: inputId, children: [_jsx("input", { id: inputId, name: `${props.list}-assignment-${controlId}`, type: "radio", value: assignment, checked: props.source.assignment === assignment, disabled: props.disabled, onChange: (event) => {
                                if (isSourceAssignment(event.target.value))
                                    props.onAssign(props.source.source, event.target.value);
                            } }), _jsx("span", { children: assignmentLabel(props.t, assignment) })] }, assignment));
            })] }));
}
function PromptSourceHeading(props) {
    return (_jsxs("span", { className: "dsh-warm-settings-source-copy", children: [_jsxs("span", { className: "dsh-warm-settings-contribution-line", children: [_jsx("span", { className: "dsh-warm-settings-contribution-kind", children: props.t('sections') }), _jsx("span", { children: props.source.sections.length === 0 ? props.t('none') : props.source.sections.join(', ') })] }), _jsxs("span", { className: "dsh-warm-settings-contribution-line", children: [_jsx("span", { className: "dsh-warm-settings-contribution-kind", children: props.t('contexts') }), _jsx("span", { children: props.source.contexts.length === 0 ? props.t('none') : props.source.contexts.join(', ') })] })] }));
}
function ToolSourceHeading(props) {
    const description = props.source.tools.find(tool => tool.description !== undefined)?.description;
    return (_jsxs("span", { className: "dsh-warm-settings-source-copy", children: [_jsx("span", { className: "dsh-warm-settings-tool-names", children: props.source.tools.map(tool => tool.name).join(', ') }), _jsx("span", { className: "dsh-warm-settings-tool-preview", children: description === undefined || description.length === 0 ? props.t('noDescription') : description })] }));
}
function sourceHeading(source, t) {
    if ('tools' in source)
        return source.tools.map(tool => tool.name).join(', ');
    const names = [...source.sections, ...source.contexts];
    return names.length === 0 ? t('noSources') : names.join(', ');
}
/** Render one source row with sibling disclosure and radio controls. */
function SourceRow(props) {
    const [expanded, setExpanded] = useState(false);
    const detailId = useId();
    return (_jsxs("div", { className: "dsh-warm-settings-source", "data-source-row": props.list, children: [_jsxs("div", { className: "dsh-warm-settings-source-main", children: [_jsxs("button", { type: "button", className: "dsh-warm-settings-source-disclosure", "aria-expanded": expanded, "aria-controls": detailId, "aria-label": `${props.t(expanded ? 'hideDetails' : 'showDetails')}: ${sourceHeading(props.source, props.t)}`, onClick: () => { setExpanded(!expanded); }, children: [_jsx("span", { className: "dsh-warm-settings-source-chevron", "data-open": expanded, "aria-hidden": "true", children: "\u203A" }), 'tools' in props.source
                                ? _jsx(ToolSourceHeading, { source: props.source, t: props.t })
                                : _jsx(PromptSourceHeading, { source: props.source, t: props.t })] }), _jsx(AssignmentControl, { ...props })] }), expanded
                ? (_jsxs("div", { id: detailId, className: "dsh-warm-settings-source-detail", children: [_jsxs("div", { className: "dsh-warm-settings-detail-source", children: [_jsx("span", { children: props.t('source') }), _jsx("code", { children: props.source.source })] }), 'tools' in props.source
                            ? (_jsx("div", { className: "dsh-warm-settings-tool-details", children: props.source.tools.map((tool, index) => (_jsxs("div", { className: "dsh-warm-settings-tool-detail", children: [_jsx("strong", { children: tool.name }), _jsx("span", { children: tool.description === undefined || tool.description.length === 0
                                                ? props.t('noDescription')
                                                : tool.description })] }, `${tool.name}-${index}`))) }))
                            : (_jsxs("div", { className: "dsh-warm-settings-prompt-details", children: [_jsx(ContributionDetails, { title: props.t('sections'), names: props.source.sections, t: props.t }), _jsx(ContributionDetails, { title: props.t('contexts'), names: props.source.contexts, t: props.t })] }))] }))
                : null] }));
}
function ContributionDetails(props) {
    return (_jsxs("div", { children: [_jsx("strong", { children: props.title }), props.names.length === 0
                ? _jsx("span", { className: "dsh-warm-settings-hint", children: props.t('none') })
                : (_jsx("ul", { children: props.names.map((name, index) => _jsx("li", { children: name }, `${name}-${index}`)) }))] }));
}
/** Render one independently collapsible source assignment list. */
function SourceList(props) {
    return (_jsxs("details", { className: "dsh-warm-settings-source-section", "data-source-list": props.list, children: [_jsxs("summary", { className: "dsh-warm-settings-source-section-summary", children: [_jsxs("span", { className: "dsh-warm-settings-source-section-title", children: [_jsx("strong", { children: props.title }), _jsxs("span", { children: [props.countLabel, ": ", props.sources.length] })] }), _jsx(AssignmentSummary, { sources: props.sources, t: props.t })] }), _jsxs("div", { className: "dsh-warm-settings-source-section-body", children: [_jsx("p", { className: "dsh-warm-settings-hint", children: props.hint }), _jsx("div", { className: "dsh-warm-settings-source-list", children: props.sources.length === 0
                            ? _jsx("div", { className: "dsh-warm-settings-empty", children: props.t('noSources') })
                            : props.sources.map(source => (_jsx(SourceRow, { list: props.list, source: source, disabled: props.disabled, t: props.t, onAssign: props.onAssign }, source.source))) })] })] }));
}
/**
 * Render the complete editable form placed inside the modal.
 * @param props - controller snapshot, translations, and staged form actions.
 * @returns the configuration element tree.
 */
export function WarmMinimalSettingsContent(props) {
    const { state, t } = props;
    const disabled = state.status === 'loading' || !state.writable || state.saving;
    const saveDisabled = disabled || !state.dirty;
    return (_jsxs("div", { className: "dsh-warm-settings-modal-layout", children: [state.failure === undefined
                ? null
                : _jsx("div", { className: "dsh-warm-settings-alert", role: "alert", children: state.failure }), state.draft === undefined
                ? (_jsxs("div", { className: "dsh-warm-settings-status", role: "status", children: [_jsx("span", { children: state.status === 'loading'
                                ? t('loading')
                                : state.status === 'unavailable' ? t('unavailable') : t('loadFailed') }), state.status === 'error'
                            ? (_jsx("button", { type: "button", className: "dsh-warm-settings-button", onClick: props.reloadInventory, children: t('retry') }))
                            : null] }))
                : (_jsxs(_Fragment, { children: [!state.writable
                            ? _jsx("div", { className: "dsh-warm-settings-alert", role: "status", children: t('readOnly') })
                            : null, _jsxs("section", { className: "dsh-warm-settings-bootstrap", "aria-labelledby": "dsh-warm-bootstrap-title", children: [_jsxs("div", { className: "dsh-warm-settings-section-heading", children: [_jsx("h3", { id: "dsh-warm-bootstrap-title", children: t('bootstrapConfiguration') }), _jsx("span", { className: "dsh-warm-settings-hint", children: t('bootstrapConfigurationHint') })] }), _jsxs("label", { className: "dsh-warm-settings-check", children: [_jsx("input", { type: "checkbox", checked: state.draft.bootstrapEnabled, disabled: disabled, onChange: event => { props.setBootstrapEnabled(event.target.checked); } }), _jsxs("span", { children: [_jsx("strong", { children: t('bootstrapEnabled') }), _jsx("small", { children: t('bootstrapEnabledHint') })] })] }), _jsxs("div", { className: "dsh-warm-settings-bootstrap-fields", children: [_jsxs("label", { className: "dsh-warm-settings-field", children: [_jsx("span", { className: "dsh-warm-settings-label", children: t('bootstrapMessage') }), _jsx("textarea", { className: "dsh-warm-settings-textarea", value: state.draft.bootstrapMessage, disabled: disabled, onChange: event => { props.setBootstrapMessage(event.target.value); } }), _jsx("span", { className: "dsh-warm-settings-hint", children: t('bootstrapMessageHint') })] }), _jsxs("label", { className: "dsh-warm-settings-field", children: [_jsx("span", { className: "dsh-warm-settings-label", children: t('postBootstrapGuidance') }), _jsx("textarea", { className: "dsh-warm-settings-textarea", value: state.draft.guidance, disabled: disabled, onChange: event => { props.setGuidance(event.target.value); } }), _jsx("span", { className: "dsh-warm-settings-hint", children: t('postBootstrapGuidanceHint') })] })] })] }), _jsxs("div", { className: "dsh-warm-settings-source-sections", children: [_jsx(SourceList, { list: "prompt", title: t('promptSources'), countLabel: t('promptSourceCount'), hint: t('promptSourcesHint'), sources: state.promptSources, disabled: disabled, t: t, onAssign: (sourceId, assignment) => { props.assign('prompt', sourceId, assignment); } }), _jsx(SourceList, { list: "tool", title: t('toolSources'), countLabel: t('toolSourceCount'), hint: t('toolSourcesHint'), sources: state.toolSources, disabled: disabled, t: t, onAssign: (sourceId, assignment) => { props.assign('tool', sourceId, assignment); } })] }), _jsxs("div", { className: "dsh-warm-settings-footer", children: [_jsxs("span", { className: "dsh-warm-settings-revision", children: [t('revision'), ": ", state.revision] }), _jsx("button", { type: "button", className: "dsh-warm-settings-button", disabled: state.status === 'loading' || state.saving, onClick: props.reloadInventory, children: t('reload') }), _jsx("button", { type: "button", className: "dsh-warm-settings-button", disabled: disabled || !state.dirty, onClick: props.discard, children: t('discard') }), _jsx("button", { type: "button", className: "dsh-warm-settings-button dsh-warm-settings-button-primary", disabled: saveDisabled, onClick: props.save, children: t(state.saving ? 'saving' : 'save') })] })] }))] }));
}
/**
 * Render the warm-minimal settings summary card and modal.
 * @param props - locale, authoritative snapshot hook, and staged form actions.
 * @returns the card element tree.
 */
export function WarmMinimalCard(props) {
    const [modalOpen, setModalOpen] = useState(false);
    const state = props.useWarmMinimalCard(snapshot => snapshot);
    const { t } = props;
    const bootstrapSummary = state.draft === undefined
        ? state.status === 'loading' ? t('loadingShort') : t('unavailableShort')
        : state.draft.bootstrapEnabled ? t('bootstrapEnabledShort') : t('bootstrapDisabled');
    return (_jsxs("li", { className: "dsh-warm-settings-card", children: [_jsxs("div", { className: "dsh-warm-settings-card-main", children: [_jsxs("span", { className: "dsh-warm-settings-heading", children: [_jsx("span", { className: "dsh-warm-settings-title", children: t('title') }), _jsx("span", { className: "dsh-warm-settings-description", children: t('description') })] }), _jsxs("div", { className: "dsh-warm-settings-card-summaries", children: [_jsx("span", { "data-warm-minimal-summary": "bootstrap", children: bootstrapSummary }), _jsxs("span", { "data-warm-minimal-summary": "prompt", children: [t('promptSourceCount'), ": ", state.promptSources.length] }), _jsxs("span", { "data-warm-minimal-summary": "tool", children: [t('toolSourceCount'), ": ", state.toolSources.length] }), state.dirty ? _jsx("span", { className: "dsh-warm-settings-badge", children: t('unsaved') }) : null, state.failure === undefined
                                ? null
                                : _jsx("span", { className: "dsh-warm-settings-error-badge", title: state.failure, children: t('errorStatus') })] })] }), _jsx("button", { type: "button", className: "dsh-warm-settings-button dsh-warm-settings-open", "data-open-warm-minimal-settings": "true", onClick: () => { setModalOpen(true); }, children: t('openSettings') }), _jsx(Modal, { open: modalOpen, onClose: () => { setModalOpen(false); }, title: t('modalTitle'), description: t('modalDescription'), closeLabel: t('close'), className: "dsh-warm-settings-modal", contentClassName: "dsh-warm-settings-modal-content", children: _jsx(WarmMinimalSettingsContent, { ...props, state: state }) })] }));
}
//# sourceMappingURL=WarmMinimalCard.js.map