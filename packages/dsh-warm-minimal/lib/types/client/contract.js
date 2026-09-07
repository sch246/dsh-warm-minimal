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
        || !isToolAssignments(candidate.toolAssignments))
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
/** @returns whether a wire string is one canonical v1 tool-schema identity. */
export function isToolSchemaId(value) {
    try {
        const prefix = 'tool-schema:v1:';
        if (!value.startsWith(prefix))
            return false;
        const encoded = value.slice(prefix.length);
        if (encoded.length === 0 || !/^[A-Za-z0-9_-]+$/u.test(encoded))
            return false;
        const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4);
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        const tuple = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        if (!Array.isArray(tuple) || tuple.length !== 2)
            return false;
        const [source, name] = tuple;
        if (typeof source !== 'string' || source.length === 0 || source.length > 4096 || !source.isWellFormed())
            return false;
        if (typeof name !== 'string' || name.length === 0 || name.length > 256 || !name.isWellFormed())
            return false;
        const canonicalBytes = new TextEncoder().encode(JSON.stringify([source, name]));
        let canonicalBinary = '';
        for (const byte of canonicalBytes)
            canonicalBinary += String.fromCharCode(byte);
        const canonical = btoa(canonicalBinary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
        return encoded === canonical;
    }
    catch {
        return false;
    }
}
function isAssignments(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return false;
    return Object.values(value).every(entry => typeof entry === 'string' && isSourceAssignment(entry));
}
function isToolAssignments(value) {
    if (!isAssignments(value))
        return false;
    return Object.keys(value).every(isToolSchemaId);
}
//# sourceMappingURL=contract.js.map