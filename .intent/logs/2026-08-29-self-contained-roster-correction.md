# Source record: self-contained warm roster

Record ID: `SRC-2026-08-29-DSH-WARM-SELF-CONTAINED-ROSTER`

Status: user-authorized correction to the implementation dependency implied during the configurable coordinator/worker investigation. It supersedes any recommendation to extend or reuse the Standard preset at runtime.

## Correction

The warm mode owns its capability roster. It must not inherit, extend, compose from, or otherwise depend on the Standard preset as a runtime or preset dependency. Copying selected DSH roster configuration into the warm package is acceptable: copied material becomes part of the warm realization and changes only through an explicit package update.

This preserves independent semantics. A later Standard preset edit must not silently change the warm main-agent or child-agent model face, defaults, or source inventory. Maintenance may compare against a newer DSH roster and deliberately absorb selected changes, but the comparison is evidence for a package revision rather than an implicit dependency.

## Checked consequence

The existing warm preset owns only the minimal shell/editor rows, so the revised coordinator/worker behavior still requires a broader package-owned roster. The target supports directory-level preset copies and ordinary package-owned preset installation; no preset inheritance mechanism is required. Stable source identities and assignments should be declared with the copied contributions so the package can distinguish its known defaults from unknown external registrations.

## Classification

This is an `intent_clarification` with an implementation constraint. It narrows the permissible realization without changing the previously authorized optional bootstrap, role assignments, Plugins-page configuration, model-visible-only filtering, or Host-patch permission.
