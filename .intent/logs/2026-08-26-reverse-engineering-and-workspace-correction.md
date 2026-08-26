# Source record: reverse engineering and workspace correction

Record ID: `SRC-2026-08-26-DSH-WARM-MINIMAL`

Status: fact-aligned bootstrap provenance for the draft state. The existing repository is implementation evidence; only the user's stated desired effect and later authority events can approve semantics.

## Desired effect carried into investigation

- The user asked to inspect `/root/dsh-warm-minimal` and reverse-engineer it into an intent package.
- The user reported that the default injection appeared to contain a fixed workspace or always showed `deepseek-harness`, and stated that it must instead show the workspace belonging to the current session.

## Investigated reality

- Baseline revision `06fa6d385545215f543479aee9e4013a428965fc` implements an optional `warm-minimal` preset plus a host plugin. A blank session remains empty; the first real user inbox message causes one synthetic round to be appended before the normal agent loop handles that message.
- The seed is restricted to the `warm-minimal` preset, guarded by the absence of `turn/start`, and carries explicit plugin/model/tool source identities. The preset also injects reasoning-style guidance and composes the ordinary software-engineering tools and context facilities.
- The baseline read the seed workspace from `session.cwd ?? process.cwd()`. The observed DSH revision stores workspace metadata at `session.header.cwd`; its own system-prompt variable also reads `context.agent?.session.header.cwd`.
- A regression test using the real session shape (`header.cwd = /work/project`, no top-level `cwd`) reproduced the mismatch deterministically. Before the fix, the injected tool result was `/root/dsh-warm-minimal`, the test runner's process directory, rather than `/work/project`. A DSH host launched from `/root/deepseek-harness` would therefore produce the reported `deepseek-harness` value without any literal hard-coded path.
- Changing the implementation to read `session.header.cwd` made the workspace assertion pass. A second regression case establishes that absent metadata produces no seed events and one warning rather than a fabricated process-directory result. All three package tests then passed.
- The current realization also hard-codes the synthetic tool name as `pwsh`, copies a DSH standard preset roster, and supplies setup scripts that replace the package-owned preset directory. These are implementation facts whose portability and lifecycle behavior need separate acceptance evidence.

## Classification and projection

- The workspace defect is an `implementation_mismatch`: the existing documentation already claimed that the seed reports the session's real working directory, and the user's correction makes that desired effect explicit. State therefore records the observable invariant while the realization is repaired.
- The remaining draft intent was reconstructed from user-facing documentation, package metadata, source behavior, tests, configuration, and history. Concrete event APIs, field names, shell brands, copied roster rows, and numeric settings remain hints or target bindings unless they materially affect the stated acceptance.
- No realization lock is created. The public baseline does not contain the fix, and the corrected local worktree has neither an immutable implementation identity nor full install, runtime, uninstall, and user acceptance evidence.
