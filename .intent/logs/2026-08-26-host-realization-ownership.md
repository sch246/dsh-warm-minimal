# Source record: host realization ownership

Record ID: `SRC-2026-08-26-DSH-WARM-HOST-OWNERSHIP`

Status: explicit user correction of the realization boundary.

## Desired effect carried into investigation

- The DeepSeek Harness changes required for warm-up Chat visibility and Trajectory ordering must not be maintained as a Harness fork or ordinary Harness commit.
- Those host changes must be tracked by the `dsh-warm-minimal` package state and realization lock so installation and uninstall can apply and remove them as package-owned effects.
- The user authorized rebuilding and restarting the current Web service after the package-owned realization is installed.

## Investigated reality

- Public preset and bundle seams can create and mark the synthetic warm-up events, but ordinary Chat visibility and Initial System Prompt placement are client projection behavior owned by Harness source.
- The prior attempt created local Harness commit `76e2ce8ff7`; pushing it to the upstream repository was rejected with HTTP 403, and no fork was created. The commit was then removed from local branch history with a mixed reset while preserving its working-tree changes for migration into the package-owned realization.
- The existing package setup scripts copied a preset and registered a bundle but had no host-patch manifest, receipt, drift check, or uninstall path.
- A unified diff against Harness baseline `b642a10626a950cc95c2d6f839810cb01fe599fe` can own the five runtime/generated source paths needed by this behavior. `git apply --check` and its reverse form provide a falsifiable install/uninstall boundary: a same-hunk drift stops mutation while unrelated dirty paths remain untouched.

## Classification and projection

- This is an `intent_revision`: host modification was previously a non-goal when public seams sufficed, but the user now requires the unavoidable projection changes to be package-owned and lifecycle-managed.
- State permits only lock-declared, baseline-bound, reversible host patches. It explicitly rejects a Harness fork, standalone Harness commit, silent adoption, or blind reverse operation.
- The concrete patch, manifest, lifecycle command, receipt schema, and current Linux Web target belong to a candidate realization. Live acceptance and uninstall/reinstall evidence are still required before activation.
