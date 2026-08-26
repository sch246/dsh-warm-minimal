# Candidate acceptance evidence

Observed on 2026-08-26 before live deployment:

- `npm test` in `/root/dsh-warm-minimal`: 5 tests passed, covering seed timing/workspace behavior plus host patch install, idempotence, explicit adoption, drift refusal, and uninstall restoration.
- `node locks/protocol-0.2/bin/validate.mjs /root/dsh-warm-minimal`: package structurally valid before candidate bundle creation.
- The realization patch passed `git apply --reverse --check` against the five currently modified Harness paths at baseline commit `b642a10626a950cc95c2d6f839810cb01fe599fe`.
- With temporary Harness-side regression tests present, the focused Chat and Trajectory suites passed 46/46; the affected package suites passed 591/591; `pnpm run typecheck:contracts-ready` and `pnpm run verify-cordis-catalog` passed.
- The full GUI run passed 4,021 tests with 1 skipped and 4 failures in pre-existing dirty settings/theme behavior outside the owned paths. Those failures are not claimed as passing evidence.

Still required before acceptance:

- Build and restart the current Web target from the installed candidate.
- Observe ordinary Chat hiding the warm-up and Trajectory retaining it with the initial system prompt on the real request turn.
- Exercise the live-profile uninstall/reinstall path without losing unrelated worktree or profile changes.
- Obtain explicit user acceptance of this realization.
