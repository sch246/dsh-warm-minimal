# DSH warm-minimal

Status: draft configurable coordinator/worker intent. No accepted realization lock is selected.

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

## Installation and maintenance map

`STATE.json` selects Protocol 0.2; no current realization lock is selected. Root `.intent/`, `AGENTS.md`, documentation, `patches/`, `scripts/`, tests and investigation tools belong to this private workspace. The installable package is [packages/dsh-warm-minimal](../../packages/dsh-warm-minimal). Root runtime files, `src/`, `lib/`, `presets/`, Bundle YAML and compiler/bundler configuration map to that directory; the root manifest has no runtime exports or forwarding implementation. Package name/version `dsh-warm-minimal@0.2.0`, settings namespace `warm-minimal`, bootstrap IDs, Remote namespace, preset marker and Loader row IDs retain their identities.

### Current sources and ownership

| Concern | Owner |
| --- | --- |
| Host registration, settings and bootstrap | Package `index.mjs`, `host.mjs`, `runtime.mjs`, `config.mjs` |
| Capability roster and source defaults | Package `presets/warm-minimal`, `projection-host.mjs`, `projection.mjs` |
| Read-only inventory and Plugins editor | Package `src/remote.ts`, `src/client` |
| Profile Bundle and browser contribution | Package `package.json`, `cordis.patch.yml`, generated `lib/` |
| Host patch and preset lifecycle | Root `patches/deepseek-harness.patch`, `scripts/setup.sh`, `scripts/uninstall.sh` |
| Maintenance commands | Root `scripts/workspace.mjs`; PowerShell wrappers invoke the same entry |

Installation and removal require Harness HEAD exactly `0a53fb55bea101816fa226bb964ae2bed71c343b` (`dsh-v0.1.2-alpha.2`). Current Harness HEAD installation is unsupported. The patch owns prompt/tool provenance and admission plus associated declarations, catalogs, lockfile and documentation. Review the full patch before applying or reversing it. Nearby `@meta-intent` comments identify maintained code; there is no separate installation receipt. Both lifecycle commands require the complete patch to match either its absent or exact applied state, and refuse drift.

The installed preset is `$DSH_HOME/.agent-presets/warm-minimal`, copied from the actual package with marker `dsh-warm-minimal@0.2.0`. Setup automatically upgrades only the exact owned 0.1 preset bytes. `DSH_WARM_ADOPT_PRESET=1` and `DSH_WARM_REPLACE_DRIFTED_PRESET=1` permit reviewed ownership/content replacement; unknown owners still fail. Removal requires an exact current owned preset. Settings, sessions and unrelated presets remain outside removal ownership.

### Build and operate

The root pins pnpm 10.17.1, TypeScript 5.9.3 and tsdown 0.22.14. Existing tests use Node's test runner. Prepare root dependencies explicitly; scripts never install build tools or dependencies automatically. Local `node_modules` directories may contain individual links to existing dependency packages, but may not be shared writable directory links. Builds validate the pinned tools and invoke their Node entry files directly. The selected Harness must already provide peer artifacts and its built Typert generator. Package Host compilation/generation precedes Client compilation; the existing UI-primitives fixture supplies the isolated component-test runtime. Build compatibility does not establish installation compatibility.

```bash
export DSH_CHECKOUT=/absolute/path/to/deepseek-harness
export DSH_HOME=/absolute/path/to/private-dsh-home
export DSH_PROFILE=web
cd /absolute/path/to/dsh-warm-minimal
node scripts/workspace.mjs build
node scripts/workspace.mjs typecheck
node --test tests/*.test.mjs packages/dsh-warm-minimal/tests/*.test.mjs packages/dsh-warm-minimal/tests/client/*.test.mjs
node scripts/workspace.mjs inspect
node scripts/workspace.mjs setup          # inspection only
node scripts/workspace.mjs setup --install
node scripts/workspace.mjs remove         # inspection only
node scripts/workspace.mjs remove --remove
```

Root package scripts expose `build`, `typecheck`, `test`, `setup`, `inspect` and `remove`. Build/typecheck require explicit `DSH_CHECKOUT`; profile operations additionally require explicit `DSH_HOME` and `DSH_PROFILE`. No profile/Home defaults are inferred. Inspection reports the selected revision, patch state, package and preset paths, then invokes the selected checkout's built `apps/cli/lib/bin.js plugin … why`. It does not apply patches, copy presets or change profile membership. Installation/removal flags are mandatory for mutations. Bash `setup.sh`/`uninstall.sh` default to the same inspection and accept `--install`/`--remove` respectively.

Setup validates revision, built CLI, patch and preset ownership, applies the patch, copies the preset, and invokes `node "$DSH_CHECKOUT/apps/cli/lib/bin.js" plugin --profile "$DSH_PROFILE" add <absolute-workspace>/packages/dsh-warm-minimal`. Removal validates ownership/drift, completes that CLI's profile remove transaction, then reverses the exact patch and removes the preset. Neither command uses global `dsh`, pnpm launch wrappers, automatic dependency preparation or service restarts. CLI failures produce nonzero exits. Host, preset and profile changes are not one atomic transaction: a failed installation can leave earlier patch/preset writes and must be inspected before retrying.

PowerShell entry points are `scripts/setup.ps1` and `scripts/uninstall.ps1`, with the same flags and environment. They call the shared Node entry and propagate its exit status. Build and mutation commands require Bash plus the shell utilities used by the retained patch/preset scripts on Windows; wrapper presence does not prove Windows end-to-end compatibility.

### Maintenance, validation and removal

Use an isolated candidate and a private Home with the intended deployment's package set before first installation or changed composition. Inspect the complete patch and target development/profile documentation. Prepare and regenerate the affected Harness artifacts explicitly after patch application or removal. A linked package rebuild can be observed by a running client, so build only an isolated candidate unless updating those artifacts is authorized.

After a profile transaction, inspect the profile manifest, lockfile, resolved `node_modules/dsh-warm-minimal`, Bundle membership and composed configuration using the selected checkout CLI. Require the actual package directory and exactly one Host row when installed, and their absence when removed. Compare copied preset contents. Preserve unrelated overrides, settings and sessions. Activation requires its own authorization; cold-load the Plugins editor after activation and require one client boot entry. Startup and build evidence do not establish WARM-001–014 acceptance: validate actual bootstrap/parent/child request headers, bootstrap-off and failure restoration, per-schema assignments, saved settings, persistence/resume and actual delegation.

For a newer Harness, compare native source identity/admission, per-schema projection, settings/Remote APIs, roster composition and agent lifecycle with acceptance. Retire patch hunks when upstream owns their effects; retain attributable ownership for required Host changes. Update the supported revision, patch and lifecycle verification together. Do not bypass the revision guard or reverse historical hunks against drifted upstream code. Review copied Standard capabilities explicitly without introducing preset inheritance. A partial removal requires ownership investigation and profile reconciliation before activation.

## Constraints and permissions

- The session workspace may appear in the local transcript because workspace confirmation is part of the default bootstrap. Do not transmit or publish session logs merely to install, validate, or maintain this package.
- Preserve truthful provenance: generated bootstrap input is user-role input attributed by its namespaced ID, while assistant and tool events come from the selected model and real tools.
- Model visibility is not execution authority. The package may project different schemas to main and child agents but must leave ordinary sandbox, permission, approval, validation, and tool execution ownership intact.
- Unknown sources default to child-only. Missing source identity, ambiguous ownership, or conflicting saved assignments fail closed for main-agent visibility rather than using filesystem, registration, or discovery order.
- Tool settings use stable per-schema contribution identities. A new tool under a known provider receives no provider-wide privilege; malformed or legacy provider-scoped tool assignment keys fail loud rather than being guessed or expanded against the current inventory.
- Harness source changes are permitted when needed to realize stable source identity, role-aware assembly, official settings UI, or lifecycle support. Shared-source regions require nearby meta-intent markers and attributable ownership evidence; generated outputs are traced to their maintained sources. A retained realization lock may preserve that evidence but is not required to discover or reconstruct the desired behavior.
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

## Adaptation requirements

- Preserve the selected exact initial prompt and two-tool face. Verify actual delegation and response quality through provider requests and behavior; hiding broad tool schemas alone does not force delegation while the shared shell remains available.
- Expose AGENTS role assignments only when the target enforces them through durable model-input admission. Preserve the complete source-family coverage required by WARM-006/009.
- Classify Host-global DSH inputs as well as package-owned preset entries. A DSH-owned source is not unknown merely because it comes from outside the warm preset.
- Preserve the child’s broader model interface across the target’s inheritance model. Parent-scoped complete prompts or restrictions inherited by children cannot be widened within the child scope.
- Include LSP in the worker-safe roster only when a suitable restricted provider enforces sandbox confinement.

Default inspection compares the selected profile dependency with its exact root lock importer, checks the installed package realpath and identity and the Bundle count, and reports any patch receipt summary. Installation consistency and matching this candidate package path are separate observations. Missing target variables report not-inspected; the lock reader uses the selected checkout CLI's installed js-yaml dependency.
