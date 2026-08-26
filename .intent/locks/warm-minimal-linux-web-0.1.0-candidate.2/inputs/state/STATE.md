# DSH warm-minimal

Status: draft reconstruction from the existing implementation plus the user's workspace, Chat-visibility, debug-order, host-realization ownership, and Trajectory turn-order corrections. Those corrections are explicit; other product semantics below are the best fact-aligned projection of the implementation and documentation and remain draft until accepted by the user. The acceptance criteria are target-specific behavior for DeepSeek Harness, not additions to the intent-package protocol.

## Intent

Provide an optional DeepSeek Harness agent preset that preserves the official empty new-session screen, then gives the model a small, clearly attributable warm-up round immediately before it handles the first real user request. The warm-up should establish a concise, collaborative reasoning style and orient the session to its actual workspace without pretending that the plugin host's launch directory is the session workspace.

The preset remains a capable software-engineering assistant. Warm-up behavior supplements the normal DSH request context, instructions, skills, and tools rather than replacing them.

## Acceptance criteria

- `WARM-001`: Creating or opening a blank session with the preset produces no durable warm-up events and leaves the official empty-session interface unchanged.
- `WARM-002`: The first inbox message whose source is a real user synchronously adds exactly one warm-up round before the agent loop handles that message; the real message is consequently handled as round two. Plugin-originated input, other presets, and later user messages do not add another warm-up round.
- `WARM-003`: The warm-up is structurally attributable to `dsh-warm-minimal`, not impersonated as a real user request. It contains a short preparation request, concise collaborative reasoning, one synthetic workspace-confirmation trace derived from session metadata, and a short ready response; the trace is not represented as an actually executed shell command. Ordinary Chat omits the whole synthetic turn while the existing Trajectory/debug interface retains its complete inspectable record without a package-specific debug mode.
- `WARM-003A`: In Trajectory/debug, the synthetic warm-up remains grouped in its own turn and durable turns retain their recorded order. The initial system prompt belongs to the first real provider request's turn and appears first only inside that owning turn: it is not moved into the preceding synthetic turn and cannot move the whole real-request turn ahead of an earlier durable turn. Recorded user/context event locations take precedence over adjacency-based turn inference.
- `WARM-004`: The workspace shown by the warm-up equals the workspace recorded in the current session metadata. It never falls back to the DSH process directory or the plugin checkout. If the session has no workspace metadata, the plugin adds no fabricated warm-up result and reports the failure without blocking the real request.
- `WARM-005`: The deterministic warm-up reasoning uses `we need` / `let's` phrasing and contains no `let me`. The continuing style guidance encourages concise, one-action-at-a-time reasoning without claiming deterministic control over model-generated hidden reasoning.
- `WARM-006`: On the real request, the selected agent still receives the normal repository instructions, runtime context, skill catalog, and software-engineering tool capabilities supplied by its compatible DSH preset composition.
- `WARM-007`: Installation adds only the package-owned `warm-minimal` preset, bundle registration, and any lock-declared host compatibility patch required by the selected realization. Reinstallation does not create duplicate effective behavior. Uninstall removes or reverses only effects proven to be package-owned and stops on drift rather than overwriting later edits; unrelated presets, profile configuration, sessions, source edits, and repository history remain unchanged.

## Resources

- The target runtime is DeepSeek Harness. Revision `b642a10626a950cc95c2d6f839810cb01fe599fe` supplied the observed session metadata and system-prompt variable behavior during reconstruction; it is evidence, not a permanent compatibility ceiling.
- The existing public `dsh-warm-minimal` implementation at revision `06fa6d385545215f543479aee9e4013a428965fc` is the reverse-engineering baseline, not semantic authority or an accepted realization.
- The reasoning-style text is derived from the MIT-licensed `scp3500/oh-we-need` project. Its attribution and license notice must remain available in distributed realizations.
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

- Replacing the official DSH empty-session experience or the standard software-engineering capability set.
- Guaranteeing exact wording in model-generated hidden reasoning or exposing hidden reasoning in final answers.
- Creating a general prompt framework, session recorder, workspace manager, or alternative agent loop.
- Hard-coding one repository, machine, user name, or DSH checkout as the workspace.
- Shipping task-specific build, fix, or weak-request warm-up templates in this revision.
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
- The current synthetic tool card names `pwsh` even on systems where the preset exposes `bash` instead. The intent requires a truthful workspace-confirmation step, not a particular shell brand; a portable representation remains an implementation decision.
- The preset copies the current standard tool composition. DSH upgrades may require compatibility maintenance so that `WARM-006` remains true without treating one copied roster as permanent intent.
- The setup scripts now mark the package-owned preset and refuse unowned replacement, but clean uninstall has not yet been exercised end to end against the live profile. `WARM-007` therefore remains incomplete.
- No accepted realization lock is selected. Candidate `0.1.0-candidate.1` failed live ordering acceptance and is retained only as historical evidence; a replacement candidate has not yet been selected.
- The selected Protocol 0.2 lock is owned by the external `meta-intent` package identified in `STATE.json`; the local `locks/` area contains only realizations of `dsh-warm-minimal` itself.
