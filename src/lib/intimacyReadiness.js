// How the Intimacy inputs shape tonight's guidance. Pure, so every rule is tested without rendering.
// Inputs: the openness light, the comfort level ("How open do you feel today?", 1 to 10), and desire.
// Outputs: which readiness message to show, how many ideas are offered, the default partner message
// tone, and a libido note at the extremes.
//
// The partner composer is available for all three lights. Comfort and light change the wording and
// the default message, but they never hide the composer, so the user always has the option.

export const TRAFFIC_LIGHTS = ['green', 'yellow', 'red']

export const comfortBand = (comfort) => {
  const value = Number(comfort)
  if (!Number.isFinite(value)) return 'open'
  if (value <= 3) return 'gentle'
  if (value >= 8) return 'open-plus'
  return 'open'
}

const SUGGESTIONS_BY_BAND = { gentle: 2, open: 3, 'open-plus': 4 }

const LIBIDO_NOTES = {
  1: 'intimacyLibidoLowNote',
  10: 'intimacyLibidoHighNote',
}

/**
 * Returns the state the Intimacy screen renders.
 * `id` selects the translated readiness line and the default partner message.
 */
export const readinessFor = ({ trafficLight = null, comfort = 5, libido = 5 } = {}) => {
  const band = comfortBand(comfort)
  const libidoNoteKey = LIBIDO_NOTES[Number(libido)] || null

  if (trafficLight === 'red') {
    return { id: 'pause', tone: 'red', suggestionCount: 1, libidoNoteKey }
  }
  if (trafficLight === 'yellow') {
    return { id: 'slow', tone: 'yellow', suggestionCount: Math.min(2, SUGGESTIONS_BY_BAND[band]), libidoNoteKey }
  }
  if (trafficLight === 'green') {
    return { id: band, tone: 'green', suggestionCount: SUGGESTIONS_BY_BAND[band], libidoNoteKey }
  }
  return { id: 'unset', tone: 'neutral', suggestionCount: SUGGESTIONS_BY_BAND[band], libidoNoteKey }
}
