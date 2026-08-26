# DSH warm-minimal

Status: draft reconstruction from the existing implementation plus the user's workspace, Chat-visibility, debug-order, host-realization ownership, Trajectory turn-order, runtime preset-scope, and minimal donor-template corrections. Those corrections are explicit; other product semantics below are the best fact-aligned projection of the implementation and documentation and remain draft until accepted by the user. The acceptance criteria are target-specific behavior for DeepSeek Harness, not additions to the intent-package protocol.

## Intent

Provide an optional DeepSeek Harness agent preset that preserves the official empty new-session screen, behaves like the official minimal preset, and gives the model one fixed, clearly attributable donor-template round immediately before it handles the first real user request. The template orients the session to its actual workspace without pretending that the plugin host's launch directory is the session workspace.

Except for that seeded history, the model-facing composition is minimal: one complete system sentence, no additional prompt/context sections, and exactly the official minimal preset's platform shell plus `str_replace_editor`.

## Acceptance criteria

- `WARM-001`: Creating or opening a blank session with the preset produces no durable warm-up events and leaves the official empty-session interface unchanged.
- `WARM-002`: The first inbox message whose source is a real user synchronously adds exactly one warm-up round before the agent loop handles that message; the real message is consequently handled as round two. This applies only when the effective preset at insertion time is exactly `warm-minimal`: the most recent successful runtime preset selection overrides the session's creation header. Plugin-originated input, other effective presets, and later user messages do not add another warm-up round.
- `WARM-003`: The warm-up is structurally attributable to `dsh-warm-minimal`, not impersonated as a real user request or a newly executed shell command. On the Linux Web realization its model-visible template is the donor session's fixed user message `检查当前工作目录，确认后仅回复 Ready.`, fixed assistant reasoning, fixed `bash` call arguments `{"command": "pwd && ls -la"}`, workspace-valued tool result, and fixed final response `Ready.`. Ordinary Chat omits the whole synthetic turn while the existing Trajectory/debug interface retains its complete inspectable record without a package-specific debug mode.
- `WARM-003A`: In Trajectory/debug, the synthetic warm-up remains grouped in its own turn and durable turns retain their recorded order. The initial system prompt belongs to the first real provider request's turn and appears first only inside that owning turn: it is not moved into the preceding synthetic turn and cannot move the whole real-request turn ahead of an earlier durable turn. Recorded user/context event locations take precedence over adjacency-based turn inference.
- `WARM-004`: The workspace value in the synthetic tool result equals the workspace recorded in the current session metadata and is the only semantically variable template value. It never falls back to the DSH process directory or plugin checkout. If the session has no workspace metadata, the plugin adds no fabricated round and reports the failure without blocking the real request. Generated event IDs and truthful provenance are metadata, not model-visible template variation.
- `WARM-005`: The seeded model-visible message content remains byte-for-byte equal to the selected donor fields except for the workspace substitution in `WARM-004` and the platform shell binding required by a non-Linux realization. The raw donor session and its unrelated real directory listing are not distributed as package artifacts.
- `WARM-006`: On every real provider request, the complete system prompt is exactly `You are a helpful software engineer assistant.` and the model-visible tool catalog contains exactly the official minimal preset's two tools (`bash` and `str_replace_editor` on the selected Linux target). Repository instructions, runtime-context snapshots, skill catalogs, compaction context, and other standard-mode prompt or tool contributions are absent.
- `WARM-007`: Installation adds only the package-owned `warm-minimal` preset, bundle registration, and any lock-declared host compatibility patch required by the selected realization. Reinstallation does not create duplicate effective behavior. Uninstall removes or reverses only effects proven to be package-owned and stops on drift rather than overwriting later edits; unrelated presets, profile configuration, sessions, source edits, and repository history remain unchanged.

## Resources

- The target runtime is DeepSeek Harness. Revision `b642a10626a950cc95c2d6f839810cb01fe599fe` supplied the observed session metadata and system-prompt variable behavior during reconstruction; it is evidence, not a permanent compatibility ceiling.
- The existing public `dsh-warm-minimal` implementation at revision `06fa6d385545215f543479aee9e4013a428965fc` is the reverse-engineering baseline, not semantic authority or an accepted realization.
- The user-generated local session `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4` is evidence for the selected fixed template. Its raw tool output contains unrelated machine details and must remain local rather than becoming a package artifact.
- DSH owns session persistence and transcript lifecycle. The package contributes events to that existing lifecycle and must not create a separate hidden session store.

## Constraints and permissions

- The session workspace may appear in the local DSH transcript because workspace confirmation is part of the warm-up. Do not transmit or publish session logs merely to install, validate, or maintain this package.
- Treat DSH session metadata as the authority for the current session workspace. A host process working directory, plugin checkout path, static machine path, or guessed fallback is not an acceptable substitute.
- Preserve truthful provenance for synthetic events: plugin, model-shaped seed, and tool-result sources remain distinguishable. The warm-up must not be represented as an actually executed user command or a real user-authored message.
- Preserve unrelated profile entries and presets. Replacement of the package-owned `warm-minimal` preset directory is allowed during an authorized upgrade only when that directory is wholly package-owned.
- Host source changes are permitted only when public plugin and preset seams cannot realize an acceptance criterion. Every such change must be a lock-owned, baseline-bound patch with explicit paths, install ownership evidence, drift checks, and a reversible uninstall procedure; ad-hoc Harness commits or untracked manual edits are not a supported realization.
- Installing into or restarting a live DSH profile, publishing, pushing, changing remotes, or changing external services requires authority for that operation.
- Supported realizations must honor the runtime requirements they declare; the reconstruction baseline declares Node.js `^22.19.0 || >=24.0.0`.

## Non-goals

- Replacing the official DSH empty-session experience or expanding the official minimal capability set.
- Generating a new warm-up response at runtime; the seeded donor content is fixed package data.
- Creating a general prompt framework, session recorder, workspace manager, or alternative agent loop.
- Hard-coding one repository, machine, user name, or DSH checkout as the workspace.
- Shipping task-specific build, fix, or weak-request warm-up templates in this revision.
- Adding repository instructions, runtime-context snapshots, skills, compaction, background-job, goal, plan, delegation, or other standard-mode components to this minimal composition.
- Maintaining a fork or feature branch of DeepSeek Harness for package-owned compatibility changes.
- Reproducing the current implementation byte-for-byte when a future realization can satisfy the same acceptance criteria more safely.

## Implementation hints

- The reconstruction baseline mounts a host-plane bundle listener before user input and listens synchronously to `agent/inbox/inserted`.
- DSH revision `b642a10626a950cc95c2d6f839810cb01fe599fe` stores the workspace at `session.header.cwd`; this is a target binding, not a universal protocol concept.
- Stable event IDs, a `turn/start` guard, and source tags are useful mechanisms for idempotence and attribution.
- Keeping host lifecycle behavior separate from the preset's model-facing composition avoids duplicating process-global services.

## Known tensions and decisions

- The user explicitly requires the injected workspace to be the current session's workspace. The baseline implementation read `session.cwd` and fell back to `process.cwd()`; this is classified as an implementation mismatch, not a request to change intent.
- The user explicitly chose to hide the synthetic warm-up from ordinary Chat while retaining it in the existing debug interface. This does not authorize a new display mode or a plugin-name-specific UI filter; it requires a semantic warm-up marker and correct request ownership in the existing projections.
- The user corrected the realization boundary: the required Harness projection changes belong to this package's state and realization lock, not to a Harness fork or standalone Harness commit. Installation and uninstall must therefore own the exact host patch and fail safely on drift.
- Live evidence invalidated candidate `0.1.0-candidate.1`: assigning the prompt to `request.turn` was necessary but insufficient because a global-first prompt index still reordered whole turn sections. The replacement must test the complete two-turn display order, not isolated cell ownership.
- Live evidence also invalidated candidate `0.1.0-candidate.2`: it scoped injection using the immutable creation header even though DSH records later successful mode selection in the session event log. Runtime selection is authoritative for whether this optional mode may inject; Trajectory must not hide already-persisted scope violations.
- The user then invalidated candidate `0.1.0-candidate.3` semantically: its standard-derived composition exposed extra prompt contexts, instructions, skills, and tools. The replacement is anchored to the official minimal composition and the explicit donor session, with only the current workspace varying at runtime.
- The selected Linux donor uses `bash`; a future non-Linux realization must preserve minimal-preset equivalence while binding the platform shell and must record that realization-specific template difference instead of silently labeling PowerShell as Bash.
- The setup scripts now mark the package-owned preset and refuse unowned replacement, but clean uninstall has not yet been exercised end to end against the live profile. `WARM-007` therefore remains incomplete.
- No accepted realization lock is selected. Candidates `0.1.0-candidate.1`, `0.1.0-candidate.2`, and `0.1.0-candidate.3` failed live or semantic acceptance and are retained only as historical evidence; candidate.4 is the current replacement candidate.
- The selected Protocol 0.2 lock is owned by the external `meta-intent` package identified in `STATE.json`; the local `locks/` area contains only realizations of `dsh-warm-minimal` itself.
