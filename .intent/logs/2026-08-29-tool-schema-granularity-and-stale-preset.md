# Source record: tool-schema granularity and stale preset

Record ID: `SRC-2026-08-29-DSH-WARM-TOOL-SCHEMA-GRANULARITY`

Status: user-authorized intent correction and checked realization diagnosis. It supersedes source-level tool assignment semantics without changing prompt/context source assignment. It does not authorize live installation, restart, or realization acceptance.

## Intent correction

Tool visibility is assigned per model-visible tool schema, not per provider source. A provider may contribute tools with different responsibilities; provider-level assignment cannot keep user inquiry and coordination with the main agent while sending execution tools to children. Each tool therefore has its own main-only, child-only, or shared choice. Provider source remains read-only provenance and may participate in stable identity, but it is not the configurable unit.

Prompt/context assignment remains source-level until evidence shows one source contains independently assignable prompt contributions. Tool guidance contributed as prompt content remains independently controlled by the prompt/context list; tool assignment does not silently derive prompt assignment.

Known tool defaults are declared for exact package-owned contributions. A newly discovered tool under a known provider is not automatically granted the provider's assignment; without an exact known default it remains child-only. A saved tool assignment follows the same stable schema contribution across reload but does not transfer to an unrelated provider that later reuses the same tool name.

## Checked live diagnosis

The running Web profile resolves `dsh-warm-minimal` through `link:/root/dsh-warm-minimal`, and its service started after the current Host and browser artifacts. The active settings document contains no warm-minimal assignment overrides. The installed preset at `/root/.dsh/.agent-presets/warm-minimal/agent.cordis.yml`, however, is the stale 0.1 two-tool composition and lacks the package roster projection row present in the source preset.

Without that projection row, runtime roster registration is empty. Every observed source therefore follows the closed unknown fallback to child-only, which exactly matches the supplied screenshot. The screenshot is not evidence of saved user overrides or an old browser bundle.

## Consequence

There are two required repairs:

1. change the configuration, Remote inventory, runtime admission, post-waterfall projection, controller, and UI from source-level tool rows to independent tool-schema rows;
2. update the installed preset through the package lifecycle and restart or remount the live deployment only under separate deployment authority, then verify the actual three-phase request headers.

Source-only focused tests cannot establish installed preset freshness. Lifecycle verification must compare the package-owned source preset with the installed copy or otherwise expose their identities before claiming live defaults.

## Classification

Per-tool assignment is an `intent_revision` because the prior STATE explicitly named tool-source rows. The all-child-only screenshot is an `implementation_mismatch` caused by stale installed composition. The current realization remains draft.

## Realization evidence

Plugin commits `83c3781`, `70de5b2`, and `fecda5c` implement the corrected projection without accepting or activating it. Tool assignment identity now binds the Host source and tool name; Remote inventory, admission, post-waterfall filtering, browser state, and persistence operate on one row per tool schema. Description and parameter changes do not alter the ID, malformed or legacy provider-scoped keys fail loud, exact known defaults come from the package roster, and unknown schemas remain child-only. Explicit registered-tool execution is unchanged.

The Plugins editor keeps prompt/context rows source-scoped but renders each tool independently with its name, description preview, provider provenance, and native three-slot radio control. Focused component evidence includes two tools from one provider with different effective assignments and save identities.

The package lifecycle now recognizes only the exact 0.1 package-owned preset payload as automatically upgradeable. A retained old marker with modified content, an unknown owner, and a drifted current install remain protected from implicit replacement or removal. No setup command, live profile write, service restart, model request, or realization acceptance occurred while recording this evidence; the supplied live deployment remains stale until separately authorized activation and verification.

## Authorized live correction

The user subsequently authorized a manual local upgrade and directed the implementation to preserve only Host changes owned by the current plugin goal. Inspection showed that the previous Host provenance and admission APIs already belong to Harness revision `1f8dd5ef4b1dd2811b03ef3e1ce0e2bb0c7487cc`; replaying the older package patch would have misclassified upstream code and collided with unrelated dirty work. The package patch now contains only the declaration-time Loader entry resolver, its focused regression, and paired current-state prose. All unrelated Harness changes remained untouched.

Replacing the exact installed 0.1 preset and restarting the Web service exposed a second implementation mismatch. The roster projection ran while later siblings and group subtrees had not activated, and it also treated configuration group paths as effective Loader entry ids. The resulting registration covered only a small top-level subset. Plugin revision `c68ac911bcff544af6656625cfdf5d5921a43b81` projects the complete package roster from the current preset prefix and each entry's effective Loader id before any sibling fiber exists. A package test binds every roster id to a real preset entry.

The local Web service was restarted with the exact 0.2 preset. A cold Chromium load of the official Plugins editor observed 15 prompt/context rows and 50 independent tool rows, 195 radio inputs, no select element, and no page or console error. Tool defaults were main-only 10, child-only 37, and shared 3. `bash`, `str_replace_editor`, and `skill` were shared; `subagent` and `ask_user_question` were main-only; `web_search` was child-only. This is local realization evidence, not semantic acceptance or a selected realization lock.
