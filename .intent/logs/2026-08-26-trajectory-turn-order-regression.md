# Source record: Trajectory turn-order regression

Record ID: `SRC-2026-08-26-DSH-WARM-TRAJECTORY-TURN-ORDER`

Status: user-reported candidate failure with durable-log and projection-code evidence.

## Observed failure

- After the candidate was installed, built, and Web restarted, the user sent one real message, `你好`.
- Trajectory displayed the real request turn first (`Initial System Prompt`, `你好`, injected request contexts, real assistant reply), then displayed the earlier synthetic warm-up (`pwsh Get-Location`, preparation context, `Ready.`).
- This violates the requested debug contract even though ordinary Chat hiding and prompt ownership were partially corrected.

## Investigated reality

- Session `session-19a0fa0e-0b4f-4188-99f4-e6890d165185` durably records the correct sequence: warm-up turn 1 spans seq 4–12; real turn 2 starts at seq 13, records `你好` at seq 16, request context at seq 22, and the final assistant at seq 134.
- The durable log therefore does not need repair. The failure is entirely in the Trajectory projection.
- The candidate assigned the initial prompt to `request.turn`, but `layoutEntryOrder()` still forced every initial prompt to global negative infinity. The final turn list then sorted sections by each turn's first generated cell index. Consequently the turn-2 prompt gave turn 2 the earliest global index and moved the whole real turn before warm-up turn 1.
- User and context nodes also carry resolved durable `eventLocations`, but the layout ignored those locations and inferred their turn from the following assistant. That heuristic is a fallback, not an acceptable authority when a durable location exists.

## Classification and projection

- This is an `implementation_mismatch` in the current candidate, not a change to the desired warm-up behavior.
- State must make the ordering invariant falsifiable: durable turns retain their order; an initial prompt is first only inside its owning request turn; it cannot reorder an earlier turn; recorded user/context locations take precedence over adjacency inference.
- Candidate `0.1.0-candidate.1` remains unaccepted. A replacement candidate must carry the corrected host patch, a regression fixture shaped like the observed two-turn session, reversible lifecycle metadata, and fresh build/live evidence.
