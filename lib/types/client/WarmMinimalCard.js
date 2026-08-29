import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Official Plugins-page card for the warm-minimal Host configuration. */
import { useState } from 'react';
import { isSourceAssignment } from "./contract.js";
/** Assignment values in the stable select order. */
const ASSIGNMENTS = ['parent-only', 'child-only', 'shared'];
/** Translate an assignment value. */
function assignmentLabel(t, assignment) {
    switch (assignment) {
        case 'parent-only': return t('parentOnly');
        case 'child-only': return t('childOnly');
        case 'shared': return t('shared');
    }
}
/** Render one prompt/context or tool source list. */
function SourceList(props) {
    return (_jsxs("section", { className: "dsh-warm-settings-field", "aria-labelledby": `${props.id}-title`, children: [_jsxs("div", { children: [_jsx("div", { id: `${props.id}-title`, className: "dsh-warm-settings-label", children: props.title }), _jsx("div", { className: "dsh-warm-settings-hint", children: props.hint })] }), _jsx("div", { className: "dsh-warm-settings-source-list", children: props.sources.length === 0
                    ? _jsx("div", { className: "dsh-warm-settings-hint", children: props.t('noSources') })
                    : props.sources.map((source, index) => {
                        const inputId = `${props.id}-${index}`;
                        return (_jsxs("div", { className: "dsh-warm-settings-source", children: [_jsxs("label", { htmlFor: inputId, title: source.source, children: [_jsx("span", { className: "dsh-warm-settings-source-name", children: source.shortSource }), _jsxs("span", { className: "dsh-warm-settings-source-id", children: [props.t('contributions'), ": ", source.names.join(', ')] })] }), _jsx("select", { id: inputId, className: "dsh-warm-settings-select", value: source.assignment, disabled: props.disabled, "aria-label": `${props.title}: ${source.source}`, onChange: (event) => {
                                        if (isSourceAssignment(event.target.value))
                                            props.onAssign(source.source, event.target.value);
                                    }, children: ASSIGNMENTS.map(assignment => (_jsx("option", { value: assignment, children: assignmentLabel(props.t, assignment) }, assignment))) })] }, source.source));
                    }) })] }));
}
/**
 * Render the warm-minimal settings card.
 * @param props - locale, authoritative snapshot hook, and staged form actions.
 * @returns the card element tree.
 */
export function WarmMinimalCard(props) {
    const [open, setOpen] = useState(false);
    const state = props.useWarmMinimalCard(snapshot => snapshot);
    const { t } = props;
    const disabled = !state.writable || state.saving;
    const saveDisabled = disabled || !state.dirty;
    return (_jsxs("li", { className: "dsh-warm-settings-card", children: [_jsxs("button", { type: "button", className: "dsh-warm-settings-header", "aria-expanded": open, "aria-label": `${t(open ? 'collapse' : 'expand')}: ${t('title')}`, onClick: () => { setOpen(!open); }, children: [_jsxs("span", { className: "dsh-warm-settings-heading", children: [_jsx("span", { className: "dsh-warm-settings-title", children: t('title') }), _jsx("span", { className: "dsh-warm-settings-description", children: t('description') })] }), state.dirty ? _jsx("span", { className: "dsh-warm-settings-badge", children: t('unsaved') }) : null, _jsx("span", { className: "dsh-warm-settings-chevron", "data-open": open, "aria-hidden": "true", children: "\u2304" })] }), open
                ? (_jsxs("div", { className: "dsh-warm-settings-body", children: [state.failure === undefined
                            ? null
                            : _jsx("div", { className: "dsh-warm-settings-alert", role: "alert", children: state.failure }), state.draft === undefined
                            ? (_jsxs("div", { className: "dsh-warm-settings-status", role: "status", children: [state.status === 'loading'
                                        ? t('loading')
                                        : state.status === 'unavailable' ? t('unavailable') : t('loadFailed'), state.status === 'error'
                                        ? (_jsx("button", { type: "button", className: "dsh-warm-settings-button", onClick: props.reloadInventory, children: t('retry') }))
                                        : null] }))
                            : (_jsxs(_Fragment, { children: [!state.writable
                                        ? _jsx("div", { className: "dsh-warm-settings-alert", role: "status", children: t('readOnly') })
                                        : null, _jsxs("div", { className: "dsh-warm-settings-field", children: [_jsxs("label", { className: "dsh-warm-settings-check", children: [_jsx("input", { type: "checkbox", checked: state.draft.bootstrapEnabled, disabled: disabled, onChange: event => { props.setBootstrapEnabled(event.target.checked); } }), _jsx("span", { children: t('bootstrapEnabled') })] }), _jsx("div", { className: "dsh-warm-settings-hint", children: t('bootstrapEnabledHint') })] }), _jsxs("div", { className: "dsh-warm-settings-field", children: [_jsx("label", { className: "dsh-warm-settings-label", htmlFor: "dsh-warm-bootstrap-message", children: t('bootstrapMessage') }), _jsx("textarea", { id: "dsh-warm-bootstrap-message", className: "dsh-warm-settings-textarea", value: state.draft.bootstrapMessage, disabled: disabled, onChange: event => { props.setBootstrapMessage(event.target.value); } }), _jsx("div", { className: "dsh-warm-settings-hint", children: t('bootstrapMessageHint') })] }), _jsxs("div", { className: "dsh-warm-settings-field", children: [_jsx("label", { className: "dsh-warm-settings-label", htmlFor: "dsh-warm-post-guidance", children: t('postBootstrapGuidance') }), _jsx("textarea", { id: "dsh-warm-post-guidance", className: "dsh-warm-settings-textarea", value: state.draft.guidance, disabled: disabled, onChange: event => { props.setGuidance(event.target.value); } }), _jsx("div", { className: "dsh-warm-settings-hint", children: t('postBootstrapGuidanceHint') })] }), _jsx(SourceList, { id: "dsh-warm-prompt-source", title: t('promptSources'), hint: t('promptSourcesHint'), sources: state.promptSources, disabled: disabled, t: t, onAssign: (sourceId, assignment) => { props.assign('prompt', sourceId, assignment); } }), _jsx(SourceList, { id: "dsh-warm-tool-source", title: t('toolSources'), hint: t('toolSourcesHint'), sources: state.toolSources, disabled: disabled, t: t, onAssign: (sourceId, assignment) => { props.assign('tool', sourceId, assignment); } }), _jsxs("div", { className: "dsh-warm-settings-footer", children: [_jsxs("span", { className: "dsh-warm-settings-revision", children: [t('revision'), ": ", state.revision] }), _jsx("button", { type: "button", className: "dsh-warm-settings-button", disabled: state.saving, onClick: props.reloadInventory, children: t('reload') }), _jsx("button", { type: "button", className: "dsh-warm-settings-button", disabled: !state.dirty || state.saving, onClick: props.discard, children: t('discard') }), _jsx("button", { type: "button", className: "dsh-warm-settings-button dsh-warm-settings-button-primary", disabled: saveDisabled, onClick: props.save, children: t(state.saving ? 'saving' : 'save') })] })] }))] }))
                : null] }));
}
//# sourceMappingURL=WarmMinimalCard.js.map