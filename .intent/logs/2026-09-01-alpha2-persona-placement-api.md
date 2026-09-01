# Alpha.2 persona placement API mismatch

Date: 2026-09-01

## Observation

After the alpha.2 candidate was installed, the user reported that the warm-minimal settings inventory could not mount the preset. The Loader error identified `dsh-warm-minimal/projection` importing `PERSONA_ORDER` from `@deepseek-ai/dsh-system-prompt`, which no longer exports that name.

The installed dependency resolves entirely to DeepSeek Harness `dsh-v0.1.2-alpha.2` at `0a53fb55bea101816fa226bb964ae2bed71c343b`; this is not a mixed-checkout failure. Alpha.2 moved repository-owned prompt placement behind `SystemPrompt.getSectionOrder(name)`. The official persona consumers use `ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA')`.

## Classification

This is an `implementation_mismatch`. Current STATE already requires the package-owned worker persona to participate in the configured prompt projection and does not require the removed constant or any fixed numeric order. Repairing the realization through the alpha.2 service API preserves intent and does not revise user-visible semantics.

The user's overall satisfaction with the surrounding candidate is feedback, not acceptance of every warm-minimal behavior or a realization lock. Complete browser and request-header observations remain pending.
