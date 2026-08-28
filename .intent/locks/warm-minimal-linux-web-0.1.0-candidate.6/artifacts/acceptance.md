# Candidate acceptance evidence

Realization: `dsh-warm-minimal-linux-web@0.1.0-candidate.6`

Implementation identity: `dsh-warm-minimal` commit `980a8891cec72830b292a5c4f5d4103d6dea238e`.

Unit evidence (2026-08-28):

- `node --test` passes 10/10 checks: native bootstrap ordering, restoration, failure restoration, effective preset scope, started-session idempotence, non-user exclusion, minimal composition, bootstrap two-tool gating, post-bootstrap full-catalog promotion, and no filtering outside an in-flight warm-minimal bootstrap.

Live evidence (2026-08-28, Linux web profile on 127.0.0.1:3082):

- After `dsh-web` restart, a new session `session-e2a4afc3-7127-44e2-962b-bfd82b737ad8` was created through the public RPC with cwd `/tmp/dsh-warm-gate-verify` and preset `warm-minimal`, then received the real prompt `请只回复 ok`.
- Bootstrap `request/header` (seq 11): system prompt exactly `You are a helpful software engineer assistant.`; model-visible tools exactly `[bash, str_replace_editor]`.
- Second `request/header` (seq 106, original real request): the full 24-tool profile catalog is restored (`bash`, dev tools, image tools, weather, `str_replace_editor`).
- Bootstrap reasoning fingerprint: `we=1, lets=0, letMe=0, I=0`, opening `need respond ... We should invoke bash pwd`.
- Counterexample before the fix: session `session-2b5966bc-50dc-4f9b-b614-1d33b1fc0edd` recorded 24 tools in the bootstrap `request/header` and real-turn fingerprints with `letMe=3`, then `letMe=8` and `letMe=35`.

Known boundary:

- Donor session `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4` opened with `We need` despite the same 24-tool profile catalog under `reasoningEffort: max`; reasoning effort is recorded as a possible additional style factor, not as a reason to weaken the selected two-tool gate.
- `WARM-007` clean uninstall/reinstall evidence remains required before full acceptance.
