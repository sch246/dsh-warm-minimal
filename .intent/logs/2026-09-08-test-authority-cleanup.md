# Test maintenance scope

The user authorized removal of product-behavior tests while retaining necessary external-contract and mechanical-invariant checks. Confirmed intent belongs in STATE, not a parallel assertion suite. The shared meta-intent Agent entry carries this rule.

Removed 5 complete test files; mixed files retain only the applicable grounded checks. Unused runner entries, UI test dependencies and fixtures were removed where no retained consumer uses them. Runtime source and live profile are unchanged.

Retained evidence resources:

- `tests/lifecycle.test.mjs`: package-owned patch lifecycle and explicit workspace mutation safety; operational mechanical invariants

The UI-primitives fixture remains because scripts/build-client.sh still resolves the build dependency through it; removing a test suite does not authorize breaking that build input.

No tests or builds were run for this cleanup. Syntax, manifest/reference consistency and diff checks are static evidence only.
