<!-- meta-intent:entry:start -->
## Intent-package entry

Maintain an executable installation and maintenance map as user understanding, upstream software and environments change. The first map can be incomplete; use user feedback and checked reality to improve it, rather than making accumulated implementation debt the permanent design.

- Start with [this package's STATE](.intent/state/STATE.md) and the user's request. STATE tells an unfamiliar Agent which effects to provide, why they matter, where to find resources, and how to install, adapt, verify and remove them under applicable conditions. Keep every supported capability reachable from that map.
- Before writing, distinguish the information's role. STATE owns intended effects and reusable operational guidance. LOG owns selected actual decisions, observations and their reasons; historical implementation gaps, debt inventories and task progress belong there or in a disposable work record. Keep conditions and adaptation steps needed to act in STATE, without turning it into a status table. LOCK retains an exact purpose-bound realization, not permanent requirements. Do not turn this distinction into a mandatory document transaction for each repair.
- Inspect the target and recover relevant existing decisions before inferring new requirements. Code, tests and past installations are evidence about implementations; they do not decide user intent. Optional cooperation does not establish a required dependency. Change STATE when feedback clarifies an effect or experience improves the executable route, not merely because current code differs.
- Maintain confirmed intent in STATE, not a parallel product-behavior test suite. Do not routinely add tests to obtain confidence in an inferred interpretation. Retain useful externally grounded contract and mechanical-invariant checks; remove superseded UI/behavior expectations and unused test scaffolding within the authorized scope. A test is evidence, not a veto over clarified intent, and retained tests need not run for unrelated changes.
- Act within the user's existing authority. Read selected sources when why, scope or attribution matters; do not replay every LOG. Choose checks that resolve a real uncertainty at reasonable cost, and distinguish observed results from unperformed checks.
- This entry routes attention; it does not replace STATE or the selected protocol. Follow the package's state record for protocol/binding changes. See [meta-intent's map](../meta-intent/state/STATE.md) when maintaining this guidance or when the roles themselves are unclear.
<!-- meta-intent:entry:end -->

# Agent entry

This host contains an embedded intent package at `.intent/`.

- Start with `.intent/state/STATE.json` and `.intent/state/STATE.md` before changing, installing, maintaining, or uninstalling this package. Read the selected protocol when its semantics, format or bindings change, or when their interpretation is uncertain.
- The selected protocol lock is owned by the `meta-intent` package and resolved through the URI in state; do not copy it into this package's local `locks/` directory.
- Use the STATE installation and maintenance map for current commands, source ownership, data and verification; selected logs explain relevant decisions and old locks provide optional recovery evidence.
- Files outside `.intent/` are the current DSH plugin and preset realization. They are target reality and implementation evidence, not semantic authority.
- No realization lock is currently selected. Do not describe the current worktree as an accepted or reproducible realization.

The root is a private maintenance workspace. Install only `packages/dsh-warm-minimal`; runtime code, presets, Bundle metadata and generated outputs belong there. Keep `.intent/`, patches and maintenance scripts at root. Use the shared root entry for explicit checkout/Home/profile operations; setup/remove default to inspection.
