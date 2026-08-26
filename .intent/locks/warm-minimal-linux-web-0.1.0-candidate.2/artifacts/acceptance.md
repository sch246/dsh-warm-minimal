# Candidate acceptance evidence

Observed on 2026-08-26:

- Durable session `session-19a0fa0e-0b4f-4188-99f4-e6890d165185` records warm-up turn 1 at seq 4–12 and the real `你好` request in turn 2 at seq 13–136. The target bug is therefore a projection reordering, not persistence corruption.
- Against candidate.1, the new live-shaped Trajectory regression produced two deterministic failures: turn order was `[2, 1]` instead of `[1, 2]`, and a context with a recorded turn-1 location was inferred into turn 2.
- With candidate.2 production changes applied, the focused layout file passed 24/24, including both new regressions.
- The complete `ui-trajectory` plus `ui-conversation` test command, `typecheck:contracts-ready`, and `verify-cordis-catalog` completed successfully.
- `npm test` in the plugin passed 5/5 lifecycle and warm-up tests.
- The production patch passes reverse-check against the installed five owned Harness paths. The separate regression patch passes forward-check after validation cleanup.
- The host lifecycle receipt reports candidate.2 installed, and Harness has no package-created commit or fork.
- `pnpm run build` completed successfully with candidate.2 installed. The compiled Trajectory bundle contains durable-event placement and non-system turn-order selection; the compiled Conversation bundle contains warm-up chat hiding.
- `dsh-web` was restarted from that build. It returned to `active`, listened on `127.0.0.1:3082`, and served the production HTML successfully after startup.
- Live preset-switch evidence failed `WARM-002`: sessions created with header preset `warm-minimal` but switched to `standard` or `minimal` before their first real message still received the package warm-up. Candidate.2 used the immutable header instead of DSH's latest runtime preset selection.

Failure disposition:

- Candidate.2 is failed and retained as evidence. It must not be accepted or selected as current.
