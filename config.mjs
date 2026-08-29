/** Post-bootstrap visibility assignment for one model input. */
export const ASSIGNMENTS = Object.freeze(['parent-only', 'child-only', 'shared'])

export const TOOL_SCHEMA_ID_PREFIX = 'tool-schema:v1:'
const MAX_TOOL_SOURCE_LENGTH = 4096
const MAX_TOOL_NAME_LENGTH = 256

export const DEFAULT_BOOTSTRAP_MESSAGE = '检查当前工作目录，确认后仅回复 Ready.'
export const DEFAULT_GUIDANCE = 'Delegated agents have broader tools. Own local inspection, integration, coordination, and user interaction.'

/** Composition baseline passed below the settings provider's user section. */
export const DEFAULT_CONFIG = Object.freeze({
  bootstrapEnabled: true,
  bootstrapMessage: DEFAULT_BOOTSTRAP_MESSAGE,
  guidance: DEFAULT_GUIDANCE,
  promptAssignments: Object.freeze({}),
  toolAssignments: Object.freeze({}),
})

/** Resolve an identity through saved config, package roster, then the closed default. */
export function assignmentFor(id, saved, roster) {
  return saved[id] ?? roster.get(id) ?? 'child-only'
}

/** Create the canonical opaque identity for one provider-owned tool schema. */
export function makeToolSchemaId(source, name) {
  assertIdentityPart('source', source, MAX_TOOL_SOURCE_LENGTH)
  assertIdentityPart('name', name, MAX_TOOL_NAME_LENGTH)
  const bytes = new TextEncoder().encode(JSON.stringify([source, name]))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `${TOOL_SCHEMA_ID_PREFIX}${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')}`
}

/** Decode and verify one canonical tool-schema identity. */
export function parseToolSchemaId(id) {
  try {
    if (typeof id !== 'string' || !id.startsWith(TOOL_SCHEMA_ID_PREFIX)) throw new TypeError()
    const encoded = id.slice(TOOL_SCHEMA_ID_PREFIX.length)
    if (encoded.length === 0 || !/^[A-Za-z0-9_-]+$/u.test(encoded)) throw new TypeError()
    const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    const tuple = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!Array.isArray(tuple) || tuple.length !== 2) throw new TypeError()
    const [source, name] = tuple
    if (makeToolSchemaId(source, name) !== id) throw new TypeError()
    return { source, name }
  } catch {
    throw new TypeError(`dsh-warm-minimal: invalid tool schema id ${JSON.stringify(id)}`)
  }
}

/** Reject legacy source-keyed or malformed tool assignment maps. */
export function validateToolAssignmentMap(assignments) {
  if (typeof assignments !== 'object' || assignments === null || Array.isArray(assignments)) {
    throw new TypeError('dsh-warm-minimal: toolAssignments must be an object')
  }
  for (const [id, assignment] of Object.entries(assignments)) {
    parseToolSchemaId(id)
    if (!ASSIGNMENTS.includes(assignment)) {
      throw new TypeError(`dsh-warm-minimal: invalid tool assignment for ${JSON.stringify(id)}`)
    }
  }
  return assignments
}

function assertIdentityPart(label, value, maximum) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximum || !value.isWellFormed()) {
    throw new TypeError(`dsh-warm-minimal: tool schema ${label} must contain 1-${maximum} characters`)
  }
}
