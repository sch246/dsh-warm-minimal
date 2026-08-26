# Runtime preset scope correction

Observed on 2026-08-26 after candidate.2 was deployed:

- The user reported that selecting other modes still caused the synthetic `Get-Location` / `Ready.` warm-up to appear. This contradicts the package boundary: warm-up belongs only to 温暖极简模式.
- The installed listener checked only `session.header.agentPreset === 'warm-minimal'` immediately before seeding.
- DSH treats the header as the initial preset and records later successful mode changes as append-only `agent-preset/selected` events. Its own `resolveSessionPreset` helper resolves the effective preset from the most recent such event, falling back to the header only when no selection event exists.
- Durable counterexample `session-4c0e91fd-5f18-4d38-ab50-8dc711a10055` has header preset `warm-minimal`, records `agent-preset/selected` = `standard` at seq 3, then incorrectly receives the package warm-up at seq 7–11.
- Durable counterexample `session-3bf7f737-0cc3-4a87-a133-5dc838f1286f` has header preset `warm-minimal`, records `agent-preset/selected` = `minimal` at seq 3, then incorrectly receives the same warm-up at seq 7–11.
- In the recent-session sample, no session whose effective selected preset remained outside `warm-minimal` produced the warm-up unless this stale-header mismatch was present. Trajectory was truthfully displaying already-persisted events; hiding them would conceal the scope violation rather than fix it.

Classification: `implementation_mismatch` with an intent clarification. `WARM-002` already excludes other presets, but “preset” must mean the effective preset at insertion time, including the latest successful runtime selection, rather than the immutable creation header.

Required realization behavior:

- At `agent/inbox/inserted`, resolve the effective preset as the most recent `agent-preset/selected` event, falling back to `session.header.agentPreset` only when no selection event exists.
- Seed only when that effective preset is exactly `warm-minimal`.
- Cover both directions: switching from warm-minimal to another preset suppresses seeding; switching from another initial preset to warm-minimal enables it.
- Keep Trajectory/debug truthful. Do not add a UI filter to disguise out-of-scope persisted events.

Candidate.2 is not acceptable because it violates the preset activation boundary. A replacement candidate must demonstrate this runtime-switch regression before deployment.
