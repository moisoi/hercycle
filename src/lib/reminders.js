export const REMINDER_INTERVAL_MS = 5000

/**
 * Builds the rotation for a reminder: messages tailored to the current phase come first,
 * followed by the general pool. Duplicates and blank lines are removed.
 */
export function buildRotation({ general = [], phaseSpecific = [] } = {}) {
  const seen = new Set()
  const out = []
  for (const line of [...phaseSpecific, ...general]) {
    const text = typeof line === 'string' ? line.trim() : ''
    if (text && !seen.has(text)) {
      seen.add(text)
      out.push(text)
    }
  }
  return out
}

export const nextIndex = (index, length) => (length > 0 ? (index + 1) % length : 0)
