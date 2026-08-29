# DSH warm-minimal

Status: draft configurable coordinator/worker realization. The v4-pro initial face, native bootstrap, role-aware system-prompt/tool projection, readable Plugins manager, and managed Host patch have implementation evidence. Durable AGENTS input, one compact delegate interface, complete known-DSH defaults, and the full worker-safe execution roster remain unrealized. The realization has not been installed or accepted, and no accepted realization lock is selected.

## Intent

Provide an optional DeepSeek Harness agent mode that uses the official minimal preset's initial model face to activate deepseek-v4-pro's trained collaborative behavior while retaining broader product capability through delegated agents. The default bootstrap request has the complete system prompt `You are a helpful software engineer assistant.` and exactly the platform shell plus `str_replace_editor`. The fixed interface, rather than injected style prose, is the initial guidance.

After the optional bootstrap, the main agent acts as coordinator: it performs local inspection, integrates results, manages delegation, and owns user interaction. Delegated child agents receive the broader discovery and execution interface. Model-visible prompt/context contributions and tool schemas are distributed independently; the executable registry remains available, so hiding a tool schema from the main agent does not by itself reject an explicit tool call.

The mode has one authoritative configuration with these user-controlled values:

- whether the bootstrap round runs;
- the bootstrap user-role message, defaulting to `检查当前工作目录，确认后仅回复 Ready.`;
- the short post-bootstrap main-agent guidance, defaulting to a statement that delegated agents have broader tools and the main agent owns local inspection, integration, coordination, and user interaction;
- one prompt/context-source assignment list and one individual tool-schema assignment list, where every configurable item is `parent-only`, `child-only`, or `shared` after bootstrap.

The default phase model is:

- bootstrap main agent: the exact one-sentence minimal prompt and exactly the platform shell plus editor;
- normal main agent: very short coordinator guidance, limited AGENTS input, shell/editor, narrow skill access, one compact delegate interface, and the user-interaction, approval-facing, and coordination capability that must remain with the user-facing agent;
- delegated execution child: a package-owned copy of the Standard coding prompt, complete relevant AGENTS and skill input, and the complete worker-safe Standard execution roster, without user inquiry, approval-facing interaction, or coordination capability.

Prompt/context sources cover every relevant model-input path, not only system-prompt assembly. They include system-prompt sections, runtime contexts, durable AGENTS input, and model-visible skill guidance or catalog descriptors where DSH contributes them. A realization that cannot identify or admit one of these families remains incomplete rather than omitting it from configuration. Tool assignment is per model-visible schema. Provider source remains provenance, not the assignment unit; two tools from one provider may have different assignments.

Known DSH contributions have package defaults based on responsibility. User inquiry, approval-facing interaction, delegation, and coordination are main-agent capabilities. Broad search, filesystem discovery, terminal/job execution, Web access, language tooling, and workflow execution are child capabilities. The minimal shell/editor and narrowly useful skill access may be shared. A contribution without an explicit or known default is `child-only`; discovery order never grants it to the main agent. The warm mode owns this roster and does not inherit or compose the Standard preset. A realization may copy selected DSH configuration into the package, where later changes require an explicit warm-package update.

The official Plugins settings page is the preferred configuration surface. A package-owned settings page or a link from the Plugins page is a fallback only when the target cannot host the required controls. The empty new-session screen remains native. When bootstrap is enabled, Chat and Trajectory display it as an ordinary truthful turn; folding remains an independent concern.

## Acceptance criteria

- `WARM-001`: Creating or opening a blank session produces no durable warm-up event before a real user input and leaves the native empty-session interface unchanged.
- `WARM-002`: With bootstrap enabled, the first real user input for the effective warm-minimal mode is synchronously held, exactly one configured bootstrap user message runs through the normal agent loop, and held inputs are restored in arrival order. With bootstrap disabled, the first real input enters without an inserted turn. Plugin-originated input, other effective modes, and started sessions do not trigger bootstrap.
- `WARM-003`: A bootstrap is a normal user-role turn. The selected model produces assistant content and tool calls, real configured tools execute, and the package fabricates no assistant message, tool call, tool result, or ready response. Failure does not discard held input.
- `WARM-004`: The default workspace-confirmation bootstrap uses the actual session shell workspace. The package does not substitute a Host process directory, plugin checkout, static path, or synthetic result.
- `WARM-005`: With default bootstrap settings, the first provider request has the complete system prompt `You are a helpful software engineer assistant.` and exactly the platform shell plus `str_replace_editor`. Other prompt/context and tool contributions are absent from that request. A realization fails loud rather than exposing an unfiltered first request when either required minimal tool is unavailable.
- `WARM-006`: After bootstrap, or from the first request when bootstrap is disabled, every configurable model-input family in the main agent's provider request equals the configured `parent-only` plus `shared` assignments and includes the configured short guidance. The child request equals `child-only` plus `shared` assignments. Prompt/context items use source assignment; each tool schema uses its own assignment. An item assigned to one role does not enter the other role's request.
- `WARM-007`: The package does not add an execution rejection based only on post-bootstrap model visibility. An explicitly formed call to a registered tool hidden from the main agent proceeds through the ordinary tool pipeline and its existing permission, approval, and validation policies.
- `WARM-008`: Every known DSH prompt/context source and individual tool schema appears with a readable name, tool description where applicable, provenance, and an explicit package default based on responsibility. Genuinely unknown items also appear and default to `child-only`. Stable identity binds a tool name to its contribution source, so discovery order, provider-wide inheritance, or an unrelated same-name tool cannot acquire its saved assignment.
- `WARM-009`: The default main-agent interface contains limited AGENTS input, shell/editor, narrow skill access, one compact delegate interface, and necessary user inquiry, approval-facing interaction, and coordination. The default child interface contains the copied Standard coding prompt, complete relevant AGENTS/skills, and the complete worker-safe execution roster. Delegated children do not receive user-interaction, approval-facing, or coordination capability and are not expected to perform operations rejected by the Host's fixed delegated approval policy.
- `WARM-010`: The official Plugins settings page exposes a compact summary and opens the complete editor in a wide package-owned modal. Prompt/context and tool lists collapse independently. Each prompt/context source and each individual tool schema uses a three-slot single-choice control for main only, child only, or shared visibility. Tool rows show one tool name and description preview; provider provenance remains secondary detail. Saves are validated and persist through the Host settings provider without overwriting concurrent edits.
- `WARM-011`: Configuration changes have one authority and one projection path. Runtime assembly and the settings UI read the same resolved assignment model; generated inventories and browser drafts do not become competing configuration authorities.
- `WARM-012`: The bootstrap message retains a namespaced provider-hidden durable ID. Chat, Trajectory, persistence, resume, and model request headers preserve native causal order and reconstruct the configured phase without a package-owned transcript store.
- `WARM-013`: Installation, maintenance, and uninstall preserve unrelated profile, preset, session, source, and generated changes. A realization that modifies shared Harness source marks every managed region with nearby `@meta-intent` ownership comments, records exact target identity and paths, regenerates affected artifacts, stops on owned-region drift, and removes only effects still proven package-owned.
- `WARM-014`: The warm mode's known roster is package-owned and self-contained. It has no preset inheritance, runtime composition, or implicit update dependency on Standard. Copied DSH rows and source defaults change only through an explicit package revision whose target compatibility is revalidated.

## Resources

- The target runtime is DeepSeek Harness. Baseline revision `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` supplied the inspected settings, Plugins-page slot, prompt assembly, tool registry, agent ownership, and subagent composition behavior. Local target revision `1f8dd5ef4b` contains the managed provenance and admission realization; neither revision is a compatibility ceiling.
- The public `dsh-warm-minimal` implementation at revision `9961118802c5dd8627aeb794c812b1f42ea6fbf3` is the stale 0.1 realization baseline. Its native bootstrap and two-tool first-face evidence remain useful, but its fixed post-bootstrap behavior is not current authority.
- Plugin revision `fecda5c81e48d6a1d53e7cd539b050c086106b83` is the current implementation evidence for the self-contained roster, per-tool configurable role projection, readable atomic inventory Remote, Plugins manager, and exact package-owned preset upgrade lifecycle. Documentation and intent records may follow it without changing runtime semantics.
- The user-generated local sessions cited by selected LOGs remain local behavioral evidence. Their raw tool output may contain unrelated machine details and must not become published package artifacts.
- DSH owns session persistence, agent execution, settings persistence, model request assembly, tool execution, and transcript lifecycle. The package composes those capabilities and must not create shadow authorities for them.

## Constraints and permissions

- The session workspace may appear in the local transcript because workspace confirmation is part of the default bootstrap. Do not transmit or publish session logs merely to install, validate, or maintain this package.
- Preserve truthful provenance: generated bootstrap input is user-role input attributed by its namespaced ID, while assistant and tool events come from the selected model and real tools.
- Model visibility is not execution authority. The package may project different schemas to main and child agents but must leave ordinary sandbox, permission, approval, validation, and tool execution ownership intact.
- Unknown sources default to child-only. Missing source identity, ambiguous ownership, or conflicting saved assignments fail closed for main-agent visibility rather than using filesystem, registration, or discovery order.
- Tool settings use stable per-schema contribution identities. A new tool under a known provider receives no provider-wide privilege; malformed or legacy provider-scoped tool assignment keys fail loud rather than being guessed or expanded against the current inventory.
- Harness source changes are permitted when needed to realize stable source identity, role-aware assembly, official settings UI, or lifecycle support. Shared-source regions require nearby meta-intent markers plus LOCK/receipt evidence; generated outputs are traced to their maintained sources.
- Installing into or restarting a live profile, publishing, pushing, changing remotes, adopting a realization, or changing external services requires authority for that operation. The user has not accepted a realization through this STATE revision.
- Verification defaults to focused checks that directly distinguish the requested product behavior from plausible failures. Repository-wide, coverage, documentation-site, and peripheral suites run only when a demonstrated mainline benefit or explicit user request justifies them.
- Supported realizations declare and verify their runtime requirements. Credentials and raw private session data never enter LOG, STATE, LOCK, source, tests, or browser configuration payloads.

## Non-goals

- Replaying or fabricating a donor assistant response, tool call, tool result, or reasoning style.
- Rejecting a registered tool solely because its schema is hidden from the main agent.
- Granting delegated children approval, user-interaction, or execution authority beyond the Host's ordinary delegation and permission policies.
- Treating every installed tool as child-safe merely because it is not main-facing; known interaction and coordination capabilities retain explicit defaults.
- Building a general replacement for DSH settings, plugin management, prompt assembly, the tool registry, session persistence, or the agent loop.
- Hard-coding one repository, machine, user name, checkout, or mutable discovery order as semantic identity.
- Maintaining a permanent Harness fork or making one Host patch design part of package meaning. Realizations may modify Host source while STATE remains implementation-independent.
- Depending on the Standard preset for the warm roster, defaults, source inventory, or update behavior.
- Reproducing the stale 0.1 realization byte-for-byte when another realization satisfies current acceptance more safely.

## Implementation hints

- A package-owned capability roster with role-aware provider-request projection is a closer substrate than a minimal preset that never mounted those capabilities. Keep one resolved assignment model and derive both main and child views from it.
- The `system-prompt/assemble` waterfall already permits model-visible filtering without changing executable lookup. Stable contribution identity and a configuration inventory may require Host metadata retained alongside model-facing sections, contexts, and tool schemas.
- Runtime ownership and durable lineage answer different questions. Role projection should use the live agent relation for active requests and durable, logged configuration/phase facts for resume rather than inferring ownership from one field.
- A browser client can contribute a card to the official Plugins settings page while the Host settings namespace remains the persistence authority. Dynamic inventory belongs to a Host query or descriptor, not browser local storage.
- Default guidance should remain short enough to preserve the intended minimal coordinator face. Delegation behavior and v4-pro response quality require model-visible request-header evidence rather than documentation-only acceptance.

## Known tensions and decisions

- The exact initial face remains a user-selected requirement even though prior donor evidence suggests reasoning effort can also influence `We need` versus `Let me` behavior. Evidence must keep those variables distinct.
- Hiding broad tools may not by itself cause delegation because the shared shell remains powerful. The default delegate description carries the role distinction; acceptance must measure actual delegation rather than infer it from schema counts.
- Current DSH assemblies preserve contribution names but not stable owners. The target realization must add or derive an identity that survives reload and reports unknown sources without exposing internal metadata to the model.
- Parent-scoped complete prompts and restrictions are inherited by in-process children and cannot be widened. A realization must avoid encoding the main-agent face as an irreversible ancestor restriction when child agents require a broader face.
- Candidate `0.1.0-candidate.6` is stale because it realizes draft.8's fixed second-turn catalog, permanent complete sentence, prohibition on AGENTS/skills/delegation, and zero-Host-modification rule. Its bootstrap evidence remains historical. The current local implementation realizes this STATE in source but is not an accepted candidate because live installation and observed request-header verification have not been authorized or completed.
- Host intrusion is a target realization choice, not a semantic coupling. Nearby purpose comments make ownership discoverable; the realization LOCK and current drift evidence govern maintenance and removal.
- Copying selected DSH roster rows is deliberate duplication that buys semantic independence from Standard. Maintenance must compare and choose updates explicitly rather than treating Standard drift as warm behavior.
- `agent-instructions` injects durable user-role messages outside the current system-prompt source inventory. Until Host model-input admission covers those messages, parent and child AGENTS content remains shared in effect; the settings inventory must not present a role split that runtime cannot enforce.
- The current stdio LSP provider has no sandbox confinement. LSP remains outside the worker-safe default roster until a complete restricted provider is available and explicitly selected.
- The current realization exposes multiple delegation and workflow tools to the main agent. The intended default is one compact delegate interface plus only the coordination capability necessary to manage delegated work.
- Package-preset projection gives known defaults to package-owned entries but does not classify every DSH Host-global model-input source. A DSH-owned source is not semantically unknown merely because it was registered outside the warm preset.
- The live Web profile currently links the source package but uses a stale installed warm-minimal preset without roster projection. Source tests and a current browser bundle do not prove installed preset freshness; live repair still requires authorized setup/remount and restart.
- The selected Protocol 0.2 lock is owned by the external `meta-intent` package identified in `STATE.json`; local locks are realizations of `dsh-warm-minimal` only.
