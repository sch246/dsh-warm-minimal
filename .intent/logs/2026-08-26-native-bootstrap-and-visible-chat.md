# Native bootstrap and visible Chat

Authorized on 2026-08-26:

- The user rejected transcript replay as the realization model: the donor session is a behavioral example and acceptance oracle, not a runtime body that should inject its own assistant/tool transcript.
- The user selected the simplest visibility branch: execute a real bootstrap turn through the normal agent loop and let it remain visible in ordinary Chat. A future independent conversation-folding plugin may collapse it.
- The user prefers that the bootstrap message carry machine-recognizable information when possible.

Checked target facts:

- Existing public APIs are sufficient without Harness source changes. An `agent/inbox/inserted` listener can synchronously remove the still-pending first real user message; `agent.followup()` runs another user-role message through the normal loop; `agent.whenIdle()` waits for model/tool activity to quiesce; the original immutable message can then be reinserted as the next turn.
- A normal loop turn naturally creates the canonical request/system, user, assistant, tool, result, and final assistant lineage consumed by Chat and Trajectory. This removes the need to fake durable assistant/tool events or repair their projection ordering.
- `UserMessage` has no declared metadata extension slot. Its durable `id` is an opaque branded string with no runtime format restriction and is not sent to the model provider. A namespaced bootstrap message ID is therefore the smallest zero-host-change marker that remains attached to the message for a future folding plugin.
- Out-of-repository custom session events cannot currently be appended with the required `ignorable` envelope marker, so inventing a plugin event would not be a safe zero-change contract.

Selected realization semantics:

1. On the first real user inbox insertion in a blank effective `warm-minimal` session, synchronously remove and retain that immutable message.
2. Insert a normal user-role bootstrap message whose text is `检查当前工作目录，确认后仅回复 Ready.` and whose ID begins with the namespaced marker `dsh-warm-minimal:bootstrap:`.
3. Let the selected real model and the official minimal tool composition execute the turn normally. Do not inject fixed reasoning, assistant messages, tool calls, results, or `Ready.` events.
4. After the agent becomes idle, restore the original user message as the next turn even when bootstrap execution fails; report restoration failure explicitly.
5. Show the entire native bootstrap turn in ordinary Chat and Trajectory. This package no longer owns hiding or folding policy.
6. Install no Harness source patch. A future folding plugin can identify the bootstrap by its durable namespaced message ID without changing model-visible content.

Impact:

- This is an `intent_revision`. It supersedes the fixed donor-transcript semantics and the previous ordinary-Chat hiding decision.
- Candidate.4 is failed: despite matching minimal composition, it manually injected a transcript and still required five Harness compatibility paths.
- Candidate.5 must remove the live candidate.4 patch, restore the Harness baseline on all package-owned paths, and prove that package install/uninstall leaves Harness source untouched.
