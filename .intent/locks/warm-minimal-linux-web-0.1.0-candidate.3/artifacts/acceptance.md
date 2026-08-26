# Candidate acceptance evidence

Observed on 2026-08-26:

- Durable candidate.2 counterexamples show `agent-preset/selected = standard` or `minimal` before the first real message, followed incorrectly by the package warm-up. This reproduces the user's cross-mode scope report from persisted events.
- A focused plugin regression covers both runtime-switch directions. Before the fix, creation header `warm-minimal` plus runtime selection `standard` still seeded and the test failed 3/4.
- Candidate.3 resolves the effective preset from the most recent `agent-preset/selected` event and falls back to the creation header only when no such event exists, matching DSH's `resolveSessionPreset` semantics.
- After the fix, the focused timing suite passed 4/4 and the complete plugin suite passed 6/6.
- Candidate.2's previously verified Chat hiding, Trajectory ordering, workspace provenance, and baseline-bound host lifecycle patch remain unchanged.
- Harness has no package-created commit or fork; its five compatibility paths remain owned through the plugin receipt and reversible patch lifecycle.

Still required before acceptance:

- Install candidate.3 into the live `web` profile and verify the receipt revision.
- Build and restart Web from candidate.3.
- In a new blank session created as warm-minimal but switched to another preset before the first message, observe no synthetic warm-up.
- In a new blank session whose effective preset is warm-minimal, observe exactly one warm-up in Trajectory and none in ordinary Chat.
- Exercise live-profile uninstall/reinstall without losing unrelated worktree or profile changes.
- Obtain explicit user acceptance.
