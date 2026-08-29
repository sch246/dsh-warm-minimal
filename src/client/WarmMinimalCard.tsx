/** Official Plugins-page card for the warm-minimal Host configuration. */

import { useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { isSourceAssignment, type AssignedSource, type SourceAssignment } from './contract.ts'
import type { WarmMinimalCardObservable } from './controller.ts'
import type { WarmMinimalLocaleKey } from './locales.ts'

/** Slot face injected by this card's registration. */
export interface WarmMinimalCardFace {
  hooks: {
    /** Controller snapshot bound by the renderer as `useWarmMinimalCard`. */
    warmMinimalCard: WarmMinimalCardObservable
  }
  /** Stage bootstrap enablement. */
  setBootstrapEnabled: (enabled: boolean) => void
  /** Stage the bootstrap user-role message. */
  setBootstrapMessage: (message: string) => void
  /** Stage post-bootstrap main-agent guidance. */
  setGuidance: (guidance: string) => void
  /** Stage one stable source assignment. */
  assign: (list: 'prompt' | 'tool', sourceId: string, assignment: SourceAssignment) => void
  /** Drop the current draft. */
  discard: () => void
  /** Re-query the read-only Host inventory. */
  reloadInventory: () => void
  /** Submit the current revision-fenced draft. */
  save: () => void
}

/** Props composed by the `settings.plugin.item` slot runtime. */
export type WarmMinimalCardProps =
  PropsRuntime<'settings.plugin.item'>
  & PropsLocale<'warm-minimal.settings'>
  & InjectFace<WarmMinimalCardFace>

/** Assignment values in the stable select order. */
const ASSIGNMENTS: readonly SourceAssignment[] = ['parent-only', 'child-only', 'shared']

/** Translate an assignment value. */
function assignmentLabel(t: (key: WarmMinimalLocaleKey) => string, assignment: SourceAssignment): string {
  switch (assignment) {
    case 'parent-only': return t('parentOnly')
    case 'child-only': return t('childOnly')
    case 'shared': return t('shared')
  }
}

/** Render one prompt/context or tool source list. */
function SourceList(props: {
  id: string
  title: string
  hint: string
  sources: readonly AssignedSource[]
  disabled: boolean
  t: (key: WarmMinimalLocaleKey) => string
  onAssign: (sourceId: string, assignment: SourceAssignment) => void
}) {
  return (
    <section className="dsh-warm-settings-field" aria-labelledby={`${props.id}-title`}>
      <div>
        <div id={`${props.id}-title`} className="dsh-warm-settings-label">{props.title}</div>
        <div className="dsh-warm-settings-hint">{props.hint}</div>
      </div>
      <div className="dsh-warm-settings-source-list">
        {props.sources.length === 0
          ? <div className="dsh-warm-settings-hint">{props.t('noSources')}</div>
          : props.sources.map((source, index) => {
              const inputId = `${props.id}-${index}`
              return (
              <div className="dsh-warm-settings-source" key={source.source}>
                <label htmlFor={inputId} title={source.source}>
                  <span className="dsh-warm-settings-source-name">{source.shortSource}</span>
                  <span className="dsh-warm-settings-source-id">
                    {props.t('contributions')}: {source.names.join(', ')}
                  </span>
                </label>
                <select
                  id={inputId}
                  className="dsh-warm-settings-select"
                  value={source.assignment}
                  disabled={props.disabled}
                  aria-label={`${props.title}: ${source.source}`}
                  onChange={(event) => {
                    if (isSourceAssignment(event.target.value)) props.onAssign(source.source, event.target.value)
                  }}
                >
                  {ASSIGNMENTS.map(assignment => (
                    <option key={assignment} value={assignment}>{assignmentLabel(props.t, assignment)}</option>
                  ))}
                </select>
              </div>
              )
            })}
      </div>
    </section>
  )
}

/**
 * Render the warm-minimal settings card.
 * @param props - locale, authoritative snapshot hook, and staged form actions.
 * @returns the card element tree.
 */
export function WarmMinimalCard(props: WarmMinimalCardProps) {
  const [open, setOpen] = useState(false)
  const state = props.useWarmMinimalCard(snapshot => snapshot)
  const { t } = props
  const disabled = !state.writable || state.saving
  const saveDisabled = disabled || !state.dirty

  return (
    <li className="dsh-warm-settings-card">
      <button
        type="button"
        className="dsh-warm-settings-header"
        aria-expanded={open}
        aria-label={`${t(open ? 'collapse' : 'expand')}: ${t('title')}`}
        onClick={() => { setOpen(!open) }}
      >
        <span className="dsh-warm-settings-heading">
          <span className="dsh-warm-settings-title">{t('title')}</span>
          <span className="dsh-warm-settings-description">{t('description')}</span>
        </span>
        {state.dirty ? <span className="dsh-warm-settings-badge">{t('unsaved')}</span> : null}
        <span className="dsh-warm-settings-chevron" data-open={open} aria-hidden="true">⌄</span>
      </button>
      {open
        ? (
          <div className="dsh-warm-settings-body">
            {state.failure === undefined
              ? null
              : <div className="dsh-warm-settings-alert" role="alert">{state.failure}</div>}
            {state.draft === undefined
              ? (
                <div className="dsh-warm-settings-status" role="status">
                  {state.status === 'loading'
                    ? t('loading')
                    : state.status === 'unavailable' ? t('unavailable') : t('loadFailed')}
                  {state.status === 'error'
                    ? (
                      <button type="button" className="dsh-warm-settings-button" onClick={props.reloadInventory}>
                        {t('retry')}
                      </button>
                      )
                    : null}
                </div>
                )
              : (
                <>
                  {!state.writable
                    ? <div className="dsh-warm-settings-alert" role="status">{t('readOnly')}</div>
                    : null}
                  <div className="dsh-warm-settings-field">
                    <label className="dsh-warm-settings-check">
                      <input
                        type="checkbox"
                        checked={state.draft.bootstrapEnabled}
                        disabled={disabled}
                        onChange={event => { props.setBootstrapEnabled(event.target.checked) }}
                      />
                      <span>{t('bootstrapEnabled')}</span>
                    </label>
                    <div className="dsh-warm-settings-hint">{t('bootstrapEnabledHint')}</div>
                  </div>
                  <div className="dsh-warm-settings-field">
                    <label className="dsh-warm-settings-label" htmlFor="dsh-warm-bootstrap-message">
                      {t('bootstrapMessage')}
                    </label>
                    <textarea
                      id="dsh-warm-bootstrap-message"
                      className="dsh-warm-settings-textarea"
                      value={state.draft.bootstrapMessage}
                      disabled={disabled}
                      onChange={event => { props.setBootstrapMessage(event.target.value) }}
                    />
                    <div className="dsh-warm-settings-hint">{t('bootstrapMessageHint')}</div>
                  </div>
                  <div className="dsh-warm-settings-field">
                    <label className="dsh-warm-settings-label" htmlFor="dsh-warm-post-guidance">
                      {t('postBootstrapGuidance')}
                    </label>
                    <textarea
                      id="dsh-warm-post-guidance"
                      className="dsh-warm-settings-textarea"
                      value={state.draft.guidance}
                      disabled={disabled}
                      onChange={event => { props.setGuidance(event.target.value) }}
                    />
                    <div className="dsh-warm-settings-hint">{t('postBootstrapGuidanceHint')}</div>
                  </div>
                  <SourceList
                    id="dsh-warm-prompt-source"
                    title={t('promptSources')}
                    hint={t('promptSourcesHint')}
                    sources={state.promptSources}
                    disabled={disabled}
                    t={t}
                    onAssign={(sourceId, assignment) => { props.assign('prompt', sourceId, assignment) }}
                  />
                  <SourceList
                    id="dsh-warm-tool-source"
                    title={t('toolSources')}
                    hint={t('toolSourcesHint')}
                    sources={state.toolSources}
                    disabled={disabled}
                    t={t}
                    onAssign={(sourceId, assignment) => { props.assign('tool', sourceId, assignment) }}
                  />
                  <div className="dsh-warm-settings-footer">
                    <span className="dsh-warm-settings-revision">{t('revision')}: {state.revision}</span>
                    <button
                      type="button"
                      className="dsh-warm-settings-button"
                      disabled={state.saving}
                      onClick={props.reloadInventory}
                    >
                      {t('reload')}
                    </button>
                    <button
                      type="button"
                      className="dsh-warm-settings-button"
                      disabled={!state.dirty || state.saving}
                      onClick={props.discard}
                    >
                      {t('discard')}
                    </button>
                    <button
                      type="button"
                      className="dsh-warm-settings-button dsh-warm-settings-button-primary"
                      disabled={saveDisabled}
                      onClick={props.save}
                    >
                      {t(state.saving ? 'saving' : 'save')}
                    </button>
                  </div>
                </>
                )}
          </div>
          )
        : null}
    </li>
  )
}
