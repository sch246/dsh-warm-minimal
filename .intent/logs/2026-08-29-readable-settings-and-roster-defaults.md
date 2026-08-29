# Readable settings and roster defaults

Date: 2026-08-29

## Source

The user rejected the first settings realization because opaque source IDs and select controls made the inventory difficult to read, the two long inventories consumed the Plugins page, tool descriptions were absent, and known package sources appeared to use the unknown child-only fallback. The user selected the `dsh-agent-games` manager pattern as a layout reference and restated the coordinator/worker responsibility split.

## Intent refinement

The official Plugins page keeps a compact warm-minimal summary and entry button. A wide, page-like modal owns the complete editor. Prompt/context and tool inventories collapse independently. Each source uses one three-slot radio group for main-only, child-only, or shared visibility. Compact tool rows show model-visible names and description previews; opaque stable IDs remain available in expanded details but are not primary labels.

Known-source defaults come from the same package roster resolver used by runtime admission. Saved settings override those defaults, and only sources absent from the package roster fall back to child-only. Inventory metadata remains read-only and never enters settings writes.

## Realization evidence

Plugin revision `aad8430` adds roster defaults and tool descriptions to the inventory Remote, keeps prompt sections and contexts distinct, separates the warm parent persona from a copied Standard worker persona, and adds Standard background job controls to the child roster. Plugin revision `4c4344d` adds the compact Plugins summary, wide modal, independent inventory disclosures, native radio segments, readable tool previews, responsive layout, and UI-primitives injection.

Focused tests reproduce the former all-child-only projection with empty assignment maps and verify that known Remote defaults win while unknown sources remain child-only. Component tests verify the compact summary, two independent source groups, three native radio options per source, absence of select controls, readable prompt/tool previews, and disabled write controls during loading, read-only, and saving states.

## Remaining gap

`AGENTS.md` content enters the model as durable user-role messages from `agent-instructions`, not as system-prompt sections or contexts. Current source admission therefore cannot give the parent a limited instruction budget while giving children the full instruction set. The realization reports this capability as shared in effect and does not claim role separation. A future Host change needs durable model-input source identity and admission before this part of the requested table can be accepted. The unsandboxed stdio LSP provider is also excluded from the worker-safe default roster.

No live profile installation, browser observation, service restart, publication, or realization acceptance was performed.
