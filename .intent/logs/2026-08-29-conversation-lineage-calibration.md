# Source record: conversation lineage calibration

Record ID: `SRC-2026-08-29-DSH-WARM-CONVERSATION-LINEAGE-CALIBRATION`

Status: user-authorized clarification of the current intent projection. It preserves the earlier source records and corrects later implementation summaries where compression could be read as semantic completion. It does not accept a realization.

## Desired phase model

The user supplied the following phase distinction as the default behavior:

| Phase | Model-visible prompt and context | Model-visible tools |
| --- | --- | --- |
| Main-agent bootstrap | The exact one-sentence minimal prompt | Platform shell and editor |
| Main-agent normal work | Very short coordinator guidance and limited AGENTS content | Shell, editor, skill access, one compact delegate interface, and necessary user interaction, approval-facing, and coordination capability |
| Delegated execution child | A package-owned copy of the Standard coding prompt and complete relevant AGENTS/skill input | The complete worker-safe Standard execution roster |

“Complete” does not mean every installed tool. User inquiry, approval-facing interaction, and coordination remain with the main agent. Execution children receive suitable shell, filesystem/search/editing, jobs, Web, terminal, language tooling, and similar execution capabilities only when the Host provides a worker-safe implementation. Delegated children use approval policy `never`, cannot replace the main agent for approval, and return results rather than acting as user-interaction or streaming UI agents.

The warm package owns this composition. It may copy selected Standard configuration and prompt text, but must not inherit, extend, or depend on the Standard preset at runtime. Host source changes are permitted realization work when marked and lifecycle-managed under the intent package.

## Configuration semantics

The optional bootstrap enablement, bootstrap user message, and short post-bootstrap coordinator guidance are configurable. The default guidance tells the main agent that delegated agents have broader tools and that the main agent owns local inspection, integration, coordination, and user interaction.

Post-bootstrap visibility has two independently editable inventories: prompt/context sources and tool sources. Prompt/context sources include every relevant model-input family, including system-prompt sections, runtime contexts, durable AGENTS input, and model-visible skill guidance or catalog descriptors where the target contributes them. A realization must not omit AGENTS or skills merely because the Host carries them outside system-prompt assembly. Tool rows expose readable tool names and description previews.

Every source uses one three-choice assignment: main only, child only, or shared. Every known DSH source has a package default based on responsibility. Only genuinely unknown sources use the child-only fallback. Hiding a source controls model context only; it does not add an execution-pipeline rejection for an explicitly formed call to a registered tool.

The official Plugins settings page is the preferred entry. When its card lacks sufficient space, a compact summary and button opening a package-owned full editor is valid; the `dsh-agent-games` manager is the selected layout reference. Prompt/context and tool groups collapse independently, use compact rows, and use radio-style three-slot controls rather than select menus.

## Verification and scope constraint

Verification work stays on the product mainline. Run focused checks that directly distinguish the requested bootstrap, source inventory, default assignment, role projection, readable UI, and managed Host lifecycle from plausible wrong implementations. Broad repository, coverage, documentation-site, or peripheral test suites require a demonstrated benefit or an explicit user request.

## Current realization mismatch

The current source realization proves optional bootstrap, system-prompt/tool source admission without execution denial, stable IDs, package-owned roster rows, readable tool metadata, radio controls, collapsible groups, and a wide Plugins manager. It is not semantically complete:

- durable AGENTS input is absent from the source inventory and cannot yet be assigned independently; parent and child receive it through the same effective path;
- the main-agent default exposes several delegation/workflow controls rather than one compact delegate interface;
- defaults are registered for package-owned preset entries, while known DSH Host-global prompt and policy contributions can still fall through as unknown child-only sources;
- the worker roster does not yet provide the complete requested safe execution set, including terminal and a sandbox-confined language-tooling provider;
- no live deployment or model-request-header observation has verified the three phases end to end.

## Classification and consequence

This exchange is an `intent_clarification` because earlier STATE prose compressed the phase matrix and source-family completeness. The discrepancies above are `implementation_mismatch`, not reasons to weaken the intent. STATE must preserve the exact responsibility split and inventory scope, and the current realization remains draft until focused evidence covers them.
