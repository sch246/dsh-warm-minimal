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
