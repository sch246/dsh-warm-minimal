# Minimal donor-session template authority

Observed and authorized on 2026-08-26:

- The user corrected the product boundary: 温暖极简模式 should react like the official 极简模式, not like the standard software-engineering preset with an extra warm-up.
- The first system prompt must be exactly `You are a helpful software engineer assistant.` and the model-visible tool catalog must contain only the same two tools as the official minimal preset.
- The package should prepend one fixed first round derived from a user-generated template session. It should not add further prompt sections, runtime context, workspace instructions, skills, compaction, or other CONTEXT material.
- At runtime, the only template value that varies semantically is the workspace returned by the synthetic tool result. Session-local event IDs and truthful package provenance may remain generated metadata.

Donor evidence:

- Local session: `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4`, stored under the `/root` session namespace. The raw session remains local evidence and is not copied into the package because its real `ls -la` result contains unrelated machine details.
- The session selected preset `minimal` at seq 3.
- Its provider request used the sole system prompt `You are a helpful software engineer assistant.` and exposed only `bash` and `str_replace_editor`.
- Its fixed first-round model-visible shape is:
  1. user: `检查当前工作目录，确认后仅回复 Ready.`
  2. assistant reasoning from the donor session plus a `bash` tool call whose arguments are exactly `{"command": "pwd && ls -la"}` on the selected Linux target
  3. tool result whose workspace-dependent value is replaced with the current session workspace
  4. assistant: `Ready.`
- The official minimal composition confirms `complete: true` and `includeRuntimeContext: false`, a platform-selected persistent shell, and `str_replace_editor`; it omits agent instructions, skill loaders, compaction, and standard-mode tool rows.

Impact on current authority:

- This is an `intent_revision`, not a projection bug. It supersedes the draft assumption that warm-up supplements normal standard-mode context, skills, and broad software-engineering tools.
- The earlier oh-we-need reasoning-style requirement and standard roster are no longer part of the selected behavior. The donor assistant content is fixed template material rather than a continuing style policy.
- Ordinary Chat hiding and complete Trajectory/debug inspection remain as previously decided; this correction changes model context and preset composition, not that visibility boundary.
- Candidate.3 is semantically over-broad and cannot be accepted. A replacement must prove minimal prompt/tool/context equivalence and fixed-template fidelity before live deployment.
