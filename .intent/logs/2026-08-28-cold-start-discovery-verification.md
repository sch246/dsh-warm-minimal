# Source record: cold-start discovery verification

Record ID: `SRC-2026-08-28-DSH-WARM-COLD-START`

Status: passing verification that the package self-describes from `AGENTS.md` alone.

## Checked question

A future Agent with no prior session context must be able to enter this repository, start from `AGENTS.md`, and reconstruct the meta-intent architecture and the package's required behavior without this conversation.

## Method

A fresh, conversation-empty `minimal` session `session-b7a3d918-2978-4ccf-b76f-eb6ece0ee1cb` was created in cwd `/root/dsh-warm-minimal` and received only the instruction to start from `AGENTS.md`, follow its entry guidance, and then answer four questions: semantic authority and protocol, why the plugin exists, the bootstrap turn's tool face versus later turns, and the reading order for a cold agent.

## Observed result

- The fresh agent read `AGENTS.md` before treating any implementation file as authority, then read `.intent/state/STATE.json`, `.intent/state/STATE.md`, the candidate.6 realization lock and its acceptance artifact, the 2026-08-28 correction log, and only afterwards inspected `index.mjs`, the preset, tests, and README as realization evidence.
- Its answers matched current state: authority is `.intent/state` under `meta-intent` protocol 0.2; the plugin imitates the official minimal first-turn face to guide deepseek-v4-pro into the `we need` chain instead of `Let me`; the bootstrap turn exposes exactly `bash` + `str_replace_editor` and the remaining tools return on the second turn; a cold agent should read `AGENTS.md -> STATE.json -> STATE.md -> protocol lock -> candidate lock -> logs` before implementation files.

## Classification

`verified_no_change`: the clarified intent and the `WARM-009` tool-gate requirement are already durably discoverable from the package itself. No semantic state change follows from this check.
