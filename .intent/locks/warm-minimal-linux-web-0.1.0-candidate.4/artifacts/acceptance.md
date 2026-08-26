# Candidate acceptance evidence

Observed on 2026-08-26:

- The user-selected donor session is `session-26c57c2e-5ff3-49fd-afd1-c40c468ef9d4`. It selected official preset `minimal`, used the sole system prompt `You are a helpful software engineer assistant.`, and exposed exactly `bash` and `str_replace_editor`.
- Focused pre-fix tests failed independently on both mismatches: the seeded user message was still the old English preparation text, and the warm-minimal composition lacked `complete: true` while retaining standard-derived components.
- Candidate.4 fixes the seed to the selected donor message/reasoning/bash-call/Ready fields. Its only semantic runtime substitution is the synthetic tool-result workspace from `session.header.cwd`; generated IDs and package provenance remain truthful metadata.
- `presets/warm-minimal/agent.cordis.yml` is byte-for-byte equal to the target Harness official minimal preset composition.
- The focused seed and composition checks pass, and the complete plugin suite passes 8/8 including runtime preset switching, workspace provenance, chat marker, and host lifecycle coverage.
- `npm pack --dry-run` succeeds and does not include the raw donor session or its real directory listing.
- Candidate.3's previously verified Chat hiding, Trajectory ordering, and baseline-bound reversible Harness compatibility patch remain unchanged.
- Harness has no package-created commit or fork.
- Controlled upgrade removed candidate.3 through its matching receipt, then installed candidate.4. The new receipt reports revision `0.1.0-candidate.4` and the expected five owned compatibility paths.
- The installed user preset composition is byte-for-byte equal to the official target minimal composition, and the `web` profile loads this package through `link:/root/dsh-warm-minimal`.
- Harness's official minimal-composition runtime test passed: one exact persona section, tools `bash` and `str_replace_editor`, and no compaction service.
- `dsh-web` was restarted successfully, returned to `active`, listened on `127.0.0.1:3082`, and served the production HTML.

Still required before acceptance:

- In a new warm-minimal session, inspect the first real provider request: exact one-sentence system prompt, exactly two tools, and no repository/runtime/skills/compaction contexts.
- Observe exactly one donor-template warm-up in Trajectory, none in ordinary Chat, and the current session workspace in its tool result.
- Obtain explicit user acceptance.
