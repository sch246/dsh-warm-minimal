/** Staged Plugins-card form over one official settings namespace scope. */
const SETTINGS_FIELDS = [
    'bootstrapEnabled', 'bootstrapMessage', 'guidance', 'promptAssignments', 'toolAssignments',
];
/** One settings card controller; Remote data never enters its write plan. */
export class WarmMinimalCardController {
    scope;
    remote;
    listeners = new Set();
    staged = {};
    inventory;
    inventoryLoading = false;
    saving = false;
    failure;
    loadPromise;
    disposed = false;
    stopScope;
    view;
    /**
     * @param scope - official `warm-minimal` settings namespace scope.
     * @param remote - generated read-only inventory Remote namespace.
     */
    constructor(scope, remote) {
        this.scope = scope;
        this.remote = remote;
        this.view = this.project();
        this.stopScope = scope.subscribe(() => { this.publish(); });
    }
    /** @returns the current immutable card projection. */
    getSnapshot = () => this.view;
    /** @returns a disposer for the registered listener. */
    subscribe = (listener) => {
        if (this.disposed)
            return () => { };
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };
    /** Query the read-only Host inventory, collapsing concurrent requests. */
    loadInventory() {
        if (this.disposed)
            return Promise.resolve();
        if (this.loadPromise !== undefined)
            return this.loadPromise;
        this.inventoryLoading = true;
        this.failure = undefined;
        this.publish();
        const pending = this.readInventory();
        this.loadPromise = pending;
        return pending.finally(() => { this.loadPromise = undefined; });
    }
    /** Stage bootstrap enablement without writing. */
    setBootstrapEnabled(enabled) {
        this.stage('bootstrapEnabled', enabled);
    }
    /** Stage bootstrap user-role text without writing. */
    setBootstrapMessage(message) {
        this.stage('bootstrapMessage', message);
    }
    /** Stage post-bootstrap coordinator guidance without writing. */
    setGuidance(guidance) {
        this.stage('guidance', guidance);
    }
    /** Stage one assignment in the settings-owned source map. */
    assign(list, source, assignment) {
        const field = list === 'prompt' ? 'promptAssignments' : 'toolAssignments';
        const current = this.effective();
        if (current === undefined)
            return;
        this.stage(field, { ...current[field], [source]: assignment });
    }
    /** Drop every browser-local edit. */
    discard() {
        if (this.disposed || Object.keys(this.staged).length === 0)
            return;
        for (const field of SETTINGS_FIELDS)
            delete this.staged[field];
        this.failure = undefined;
        this.publish();
    }
    /** Write staged fields only through settingsScope, which owns CAS and serialization. */
    async save() {
        const snapshot = this.scope.getSnapshot();
        if (this.disposed || this.saving || !snapshot.writable || snapshot.value === undefined)
            return;
        const plan = SETTINGS_FIELDS.flatMap((field) => {
            if (!Object.hasOwn(this.staged, field))
                return [];
            const value = this.staged[field];
            return value === undefined ? [] : [{ field, value }];
        });
        if (plan.length === 0)
            return;
        this.saving = true;
        this.failure = undefined;
        this.publish();
        try {
            for (const { field, value } of plan)
                await this.scope.set(field, cloneField(value));
            const accepted = this.scope.getSnapshot().value;
            const landed = accepted !== undefined && plan.every(({ field, value }) => sameField(accepted[field], value));
            if (landed) {
                for (const { field } of plan)
                    delete this.staged[field];
            }
            else {
                this.failure = 'The Host did not accept all staged settings. Review the refreshed values and retry.';
            }
        }
        catch (error) {
            this.failure = error instanceof Error ? error.message : String(error);
        }
        finally {
            this.saving = false;
            this.publish();
        }
    }
    /** Release the settings subscription and silence later Remote settlements. */
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.stopScope();
        this.listeners.clear();
    }
    async readInventory() {
        try {
            const result = await this.remote.queryInventory();
            if (this.disposed)
                return;
            if (result.ok)
                this.inventory = result.value.map(cloneInventorySource);
            else
                this.failure = `Inventory query failed: ${result.error.code}: ${result.error.message}`;
        }
        catch (error) {
            if (!this.disposed)
                this.failure = error instanceof Error ? error.message : String(error);
        }
        finally {
            if (!this.disposed) {
                this.inventoryLoading = false;
                this.publish();
            }
        }
    }
    stage(field, value) {
        if (this.disposed || this.saving || !this.scope.getSnapshot().writable)
            return;
        this.staged[field] = cloneField(value);
        this.failure = undefined;
        this.publish();
    }
    effective() {
        const accepted = this.scope.getSnapshot().value;
        if (accepted === undefined)
            return undefined;
        return {
            bootstrapEnabled: this.staged.bootstrapEnabled ?? accepted.bootstrapEnabled,
            bootstrapMessage: this.staged.bootstrapMessage ?? accepted.bootstrapMessage,
            guidance: this.staged.guidance ?? accepted.guidance,
            promptAssignments: { ...accepted.promptAssignments, ...this.staged.promptAssignments },
            toolAssignments: { ...accepted.toolAssignments, ...this.staged.toolAssignments },
        };
    }
    project() {
        const snapshot = this.scope.getSnapshot();
        const draft = this.effective();
        const inventory = this.inventory ?? [];
        const status = snapshot.status === 'unavailable'
            ? 'unavailable'
            : snapshot.status !== 'ready' || this.inventoryLoading
                ? 'loading'
                : this.inventory === undefined && this.failure !== undefined ? 'error' : 'ready';
        return {
            status,
            revision: snapshot.revision,
            writable: snapshot.writable,
            draft,
            promptSources: draft === undefined ? [] : projectPromptSources(inventory, draft.promptAssignments),
            toolSources: draft === undefined ? [] : projectToolSources(inventory, draft.toolAssignments),
            dirty: Object.keys(this.staged).length > 0,
            saving: this.saving,
            failure: this.failure,
        };
    }
    publish() {
        if (this.disposed)
            return;
        this.view = this.project();
        for (const listener of [...this.listeners])
            listener();
    }
}
/** Project prompt inventory separately from the settings write model. */
function projectPromptSources(inventory, assignments) {
    return inventory.flatMap((entry) => {
        if (entry.sections.length === 0 && entry.contexts.length === 0)
            return [];
        return [{
                source: entry.source,
                sections: [...entry.sections],
                contexts: [...entry.contexts],
                assignment: assignments[entry.source] ?? entry.promptDefault,
            }];
    }).sort((left, right) => left.source.localeCompare(right.source));
}
/** Project tool inventory separately from the settings write model. */
function projectToolSources(inventory, assignments) {
    return inventory.flatMap((entry) => {
        if (entry.tools.length === 0)
            return [];
        return [{
                source: entry.source,
                tools: entry.tools.map(tool => ({ ...tool })),
                assignment: assignments[entry.source] ?? entry.toolDefault,
            }];
    }).sort((left, right) => left.source.localeCompare(right.source));
}
function cloneInventorySource(source) {
    return {
        source: source.source,
        promptDefault: source.promptDefault,
        toolDefault: source.toolDefault,
        sections: [...source.sections],
        contexts: [...source.contexts],
        tools: source.tools.map(tool => ({ ...tool })),
    };
}
function cloneField(value) {
    if (typeof value !== 'object' || value === null)
        return value;
    return { ...value };
}
function sameField(left, right) {
    if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null)
        return left === right;
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);
    return leftEntries.length === rightEntries.length
        && leftEntries.every(([key, value]) => right[key] === value);
}
export { projectPromptSources, projectToolSources };
//# sourceMappingURL=controller.js.map
