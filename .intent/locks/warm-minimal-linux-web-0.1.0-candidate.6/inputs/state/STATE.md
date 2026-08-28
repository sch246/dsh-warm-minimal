# DSH warm-minimal

Status: draft reconstruction from the existing implementation plus the user's workspace, native-bootstrap, visible-Chat, runtime preset-scope, minimal composition, zero-host-modification, and v4-pro initial-face corrections. Those corrections are explicit; other product semantics below are the best fact-aligned projection of the implementation and documentation and remain draft until accepted by the user. The acceptance criteria are target-specific behavior for DeepSeek Harness, not additions to the intent-package protocol.

## Intent

Provide an optional DeepSeek Harness agent preset that imitates the official minimal preset's first-turn model face. The reason is model-specific: deepseek-v4-pro is, due to its training, highly sensitive to the initial prompt and initial tool face. Official minimal's fixed first-turn shape — the complete sentence `You are a helpful software engineer assistant.` and exactly the platform shell plus `str_replace_editor` — guides the model into the collective `we need` reasoning chain; an all-tools first turn produces the rejected `Let me` opening instead. The package must not inject style prose; the fixed shape itself is the guidance.

The preset preserves the official empty new-session screen and runs one real bootstrap turn through the normal agent loop immediately before the first real user request. The bootstrap asks the selected model to inspect the actual workspace and reply ready; the package does not replay or fabricate the donor session's assistant/tool transcript.

Model-facing rules by turn:

- Bootstrap turn: the complete system prompt is exactly `You are a helpful software engineer assistant.` and the model-visible tool catalog contains exactly the official minimal preset's two tools (`bash` + `str_replace_editor` on the selected Linux target). Other profile-registered tools are withheld.
- Second and later turns: the remaining naturally-assembled tools are re-exposed for the restored original request; tools cannot be absent forever and must not all appear in the first turn.
- No additional prompt/context sections, repository instructions, runtime snapshots, skills, or compaction material at any turn; the fixed system sentence remains complete.

Chat and Trajectory display the bootstrap as an ordinary native turn; folding is delegated to a future independent plugin.

## Acceptance criteria

- `WARM-001`: Creating or opening a blank session with the preset produces no durable warm-up events and leaves the official empty-session interface unchanged.
- `WARM-002`: The first inbox message whose source is a real user synchronously adds exactly one warm-up round before the agent loop handles that message; the real message is consequently handled as round two. This applies only when the effective preset at insertion time is exactly `warm-minimal`: the most recent successful runtime preset selection overrides the session's creation header. Plugin-originated input, other effective presets, and later user messages do not add another warm-up round.
- `WARM-003`: The bootstrap is a normal agent-loop turn initiated by the fixed user-role instruction `检查当前工作目录，确认后仅回复 Ready.`. The selected real model produces reasoning, tool calls, and final output; configured minimal tools execute normally. The package does not append fabricated assistant/tool events. Ordinary Chat and Trajectory both show the resulting native turn without package-owned hiding, reordering, or folding behavior.
- `WARM-003A`: Native persistence and projections retain their normal causal order: initial system prompt, bootstrap USER, model ASSISTANT, executed TOOL, final ASSISTANT, then the original real request as the next turn. The package requires no Trajectory-specific ordering realization.
- `WARM-004`: Workspace confirmation comes from the actually executed minimal shell in the current session workspace. The package neither substitutes a host process directory nor constructs a synthetic tool result. Bootstrap failure must not discard the original user message.
- `WARM-005`: The donor session is a behavioral oracle for the desired native shape, not byte-exact runtime content. Model reasoning, command choice, tool output, and final wording may vary according to the selected provider while the fixed bootstrap instruction and minimal composition remain stable.
- `WARM-006`: On every real provider request, the complete system prompt is exactly `You are a helpful software engineer assistant.`. Repository instructions, runtime-context snapshots, skill catalogs, compaction context, and other standard-mode prompt or context contributions are absent.
- `WARM-009`: The bootstrap turn's model-visible tool catalog contains exactly the official minimal preset's two tools (`bash` and `str_replace_editor` on the selected Linux target). All other profile-registered tools are withheld from that first provider request and are re-exposed no earlier than the restored original request's first provider request. Sessions without an in-flight bootstrap, other effective presets, and non-agent prompt assemblies are never filtered.
- `WARM-007`: Installation adds only the package-owned `warm-minimal` preset and bundle registration. The selected realization modifies no DeepSeek Harness source files. Reinstallation does not create duplicate effective behavior. Uninstall removes only effects proven to be package-owned and stops on drift rather than overwriting later edits; unrelated presets, profile configuration, sessions, source edits, and repository history remain unchanged.
- `WARM-008`: The bootstrap `UserMessage.id` begins with `dsh-warm-minimal:bootstrap:`. This namespaced, provider-hidden durable marker lets a future independent folding plugin identify the turn without altering message text, source projection, or Harness schemas.

## Resources

- The target runtime is DeepSeek Harness. Revision `b642a10626a950cc95c2d6f839810cb01fe599fe` supplied the observed session metadata and system-prompt variable behavior during reconstruction; it is evidence, not a permanent compatibility ceiling.
- The existing public `dsh-warm-minimal` implementation at revision `06fa6d385545215f543479aee9e4013a428965fc` is the reverse-engineering baseline, not semantic authority or an accepted realization.
- The user-generated local session `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4` is evidence for the desired native interaction shape. Its raw tool output contains unrelated machine details and must remain local rather than becoming a package artifact.
- DSH owns session persistence, agent execution, and transcript lifecycle. The package submits the bootstrap and held real input through that lifecycle and must not create a separate hidden session store.

## Constraints and permissions

- The session workspace may appear in the local DSH transcript because workspace confirmation is part of the warm-up. Do not transmit or publish session logs merely to install, validate, or maintain this package.
- Treat the normal agent loop and its shell working directory as the authority for the current session workspace. A host process working directory, plugin checkout path, static machine path, or guessed fallback is not an acceptable substitute.
- Preserve truthful provenance: the bootstrap is an actual user-role input generated by this package, and all assistant/tool messages are generated by the selected model and executed tools. Its namespaced message ID records package origin without changing provider-visible content.
- Preserve unrelated profile entries and presets. Replacement of the package-owned `warm-minimal` preset directory is allowed during an authorized upgrade only when that directory is wholly package-owned.
- The selected realization must use public plugin, preset, inbox, and agent-loop seams and must not modify DeepSeek Harness source files. A future state revision would be required before considering a host patch.
- Installing into or restarting a live DSH profile, publishing, pushing, changing remotes, or changing external services requires authority for that operation.
- Supported realizations must honor the runtime requirements they declare; the reconstruction baseline declares Node.js `^22.19.0 || >=24.0.0`.

## Non-goals

- Replacing the official DSH empty-session experience or expanding the official minimal capability set.
- Replaying or fabricating a fixed donor assistant response, tool call, or tool result.
- Creating a general prompt framework, session recorder, workspace manager, or alternative agent loop.
- Hard-coding one repository, machine, user name, or DSH checkout as the workspace.
- Shipping task-specific build, fix, or weak-request warm-up templates in this revision.
- Adding repository instructions, runtime-context snapshots, skills, compaction, background-job, goal, plan, delegation, or other standard-mode components to this minimal composition.
- Maintaining a fork or feature branch of DeepSeek Harness for package-owned compatibility changes.
- Reproducing the current implementation byte-for-byte when a future realization can satisfy the same acceptance criteria more safely.

## Implementation hints

- The reconstruction baseline mounts a host-plane bundle listener before user input and listens synchronously to `agent/inbox/inserted`.
- The same host plugin can participate in the root-side `system-prompt/assemble` waterfall. While the bootstrap is in flight for a `warm-minimal` session it filters `assembly.tools` to the two minimal tools; once `agent.whenIdle()` resolves it stops filtering before restoring the held input. The preset file itself stays byte-for-byte official minimal.
- On the selected target, the official persistent shell reads `agent.session.header.cwd` when spawning its PTY. Using that native shell is the workspace binding; the plugin must not calculate or inject a directory itself.
- A namespaced bootstrap message ID, a `turn/start` guard, and per-session in-flight state are useful mechanisms for idempotence, attribution, and restoration ordering.
- Keeping bootstrap orchestration separate from the preset's model-facing composition avoids duplicating process-global services.

## Known tensions and decisions

- The user explicitly requires the confirmed workspace to be the current session's workspace. The baseline implementation read `session.cwd` and fell back to `process.cwd()`; the selected replacement instead relies on the official persistent shell's checked `session.header.cwd → PTY cwd` path.
- After comparing the donor and reconstructed displays, the user selected ordinary native Chat visibility for this package. Folding is a future independent plugin concern; this package supplies only a durable provider-hidden message-ID marker for that integration.
- The user corrected the realization boundary twice: package behavior belongs to this package's state and lock, while the selected replacement must require zero Harness source modifications rather than carrying a package-owned host patch.
- Live evidence invalidated candidate `0.1.0-candidate.1`: assigning the prompt to `request.turn` was necessary but insufficient because a global-first prompt index still reordered whole turn sections. The replacement must test the complete two-turn display order, not isolated cell ownership.
- Live evidence also invalidated candidate `0.1.0-candidate.2`: it scoped injection using the immutable creation header even though DSH records later successful mode selection in the session event log. Runtime selection is authoritative for whether this optional mode may inject; Trajectory must not hide already-persisted scope violations.
- The user then invalidated candidate `0.1.0-candidate.3` semantically: its standard-derived composition exposed extra prompt contexts, instructions, skills, and tools. The replacement is anchored to the official minimal composition and uses the donor session only as a native-behavior oracle.
- The selected Linux donor uses `bash`; a future non-Linux realization must preserve minimal-preset equivalence while binding the platform shell and must record that realization-specific template difference instead of silently labeling PowerShell as Bash.
- The setup scripts mark the package-owned preset and refuse unowned replacement, but clean candidate.6 uninstall has not yet been exercised end to end against the live profile. `WARM-007` therefore remains incomplete.
- On 2026-08-28 the user supplied the missing v4-pro rationale and invalidated candidate.5: its bootstrap turn exposed the full profile catalog (24 tools in `request/header`) and the following real turns opened with `Let me`. The replacement must gate the bootstrap turn to exactly two minimal tools and restore the remaining catalog on the second turn. Candidate.5 is marked failed as historical evidence.
- Donor tension: `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4` ran under effective preset `minimal` with the same polluted 24-tool profile catalog and still opened with `We need` under `reasoningEffort: max`. The two-tool first face remains the user-selected requirement; reasoning effort is recorded as a possible additional style factor and must be kept distinct in future evidence.
- No accepted realization lock is selected. Candidates `0.1.0-candidate.1`, `0.1.0-candidate.2`, `0.1.0-candidate.3`, `0.1.0-candidate.4`, and `0.1.0-candidate.5` failed live or semantic acceptance and are retained only as historical evidence; candidate.6 is the current replacement candidate.
- The selected Protocol 0.2 lock is owned by the external `meta-intent` package identified in `STATE.json`; the local `locks/` area contains only realizations of `dsh-warm-minimal` itself.
