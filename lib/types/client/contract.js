/** Client-owned view types for the warm-minimal Plugins card. */
/** Narrow a settings mirror value beyond its serialized Host schema. */
export function decodeWarmMinimalSettings(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return undefined;
    const candidate = value;
    if (typeof candidate.bootstrapEnabled !== 'boolean'
        || typeof candidate.bootstrapMessage !== 'string'
        || typeof candidate.guidance !== 'string'
        || !isAssignments(candidate.promptAssignments)
        || !isAssignments(candidate.toolAssignments))
        return undefined;
    return {
        bootstrapEnabled: candidate.bootstrapEnabled,
        bootstrapMessage: candidate.bootstrapMessage,
        guidance: candidate.guidance,
        promptAssignments: { ...candidate.promptAssignments },
        toolAssignments: { ...candidate.toolAssignments },
    };
}
/** @returns whether a browser select value is a supported source assignment. */
export function isSourceAssignment(value) {
    return value === 'parent-only' || value === 'child-only' || value === 'shared';
}
function isAssignments(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return false;
    return Object.values(value).every(entry => typeof entry === 'string' && isSourceAssignment(entry));
}
//# sourceMappingURL=contract.js.map