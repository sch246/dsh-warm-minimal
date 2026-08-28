# Source record: v4-pro initial face and bootstrap tool gate

Record ID: `SRC-2026-08-28-DSH-WARM-V4PRO-INITIAL-FACE`

Status: explicit user correction of missing rationale and of the bootstrap turn's model-visible tool face.

## Desired effect carried into investigation

- The package exists to imitate the official minimal preset, not to supplement a standard-mode session with a warm-up.
- deepseek-v4-pro is, due to its training, highly sensitive to the initial prompt. It needs the fixed minimal-mode shape to enter the collective `we need` reasoning chain, which is where the intended behavior emerges.
- This rationale must be part of the package documentation and state; it was previously missing.
- The existing realization is therefore defective: minimal mode's first request exposes only two tools, while the bootstrap turn exposed every tool registered in the profile. The user's diagnosis: tools cannot be absent entirely, but they also cannot all be present in the first turn; the only solution is to re-expose the remaining tools on the second turn.

## Investigated reality

- The selected Linux official minimal composition is byte-for-byte identical to `presets/warm-minimal/agent.cordis.yml`: one complete system sentence and the platform shell plus `str_replace_editor`.
- In the live web profile, other bundles register global host-plane tools (dev supermods, image readers, weather). Durable counterexample `session-2b5966bc-50dc-4f9b-b614-1d33b1fc0edd` recorded 24 tools in the bootstrap `request/header` at seq 19. Its reasoning fingerprint for the first real request (`这个插件是怎么实现的`) was `we=0, lets=0, letMe=3, I=1`, and later turns grew to `letMe=8` and `letMe=35` — the `Let me` opening the user identified.
- Donor session `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4` (effective preset `minimal` after runtime selection) also saw the same 24-tool profile catalog and opened with `We need respond in...` under `reasoningEffort: max`. This is recorded as an unresolved tension: the user mandates the two-tool first face, while the donor shows that reasoning effort may also participate in the style outcome. The tool gate is still the selected fix; it does not claim to be the only style factor.
- The package implementation was changed at Git commit `980a8891cec72830b292a5c4f5d4103d6dea238e`: a root-plane `system-prompt/assemble` listener now filters the model-visible tool list to exactly `bash` + `str_replace_editor` while a session's bootstrap is in flight, and stops filtering once `agent.whenIdle()` resolves, before the held original input is restored.
- Unit suite extended to 10/10 passing checks, including: first bootstrap assembly exposes exactly the two minimal tools; the post-bootstrap assembly exposes the full previously assembled catalog; non-agent assemblies, non-warm-minimal sessions, and sessions without an in-flight bootstrap are never filtered.
- Live verification after `dsh-web` restart: session `session-e2a4afc3-7127-44e2-962b-bfd82b737ad8` (preset `warm-minimal`) recorded bootstrap `request/header` tools `[bash, str_replace_editor]` at seq 11 and full-profile tools on the second request at seq 106. Bootstrap reasoning opened with `need respond... We should invoke bash pwd` (`we=1, letMe=0`).

## Classification and projection

- Missing rationale is an `intent_clarification`: the state and README now record the v4-pro initial-prompt sensitivity and the fixed-minimal-shape goal.
- The all-tools bootstrap face is an `implementation_mismatch` against that clarified intent: state acceptance now requires the two-tool bootstrap face and the second-turn restoration of the remaining catalog.
- Candidate `0.1.0-candidate.5` is superseded because its state did not carry this requirement and its live bootstrap saw the full catalog. Its lock is marked failed as historical evidence.
- The fix stays inside the package: preset bytes remain official-minimal equivalent; the host plugin only filters one assembly during the bootstrap turn. No Harness source is modified.

## Remaining before acceptance

- Live acceptance of the new candidate against the revised `WARM-006` / `WARM-009` criteria, which the session above now evidences for the selected Linux web target.
- User acceptance of the revised state and candidate.
