/** Official Plugins-page summary and modal editor for warm-minimal configuration. */

import { useId, useState } from 'react'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import {
  isSourceAssignment,
  type AssignedPromptSource,
  type AssignedSource,
  type AssignedToolSource,
  type SourceAssignment,
} from './contract.ts'
import type { WarmMinimalCardObservable, WarmMinimalCardView } from './controller.ts'
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

/** Assignment values in segmented-control order. */
const ASSIGNMENTS: readonly SourceAssignment[] = ['parent-only', 'child-only', 'shared']

type Translate = (key: WarmMinimalLocaleKey) => string

/** Props for the configuration content rendered inside the modal. */
export interface WarmMinimalSettingsContentProps {
  /** Current controller projection. */
  state: WarmMinimalCardView
  /** Warm-minimal dictionary lookup. */
  t: Translate
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

/** Translate an assignment value. */
function assignmentLabel(t: Translate, assignment: SourceAssignment): string {
  switch (assignment) {
    case 'parent-only': return t('parentOnly')
    case 'child-only': return t('childOnly')
    case 'shared': return t('shared')
  }
}

/** Count the three effective assignments in a source list. */
function assignmentCounts(sources: readonly AssignedSource[]): Record<SourceAssignment, number> {
  const counts: Record<SourceAssignment, number> = { 'parent-only': 0, 'child-only': 0, shared: 0 }
  for (const source of sources) counts[source.assignment] += 1
  return counts
}

/** Render one compact assignment summary. */
function AssignmentSummary(props: { sources: readonly AssignedSource[], t: Translate }) {
  const counts = assignmentCounts(props.sources)
  return (
    <span
      className="dsh-warm-settings-assignment-summary"
      data-parent-only={counts['parent-only']}
      data-child-only={counts['child-only']}
      data-shared={counts.shared}
    >
      {props.t('parentOnly')} {counts['parent-only']}
      <span aria-hidden="true"> · </span>
      {props.t('childOnly')} {counts['child-only']}
      <span aria-hidden="true"> · </span>
      {props.t('shared')} {counts.shared}
    </span>
  )
}

/** Render the native-radio segmented assignment control for one source. */
function AssignmentControl(props: {
  list: 'prompt' | 'tool'
  source: AssignedSource
  disabled: boolean
  t: Translate
  onAssign: (sourceId: string, assignment: SourceAssignment) => void
}) {
  const controlId = useId()
  return (
    <fieldset
      className="dsh-warm-settings-segments"
      role="radiogroup"
      aria-label={`${props.t('assignment')}: ${sourceHeading(props.source, props.t)}`}
      disabled={props.disabled}
    >
      <legend className="dsh-warm-settings-sr-only">
        {props.t('assignment')}: {sourceHeading(props.source, props.t)}
      </legend>
      {ASSIGNMENTS.map((assignment) => {
        const inputId = `${controlId}-${assignment}`
        return (
          <label
            key={assignment}
            className="dsh-warm-settings-segment"
            data-checked={props.source.assignment === assignment}
            htmlFor={inputId}
          >
            <input
              id={inputId}
              name={`${props.list}-assignment-${controlId}`}
              type="radio"
              value={assignment}
              checked={props.source.assignment === assignment}
              disabled={props.disabled}
              onChange={(event) => {
                if (isSourceAssignment(event.target.value)) props.onAssign(props.source.source, event.target.value)
              }}
            />
            <span>{assignmentLabel(props.t, assignment)}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

function PromptSourceHeading(props: { source: AssignedPromptSource, t: Translate }) {
  return (
    <span className="dsh-warm-settings-source-copy">
      <span className="dsh-warm-settings-contribution-line">
        <span className="dsh-warm-settings-contribution-kind">{props.t('sections')}</span>
        <span>{props.source.sections.length === 0 ? props.t('none') : props.source.sections.join(', ')}</span>
      </span>
      <span className="dsh-warm-settings-contribution-line">
        <span className="dsh-warm-settings-contribution-kind">{props.t('contexts')}</span>
        <span>{props.source.contexts.length === 0 ? props.t('none') : props.source.contexts.join(', ')}</span>
      </span>
    </span>
  )
}

function ToolSourceHeading(props: { source: AssignedToolSource, t: Translate }) {
  const description = props.source.tools.find(tool => tool.description !== undefined)?.description
  return (
    <span className="dsh-warm-settings-source-copy">
      <span className="dsh-warm-settings-tool-names">{props.source.tools.map(tool => tool.name).join(', ')}</span>
      <span className="dsh-warm-settings-tool-preview">
        {description === undefined || description.length === 0 ? props.t('noDescription') : description}
      </span>
    </span>
  )
}

function sourceHeading(source: AssignedSource, t: Translate): string {
  if ('tools' in source) return source.tools.map(tool => tool.name).join(', ')
  const names = [...source.sections, ...source.contexts]
  return names.length === 0 ? t('noSources') : names.join(', ')
}

/** Render one source row with sibling disclosure and radio controls. */
function SourceRow(props: {
  list: 'prompt' | 'tool'
  source: AssignedSource
  disabled: boolean
  t: Translate
  onAssign: (sourceId: string, assignment: SourceAssignment) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const detailId = useId()
  return (
    <div className="dsh-warm-settings-source" data-source-row={props.list}>
      <div className="dsh-warm-settings-source-main">
        <button
          type="button"
          className="dsh-warm-settings-source-disclosure"
          aria-expanded={expanded}
          aria-controls={detailId}
          aria-label={`${props.t(expanded ? 'hideDetails' : 'showDetails')}: ${sourceHeading(props.source, props.t)}`}
          onClick={() => { setExpanded(!expanded) }}
        >
          <span className="dsh-warm-settings-source-chevron" data-open={expanded} aria-hidden="true">›</span>
          {'tools' in props.source
            ? <ToolSourceHeading source={props.source} t={props.t} />
            : <PromptSourceHeading source={props.source} t={props.t} />}
        </button>
        <AssignmentControl {...props} />
      </div>
      {expanded
        ? (
          <div id={detailId} className="dsh-warm-settings-source-detail">
            <div className="dsh-warm-settings-detail-source">
              <span>{props.t('source')}</span>
              <code>{props.source.source}</code>
            </div>
            {'tools' in props.source
              ? (
                <div className="dsh-warm-settings-tool-details">
                  {props.source.tools.map((tool, index) => (
                    <div className="dsh-warm-settings-tool-detail" key={`${tool.name}-${index}`}>
                      <strong>{tool.name}</strong>
                      <span>{tool.description === undefined || tool.description.length === 0
                        ? props.t('noDescription')
                        : tool.description}</span>
                    </div>
                  ))}
                </div>
                )
              : (
                <div className="dsh-warm-settings-prompt-details">
                  <ContributionDetails title={props.t('sections')} names={props.source.sections} t={props.t} />
                  <ContributionDetails title={props.t('contexts')} names={props.source.contexts} t={props.t} />
                </div>
                )}
          </div>
          )
        : null}
    </div>
  )
}

function ContributionDetails(props: { title: string, names: readonly string[], t: Translate }) {
  return (
    <div>
      <strong>{props.title}</strong>
      {props.names.length === 0
        ? <span className="dsh-warm-settings-hint">{props.t('none')}</span>
        : (
          <ul>
            {props.names.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
          </ul>
          )}
    </div>
  )
}

/** Render one independently collapsible source assignment list. */
function SourceList(props: {
  list: 'prompt' | 'tool'
  title: string
  countLabel: string
  hint: string
  sources: readonly AssignedSource[]
  disabled: boolean
  t: Translate
  onAssign: (sourceId: string, assignment: SourceAssignment) => void
}) {
  return (
    <details className="dsh-warm-settings-source-section" data-source-list={props.list}>
      <summary className="dsh-warm-settings-source-section-summary">
        <span className="dsh-warm-settings-source-section-title">
          <strong>{props.title}</strong>
          <span>{props.countLabel}: {props.sources.length}</span>
        </span>
        <AssignmentSummary sources={props.sources} t={props.t} />
      </summary>
      <div className="dsh-warm-settings-source-section-body">
        <p className="dsh-warm-settings-hint">{props.hint}</p>
        <div className="dsh-warm-settings-source-list">
          {props.sources.length === 0
            ? <div className="dsh-warm-settings-empty">{props.t('noSources')}</div>
            : props.sources.map(source => (
              <SourceRow
                key={source.source}
                list={props.list}
                source={source}
                disabled={props.disabled}
                t={props.t}
                onAssign={props.onAssign}
              />
            ))}
        </div>
      </div>
    </details>
  )
}

/**
 * Render the complete editable form placed inside the modal.
 * @param props - controller snapshot, translations, and staged form actions.
 * @returns the configuration element tree.
 */
export function WarmMinimalSettingsContent(props: WarmMinimalSettingsContentProps) {
  const { state, t } = props
  const disabled = state.status === 'loading' || !state.writable || state.saving
  const saveDisabled = disabled || !state.dirty

  return (
    <div className="dsh-warm-settings-modal-layout">
      {state.failure === undefined
        ? null
        : <div className="dsh-warm-settings-alert" role="alert">{state.failure}</div>}
      {state.draft === undefined
        ? (
          <div className="dsh-warm-settings-status" role="status">
            <span>
              {state.status === 'loading'
                ? t('loading')
                : state.status === 'unavailable' ? t('unavailable') : t('loadFailed')}
            </span>
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
            <section className="dsh-warm-settings-bootstrap" aria-labelledby="dsh-warm-bootstrap-title">
              <div className="dsh-warm-settings-section-heading">
                <h3 id="dsh-warm-bootstrap-title">{t('bootstrapConfiguration')}</h3>
                <span className="dsh-warm-settings-hint">{t('bootstrapConfigurationHint')}</span>
              </div>
              <label className="dsh-warm-settings-check">
                <input
                  type="checkbox"
                  checked={state.draft.bootstrapEnabled}
                  disabled={disabled}
                  onChange={event => { props.setBootstrapEnabled(event.target.checked) }}
                />
                <span>
                  <strong>{t('bootstrapEnabled')}</strong>
                  <small>{t('bootstrapEnabledHint')}</small>
                </span>
              </label>
              <div className="dsh-warm-settings-bootstrap-fields">
                <label className="dsh-warm-settings-field">
                  <span className="dsh-warm-settings-label">{t('bootstrapMessage')}</span>
                  <textarea
                    className="dsh-warm-settings-textarea"
                    value={state.draft.bootstrapMessage}
                    disabled={disabled}
                    onChange={event => { props.setBootstrapMessage(event.target.value) }}
                  />
                  <span className="dsh-warm-settings-hint">{t('bootstrapMessageHint')}</span>
                </label>
                <label className="dsh-warm-settings-field">
                  <span className="dsh-warm-settings-label">{t('postBootstrapGuidance')}</span>
                  <textarea
                    className="dsh-warm-settings-textarea"
                    value={state.draft.guidance}
                    disabled={disabled}
                    onChange={event => { props.setGuidance(event.target.value) }}
                  />
                  <span className="dsh-warm-settings-hint">{t('postBootstrapGuidanceHint')}</span>
                </label>
              </div>
            </section>
            <div className="dsh-warm-settings-source-sections">
              <SourceList
                list="prompt"
                title={t('promptSources')}
                countLabel={t('promptSourceCount')}
                hint={t('promptSourcesHint')}
                sources={state.promptSources}
                disabled={disabled}
                t={t}
                onAssign={(sourceId, assignment) => { props.assign('prompt', sourceId, assignment) }}
              />
              <SourceList
                list="tool"
                title={t('toolSources')}
                countLabel={t('toolSourceCount')}
                hint={t('toolSourcesHint')}
                sources={state.toolSources}
                disabled={disabled}
                t={t}
                onAssign={(sourceId, assignment) => { props.assign('tool', sourceId, assignment) }}
              />
            </div>
            <div className="dsh-warm-settings-footer">
              <span className="dsh-warm-settings-revision">{t('revision')}: {state.revision}</span>
              <button
                type="button"
                className="dsh-warm-settings-button"
                disabled={state.status === 'loading' || state.saving}
                onClick={props.reloadInventory}
              >
                {t('reload')}
              </button>
              <button
                type="button"
                className="dsh-warm-settings-button"
                disabled={disabled || !state.dirty}
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
}

/**
 * Render the warm-minimal settings summary card and modal.
 * @param props - locale, authoritative snapshot hook, and staged form actions.
 * @returns the card element tree.
 */
export function WarmMinimalCard(props: WarmMinimalCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const state = props.useWarmMinimalCard(snapshot => snapshot)
  const { t } = props

  const bootstrapSummary = state.draft === undefined
    ? state.status === 'loading' ? t('loadingShort') : t('unavailableShort')
    : state.draft.bootstrapEnabled ? t('bootstrapEnabledShort') : t('bootstrapDisabled')

  return (
    <li className="dsh-warm-settings-card">
      <div className="dsh-warm-settings-card-main">
        <span className="dsh-warm-settings-heading">
          <span className="dsh-warm-settings-title">{t('title')}</span>
          <span className="dsh-warm-settings-description">{t('description')}</span>
        </span>
        <div className="dsh-warm-settings-card-summaries">
          <span data-warm-minimal-summary="bootstrap">{bootstrapSummary}</span>
          <span data-warm-minimal-summary="prompt">{t('promptSourceCount')}: {state.promptSources.length}</span>
          <span data-warm-minimal-summary="tool">{t('toolSourceCount')}: {state.toolSources.length}</span>
          {state.dirty ? <span className="dsh-warm-settings-badge">{t('unsaved')}</span> : null}
          {state.failure === undefined
            ? null
            : <span className="dsh-warm-settings-error-badge" title={state.failure}>{t('errorStatus')}</span>}
        </div>
      </div>
      <button
        type="button"
        className="dsh-warm-settings-button dsh-warm-settings-open"
        data-open-warm-minimal-settings="true"
        onClick={() => { setModalOpen(true) }}
      >
        {t('openSettings')}
      </button>
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false) }}
        title={t('modalTitle')}
        description={t('modalDescription')}
        closeLabel={t('close')}
        className="dsh-warm-settings-modal"
        contentClassName="dsh-warm-settings-modal-content"
      >
        <WarmMinimalSettingsContent {...props} state={state} />
      </Modal>
    </li>
  )
}
