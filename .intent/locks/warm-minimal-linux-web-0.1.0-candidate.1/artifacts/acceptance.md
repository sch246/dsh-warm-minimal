# Candidate acceptance evidence

Observed on 2026-08-26 before live deployment:

- `npm test` in `/root/dsh-warm-minimal`: 5 tests passed, covering seed timing/workspace behavior plus host patch install, idempotence, explicit adoption, drift refusal, and uninstall restoration.
- `node locks/protocol-0.2/bin/validate.mjs /root/dsh-warm-minimal`: package structurally valid before candidate bundle creation.
- The realization patch passed `git apply --reverse --check` against the five currently modified Harness paths at baseline commit `b642a10626a950cc95c2d6f839810cb01fe599fe`.
- With temporary Harness-side regression tests present, the focused Chat and Trajectory suites passed 46/46; the affected package suites passed 591/591; `pnpm run typecheck:contracts-ready` and `pnpm run verify-cordis-catalog` passed.
- The full GUI run passed 4,021 tests with 1 skipped and 4 failures in pre-existing dirty settings/theme behavior outside the owned paths. Those failures are not claimed as passing evidence.

Observed during candidate deployment on 2026-08-26:

- The existing byte-matching host patch was explicitly adopted into a receipt; `host-patch.mjs status` reports `installed`.
- The marked preset was installed and the existing Web profile link to `/root/dsh-warm-minimal` was retained.
- `DSH_SNAPSHOT=replay pnpm run test:web` completed the production host/client/Web build. The built conversation and trajectory bundles contain the owned `hideFromChat` and request-turn placement logic.
- The replay suite exposed at least nine failures in existing queue, steering, built-boot, and smoke-real scenarios in the dirty Harness worktree, then remained active without further output and was interrupted. It is not passing acceptance evidence.
- `systemctl restart dsh-web` completed; the service is active, listens on `127.0.0.1:3082`, and returns the built HTML document.

Still required before acceptance:

- Observe ordinary Chat hiding the warm-up and Trajectory retaining it with the initial system prompt on the real request turn.
- Exercise the live-profile uninstall/reinstall path without losing unrelated worktree or profile changes.
- Obtain explicit user acceptance of this realization.

## Live rejection

The user exercised the deployed candidate and observed the real request turn before the earlier synthetic warm-up turn. Durable session evidence proved the stored order was correct and the candidate Trajectory layout reordered it. Candidate `0.1.0-candidate.1` therefore failed `WARM-003A` and must not be accepted or reused as last-good.
