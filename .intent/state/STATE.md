# DSH warm-minimal

Status: draft configurable coordinator/worker intent. Earlier records report an installed alpha.2 candidate; they do not establish the current deployment or complete acceptance. Durable AGENTS role separation remains unrealized in the recorded implementation, LSP remains outside its worker-safe roster, and no accepted realization lock is selected.

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

Read this STATE for the required effects and acceptance. `STATE.json` selects Protocol 0.2 and records historical resource identities; selected LOGs explain the relevant user decisions and failed approaches. No current realization lock is selected. Old bundles in `.intent/locks/` are optional recovery evidence and must not restore the superseded fixed second-turn roster or no-Host-change rule.

### Current sources and ownership

| Concern | Current owner and entry |
| --- | --- |
| Host registration, settings, bootstrap and phase projection | [index.mjs](../../index.mjs), [host.mjs](../../host.mjs), [runtime.mjs](../../runtime.mjs), [config.mjs](../../config.mjs) |
| Self-contained capability roster and source defaults | [presets/warm-minimal](../../presets/warm-minimal), [projection-host.mjs](../../projection-host.mjs), [projection.mjs](../../projection.mjs) |
| Read-only inventory and Plugins editor | [src/remote.ts](../../src/remote.ts), [src/client](../../src/client), Host settings namespace `warm-minimal` |
| Profile membership and browser entry | [package.json](../../package.json), [cordis.patch.yml](../../cordis.patch.yml); Host row `native-bootstrap-host`, package `dsh-warm-minimal` |
| Host changes and exact application/removal | [patches/deepseek-harness.patch](../../patches/deepseek-harness.patch), [scripts/setup.sh](../../scripts/setup.sh), [scripts/uninstall.sh](../../scripts/uninstall.sh), corresponding `.ps1` scripts |
| Generated package outputs | `lib/remote.js`, `lib/typert.*`, declarations and `lib/client.js`, produced by [build-host.sh](../../scripts/build-host.sh) then [build-client.sh](../../scripts/build-client.sh) |

The checked installer and uninstaller require Harness HEAD exactly `0a53fb55bea101816fa226bb964ae2bed71c343b` (`dsh-v0.1.2-alpha.2`). This is a limit of these scripts, not a requirement that the product stay on alpha.2. The patch changes system-prompt/tool provenance and admission, their package/compiler declarations, Cordis catalog sources/output, dependency lockfile and associated documentation. Inspect its complete file list and hunks before applying or removing it; nearby `@meta-intent` comments identify managed code. There is no separate installation receipt in the current scripts. A marker alone does not prove that later upstream or third-party code belongs to this package.

The installed preset is `$DSH_HOME/.agent-presets/warm-minimal`, copied from the package with `.dsh-warm-minimal-owned`. The current marker is `dsh-warm-minimal@0.2.0`. Setup recognizes the exact 0.1 preset bytes for automatic upgrade; modified or unowned presets require a reviewed ownership/content decision. `DSH_WARM_ADOPT_PRESET` and `DSH_WARM_REPLACE_DRIFTED_PRESET` are explicit override switches, not normal update flags. Preserve Host settings, sessions and raw local evidence; none are plugin build output or material to publish.

### Prepare, install and activate

Use an isolated candidate checkout and private `DSH_HOME` with the intended deployment’s package set for first install or changed composition. The runtime must meet [package.json](../../package.json) engines and the target Harness requirements. Set absolute paths explicitly; `DSH_PROFILE` defaults to `web` and `DSH_HOME` to the OS home’s `.dsh` in the scripts.

```bash
export DSH_CHECKOUT=/absolute/path/to/deepseek-harness
export DSH_HOME=/absolute/path/to/dsh-home
export DSH_PROFILE=web
PLUGIN=/absolute/path/to/dsh-warm-minimal
cd "$PLUGIN"
bash scripts/setup.sh
# After patch application, prepare the selected Harness dependencies/artifacts:
cd "$DSH_CHECKOUT"
pnpm install
pnpm run build
cd "$PLUGIN"
bash scripts/build-host.sh
bash scripts/build-client.sh
# Explicit registration also completes setup when no global dsh was available:
cd "$DSH_CHECKOUT"
pnpm dsh plugin --profile "$DSH_PROFILE" add "$PLUGIN"
pnpm dsh plugin --profile "$DSH_PROFILE" why dsh-warm-minimal
pnpm dsh --profile "$DSH_PROFILE" --dump-config
```

Read the target checkout’s `docs/development.md` and `apps/cli/reference/README.md` before running its build/profile commands. Host build must provide the Typert generator and peer artifacts before the package Host build; package Host generation precedes Client compilation. The build scripts link into the selected Harness and generate local outputs, so rebuilding a live linked checkout may be observed by its running client. These are realization commands, not checks run for this documentation change.

Setup applies the exact patch, copies the preset, then calls a global `dsh plugin … add .` if `dsh` is available on PATH. Verify that executable belongs to the intended Harness before relying on it. Without it, setup can finish after patch/preset writes while only printing a manual registration instruction. A later failure can also leave earlier writes in place; setup is not an atomic transaction across Host, preset and profile. Its final message is not proof of a complete installation. The source launcher above completes the profile transaction on the selected checkout; do not hand-edit Bundle membership.

After registration, inspect `$DSH_HOME/profiles/$DSH_PROFILE/package.json`, `pnpm-lock.yaml`, resolved `node_modules/dsh-warm-minimal`, and `dsh.profile.bundles`, plus the composed config. Require the intended package path and exactly one Host row. Compare the installed preset with the source; a fresh browser bundle cannot repair a stale copied preset. Later profile/home patches replace complete config values, so retain unrelated overrides. Neither setup nor builds restart a service. Activate only under the operation’s existing authorization, then select `温暖极简模式` and cold-load the Plugins editor; one client boot entry and a loaded script are startup evidence only.

Windows uses `powershell -ExecutionPolicy Bypass -File scripts\setup.ps1` and the corresponding `uninstall.ps1`, with the same environment variables and pinned target. Package build entry points remain Bash scripts. The PowerShell setup does not explicitly reject a nonzero native `dsh` registration exit, making the profile checks necessary even when it prints completion. Do not infer Windows end-to-end compatibility from the presence of those wrappers.

### Adapt after a Harness change

Compare the new target’s stable source identity, prompt/context admission, per-tool schema projection, settings/Remote APIs, preset composition and agent/inbox lifecycle with WARM acceptance. When upstream already provides an effect, adapt the plugin to that API and retire the corresponding patch hunk and generated derivative; do not claim upstream source as package-owned because an old patch or comment names it. When a required effect has no native extension, a package-owned Host change remains permitted: identify the missing effect, mark maintained source regions, retain attributable revision/path evidence, update forward/removal scripts and regenerate affected artifacts. A successful `git apply --check` alone does not establish continued behavior or ownership.

The current installer refuses a different HEAD even if the patch would apply. Update the supported target, patch and lifecycle verification together after investigation; bypassing that guard or blindly reversing the historical patch is not an adaptation. Review new Standard roster entries deliberately, copying only desired worker-safe capabilities into the package rather than adding a runtime inheritance dependency. Preserve saved per-schema assignments and the user’s prompt values through any identity/API transition.

### Verification and removal

After building the relevant package faces, run the focused checks from this repository:

```bash
node --test tests/index.test.mjs tests/roster.test.mjs tests/remote.test.mjs tests/client/controller.test.mjs tests/client/component.test.mjs tests/lifecycle.test.mjs
```

Use WARM-001–014 for runtime acceptance: inspect actual bootstrap, normal-parent and child request headers; test bootstrap off, mode changes, multiple held inputs and failure restoration; test two tools from one provider with different assignments, unknown inputs and an explicitly formed hidden-tool call. Cold-load the real Plugins editor, save/reload settings, and check persistence/resume and actual delegation. Run focused Harness tests for any changed source/lifecycle API. Build, structural validation, schema counts and historical reasoning-style observations do not establish this acceptance.

Before removal, leave active sessions/settings intact and inspect patch/preset ownership and drift. With the matching global `dsh` on PATH and the same environment variables:

```bash
cd "$PLUGIN"
bash scripts/uninstall.sh
```

Uninstall requires the pinned Harness HEAD, an exactly owned current preset and an exactly removable or absent patch. It checks these before calling `dsh plugin --profile "$DSH_PROFILE" remove dsh-warm-minimal`, then reverses the patch if present and removes the preset. It refuses missing `dsh`; direct Bundle removal alone does not remove Host changes or the preset. Drift or a partially removed deployment needs ownership investigation, preserving unrelated edits and reconciling remaining owned effects. Rebuild the affected Harness artifacts after source removal and verify profile resolution/Bundle absence, preset removal and absence of the browser contribution after authorized activation. Ordinary modes, unrelated plugins, settings and sessions must remain usable.

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

## Known limits and decisions

- The exact initial prompt and two-tool face remain user-selected even though earlier donor evidence also implicated reasoning effort. Actual delegation and response quality need provider-request and behavioral evidence; hiding broad tool schemas alone does not force delegation while the shared shell remains powerful.
- The recorded implementation admits system-prompt/context and tool schemas but does not role-filter durable AGENTS user messages. It must not present AGENTS as independently assignable until the target’s durable model-input admission enforces it. This remains a missing part of WARM-006/009, not a reason to narrow their source-family coverage.
- Known defaults cover package-owned preset entries; Host-global DSH inputs still need classification. A DSH-owned source is not semantically unknown merely because it comes from outside the warm preset.
- Parent-scoped complete prompts/restrictions inherited by children cannot be widened there. Any new realization must preserve the child’s broader face across the target’s actual inheritance model.
- The recorded stdio LSP provider has no sandbox confinement and remains excluded from the worker-safe default roster. Include language tooling only when a suitable restricted provider exists; do not claim the requested execution roster complete while this gap remains.
- Earlier local Web observations and stale locks prove only their recorded targets. Alpha.2 loading and a subsequent persona-placement API repair are recorded; full cold-browser, three-phase request, actual delegation, persistence/resume and uninstall acceptance remain pending. No live target was checked in this document update.
