# Configurable coordinator realization

Date: 2026-08-29

## Source

This record captures implementation evidence for the configurable coordinator/worker intent declared by the user on 2026-08-29. It does not accept, install, publish, or activate the realization.

## Realization

DeepSeek Harness commits `d6dbcff72b` and `1f8dd5ef4b` add non-wire Host source provenance and source-aware model-input admission. File-backed Loader entries receive stable IDs derived from the resolved configuration filename and full entry ID. Prompt sections, contexts, and individual tool schemas retain those IDs outside their JSON representation. `SystemPrompt.admitSources()` filters contributions before complete prompt selection or dynamic evaluation while leaving the executable tool registry unchanged. Managed source regions carry nearby `@meta-intent` ownership comments.

Plugin commits `239e07c`, `bc8eb6b`, `54224e3`, `e833f27`, and `8542e7a` provide:

- a package-owned warm-minimal roster with no Standard preset dependency;
- optional truthful bootstrap with the exact minimal first face and fail-loud required-tool resolution;
- independent parent/child/shared assignment maps for prompt/context and tool sources, with unknown sources defaulting to child-only;
- a short main-agent delegation description and role-aware request projection without execution denial;
- a scope-only Host inventory Remote that creates no session, turn, or model request;
- a card in the official Plugins settings page that persists only the five authoritative settings fields through `settingsScope`;
- exact forward/reverse Host patch lifecycle scripts that stop on drift and do not build or restart a deployment.

## Evidence

Focused Host verification covered provenance stability, non-wire serialization, source admission before complete selection, dynamic evaluation avoidance, and per-schema tool filtering. Focused plugin verification covered bootstrap and role visibility, the self-contained roster, Remote inventory behavior, settings write authority, accessible card behavior, and exact patch lifecycle. Host and browser bundles were built from their maintained sources.

No repository-wide test, coverage run, documentation-site build, live installation, service restart, external publication, or realization acceptance was performed. The realization remains draft evidence until it is installed and observed against the intended deployment under separate authority.
