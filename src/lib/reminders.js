// Reminder rotation. The UI owns timing and fades; this module only decides what comes next.

export const REMINDER_INTERVAL_MS = 5000
export const FADE_OUT_MS = 650
export const FADE_IN_MS = 900

/** Phase-specific lines come first, then mood-specific, then the general pool. Duplicates and blanks are dropped. */
export function buildRotation({ general = [], phaseSpecific = [], moodSpecific = [] } = {}) {
  const seen = new Set()
  const lines = []
  for (const line of [...phaseSpecific, ...moodSpecific, ...general]) {
    const text = typeof line === 'string' ? line.trim() : ''
    if (!text || seen.has(text)) continue
    seen.add(text)
    lines.push(text)
  }
  return lines
}

export const nextIndex = (index, length) => (length > 0 ? (index + 1) % length : 0)

/** Maps a mood score (1 to 10) to a mood family used to pick reminder lines. */
export const moodFamily = (mood) => {
  if (!Number.isFinite(mood)) return 'neutral'
  if (mood <= 4) return 'low'
  if (mood >= 7) return 'high'
  return 'neutral'
}
