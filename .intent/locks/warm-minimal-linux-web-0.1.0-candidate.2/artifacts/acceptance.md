# Candidate acceptance evidence

Observed on 2026-08-26:

- Durable session `session-19a0fa0e-0b4f-4188-99f4-e6890d165185` records warm-up turn 1 at seq 4–12 and the real `你好` request in turn 2 at seq 13–136. The target bug is therefore a projection reordering, not persistence corruption.
- Against candidate.1, the new live-shaped Trajectory regression produced two deterministic failures: turn order was `[2, 1]` instead of `[1, 2]`, and a context with a recorded turn-1 location was inferred into turn 2.
- With candidate.2 production changes applied, the focused layout file passed 24/24, including both new regressions.
- The complete `ui-trajectory` plus `ui-conversation` test command, `typecheck:contracts-ready`, and `verify-cordis-catalog` completed successfully.
- `npm test` in the plugin passed 5/5 lifecycle and warm-up tests.
- The production patch passes reverse-check against the installed five owned Harness paths. The separate regression patch passes forward-check after validation cleanup.
- The host lifecycle receipt reports candidate.2 installed, and Harness has no package-created commit or fork.

Still required before acceptance:

- Build and restart Web from candidate.2.
- Observe the same two-turn scenario in the live Trajectory UI: warm-up turn first; real request turn second; Initial System Prompt first only within the real request turn.
- Exercise live-profile uninstall/reinstall without losing unrelated worktree or profile changes.
- Obtain explicit user acceptance.
