# Source record: Chat visibility and debug order

Record ID: `SRC-2026-08-26-DSH-WARM-CHAT-DEBUG`

Status: explicit user clarification plus investigated target facts.

## Desired effect carried into investigation

- The synthetic warm-up should remain in the model-visible transcript but should not appear as conversation content in ordinary Chat.
- The existing Trajectory/debug interface should continue to show the full warm-up for inspection. No new debug mode is desired merely for this package.
- Debug display must preserve real ownership boundaries: the initial system prompt belongs to the first actual provider request, not to an earlier synthetic turn that issued no provider request.

## Investigated reality

- The observed session durably recorded the synthetic turn in the correct order: injected preparation context, assistant reasoning/tool request, tool result, and `Ready.` at seq 13–17; the turn closed at seq 19.
- The first real provider request recorded its `request/header` later at seq 30 and belonged to turn 2.
- Chat and Trajectory are independent projections over the same durable events. Chat supports hidden nodes that remain in its node store, while Trajectory independently retains event records.
- The Trajectory layout special-cased an initial prompt change by assigning it to `firstVisibleTurn(nodes, partial)`. A synthetic assistant in turn 1 therefore pulled the turn-2 request's initial prompt into the wrong turn.
- DSH message sources already distinguish producer from semantic context form. A reusable `warmup` form can identify a synthetic model prior without encoding visual styling or hard-coding `dsh-warm-minimal`; Chat may choose to omit that semantic turn while debug continues to project it.

## Classification and projection

- Ordinary-Chat visibility was omitted from the draft state and is an `intent_clarification` confirmed by the user.
- Initial-system-prompt placement is an `implementation_mismatch`: the durable log and request snapshot already know the owning request turn, but the debug layout discarded that ownership in favor of a visible-node heuristic.
- State now requires one semantic warm-up marker, ordinary Chat omission, full existing-debug visibility, and request-owned prompt placement. Exact component names and client implementation remain realization facts.
