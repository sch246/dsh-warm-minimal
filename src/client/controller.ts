/** Staged Plugins-card form over one official settings namespace scope. */

import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type {
  AssignedSource, InventorySource, SourceAssignment, WarmMinimalSettings,
} from './contract.ts'

/** Read-only generated Remote face consumed by the controller. */
export interface WarmMinimalInventoryRemote {
  /** Query the current contribution inventory. */
  queryInventory(): Promise<RemoteResult<readonly InventorySource[]>>
}

/** Immutable projection rendered by the settings card. */
export interface WarmMinimalCardView {
  /** Settings and inventory readiness. */
  status: 'loading' | 'ready' | 'unavailable' | 'error'
  /** Current settings namespace revision. */
  revision: number | undefined
  /** Whether the Host document accepts writes. */
  writable: boolean
  /** Effective settings plus browser-local staged edits. */
  draft: WarmMinimalSettings | undefined
  /** Prompt and context sources, with section/context names merged. */
  promptSources: readonly AssignedSource[]
  /** Tool sources and their contributed tool names. */
  toolSources: readonly AssignedSource[]
  /** Whether the browser holds edits not yet accepted by the Host. */
  dirty: boolean
  /** Whether staged fields are crossing the settings scope. */
  saving: boolean
  /** Last inventory or settings-write failure. */
  failure: string | undefined
}

/** Observable consumed by the slot renderer's generated hook. */
export interface WarmMinimalCardObservable {
  /** @returns the current immutable card projection. */
  getSnapshot(): WarmMinimalCardView
  /** @returns a disposer for the registered listener. */
  subscribe(listener: () => void): () => void
}

type SettingsField = keyof WarmMinimalSettings

const SETTINGS_FIELDS: readonly SettingsField[] = [
  'bootstrapEnabled', 'bootstrapMessage', 'guidance', 'promptAssignments', 'toolAssignments',
]

/** One settings card controller; Remote data never enters its write plan. */
export class WarmMinimalCardController implements WarmMinimalCardObservable {
  private readonly listeners = new Set<() => void>()
  private readonly staged: Partial<WarmMinimalSettings> = {}
  private inventory: readonly InventorySource[] | undefined
  private inventoryLoading = false
  private saving = false
  private failure: string | undefined
  private loadPromise: Promise<void> | undefined
  private disposed = false
  private readonly stopScope: () => void
  private view: WarmMinimalCardView

  /**
   * @param scope - official `warm-minimal` settings namespace scope.
   * @param remote - generated read-only inventory Remote namespace.
   */
  constructor(private readonly scope: SettingsScope<WarmMinimalSettings>, private readonly remote: WarmMinimalInventoryRemote) {
    this.view = this.project()
    this.stopScope = scope.subscribe(() => { this.publish() })
  }

  /** @returns the current immutable card projection. */
  getSnapshot = (): WarmMinimalCardView => this.view

  /** @returns a disposer for the registered listener. */
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => {}
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Query the read-only Host inventory, collapsing concurrent requests. */
  loadInventory(): Promise<void> {
    if (this.disposed) return Promise.resolve()
    if (this.loadPromise !== undefined) return this.loadPromise
    this.inventoryLoading = true
    this.failure = undefined
    this.publish()
    const pending = this.readInventory()
    this.loadPromise = pending
    return pending.finally(() => { this.loadPromise = undefined })
  }

  /** Stage bootstrap enablement without writing. */
  setBootstrapEnabled(enabled: boolean): void {
    this.stage('bootstrapEnabled', enabled)
  }

  /** Stage bootstrap user-role text without writing. */
  setBootstrapMessage(message: string): void {
    this.stage('bootstrapMessage', message)
  }

  /** Stage post-bootstrap coordinator guidance without writing. */
  setGuidance(guidance: string): void {
    this.stage('guidance', guidance)
  }

  /** Stage one assignment in the settings-owned source map. */
  assign(list: 'prompt' | 'tool', source: string, assignment: SourceAssignment): void {
    const field = list === 'prompt' ? 'promptAssignments' : 'toolAssignments'
    const current = this.effective()
    if (current === undefined) return
    this.stage(field, { ...current[field], [source]: assignment })
  }

  /** Drop every browser-local edit. */
  discard(): void {
    if (this.disposed || Object.keys(this.staged).length === 0) return
    for (const field of SETTINGS_FIELDS) delete this.staged[field]
    this.failure = undefined
    this.publish()
  }

  /** Write staged fields only through settingsScope, which owns CAS and serialization. */
  async save(): Promise<void> {
    const snapshot = this.scope.getSnapshot()
    if (this.disposed || this.saving || !snapshot.writable || snapshot.value === undefined) return
    const plan = SETTINGS_FIELDS.flatMap((field) => {
      if (!Object.hasOwn(this.staged, field)) return []
      const value = this.staged[field]
      return value === undefined ? [] : [{ field, value }]
    })
    if (plan.length === 0) return
    this.saving = true
    this.failure = undefined
    this.publish()
    try {
      for (const { field, value } of plan) await this.scope.set(field, cloneField(value))
      const accepted = this.scope.getSnapshot().value
      const landed = accepted !== undefined && plan.every(({ field, value }) => sameField(accepted[field], value))
      if (landed) {
        for (const { field } of plan) delete this.staged[field]
      } else {
        this.failure = 'The Host did not accept all staged settings. Review the refreshed values and retry.'
      }
    } catch (error) {
      this.failure = error instanceof Error ? error.message : String(error)
    } finally {
      this.saving = false
      this.publish()
    }
  }

  /** Release the settings subscription and silence later Remote settlements. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopScope()
    this.listeners.clear()
  }

  private async readInventory(): Promise<void> {
    try {
      const result = await this.remote.queryInventory()
      if (this.disposed) return
      if (result.ok) this.inventory = result.value.map(cloneInventorySource)
      else this.failure = `Inventory query failed: ${result.error.code}: ${result.error.message}`
    } catch (error) {
      if (!this.disposed) this.failure = error instanceof Error ? error.message : String(error)
    } finally {
      if (!this.disposed) {
        this.inventoryLoading = false
        this.publish()
      }
    }
  }

  private stage<K extends SettingsField>(field: K, value: WarmMinimalSettings[K]): void {
    if (this.disposed || this.saving || !this.scope.getSnapshot().writable) return
    this.staged[field] = cloneField(value) as Partial<WarmMinimalSettings>[K]
    this.failure = undefined
    this.publish()
  }

  private effective(): WarmMinimalSettings | undefined {
    const accepted = this.scope.getSnapshot().value
    if (accepted === undefined) return undefined
    return {
      bootstrapEnabled: this.staged.bootstrapEnabled ?? accepted.bootstrapEnabled,
      bootstrapMessage: this.staged.bootstrapMessage ?? accepted.bootstrapMessage,
      guidance: this.staged.guidance ?? accepted.guidance,
      promptAssignments: { ...accepted.promptAssignments, ...this.staged.promptAssignments },
      toolAssignments: { ...accepted.toolAssignments, ...this.staged.toolAssignments },
    }
  }

  private project(): WarmMinimalCardView {
    const snapshot = this.scope.getSnapshot()
    const draft = this.effective()
    const inventory = this.inventory ?? []
    const status = snapshot.status === 'unavailable'
      ? 'unavailable'
      : snapshot.status !== 'ready' || this.inventoryLoading
        ? 'loading'
        : this.inventory === undefined && this.failure !== undefined ? 'error' : 'ready'
    return {
      status,
      revision: snapshot.revision,
      writable: snapshot.writable,
      draft,
      promptSources: draft === undefined ? [] : projectSources(inventory, 'prompt', draft.promptAssignments),
      toolSources: draft === undefined ? [] : projectSources(inventory, 'tool', draft.toolAssignments),
      dirty: Object.keys(this.staged).length > 0,
      saving: this.saving,
      failure: this.failure,
    }
  }

  private publish(): void {
    if (this.disposed) return
    this.view = this.project()
    for (const listener of [...this.listeners]) listener()
  }
}

/** Project dynamic inventory separately from the settings write model. */
function projectSources(
  inventory: readonly InventorySource[],
  kind: 'prompt' | 'tool',
  assignments: Readonly<Record<string, SourceAssignment>>,
): AssignedSource[] {
  return inventory.flatMap((entry) => {
    const names = kind === 'prompt' ? unique([...entry.sections, ...entry.contexts]) : unique(entry.tools)
    if (names.length === 0) return []
    return [{
      source: entry.source,
      shortSource: shortSource(entry.source),
      names,
      assignment: assignments[entry.source] ?? 'child-only',
    }]
  }).sort((left, right) => left.source.localeCompare(right.source))
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function shortSource(source: string): string {
  return source.length <= 52 ? source : `${source.slice(0, 27)}…${source.slice(-20)}`
}

function cloneInventorySource(source: InventorySource): InventorySource {
  return { source: source.source, sections: [...source.sections], contexts: [...source.contexts], tools: [...source.tools] }
}

function cloneField<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value
  return { ...value } as T
}

function sameField(left: unknown, right: unknown): boolean {
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return left === right
  const leftEntries = Object.entries(left)
  const rightEntries = Object.entries(right)
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([key, value]) => (right as Record<string, unknown>)[key] === value)
}

export { projectSources, shortSource }
