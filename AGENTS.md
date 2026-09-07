# Agent entry

This host contains an embedded intent package at `.intent/`.

- Start with `.intent/state/STATE.json` and `.intent/state/STATE.md` before changing, installing, maintaining, or uninstalling this package. Read the selected protocol when its semantics, format or bindings change, or when their interpretation is uncertain.
- The selected protocol lock is owned by the `meta-intent` package and resolved through the URI in state; do not copy it into this package's local `locks/` directory.
- Use the STATE installation and maintenance map for current commands, source ownership, data and verification; selected logs explain relevant decisions and old locks provide optional recovery evidence.
- Files outside `.intent/` are the current DSH plugin and preset realization. They are target reality and implementation evidence, not semantic authority.
- No realization lock is currently selected. Do not describe the current worktree as an accepted or reproducible realization.

The root is a private maintenance workspace. Install only `packages/dsh-warm-minimal`; runtime code, presets, Bundle metadata and generated outputs belong there. Keep `.intent/`, patches and maintenance scripts at root. Use the shared root entry for explicit checkout/Home/profile operations; setup/remove default to inspection.
