// How this screen's inputs shape tonight's guidance. Pure functions, so every rule is tested
// without rendering. Inputs: the openness light ("How open do you feel today?"), the comfort level,
// and libido. Outputs drive what the screen shows, how many ideas are offered, and whether the partner
// composer can be turned on.

export const TRAFFIC_LIGHTS = ['green', 'yellow', 'red']

// Comfort is stored as 1, 3, or 5 (low, moderate, high).
const comfortBand = (comfort) => {
  if (comfort <= 1) return 'gentle'
  if (comfort >= 5) return 'open-plus'
  return 'open'
}

const SUGGESTIONS_BY_COMFORT = { gentle: 2, open: 3, 'open-plus': 4 }

const LIBIDO_NOTES = {
  1: { key: 'intimacyLibidoLowNote', text: 'Low desire is valid. Closeness and talking count too.' },
  10: { key: 'intimacyLibidoHighNote', text: 'High desire today. Put it into words only if you choose.' },
}

export const readinessFor = ({ trafficLight = null, comfort = 3, libido = 5 } = {}) => {
  const band = comfortBand(Number(comfort) || 3)
  const libidoNote = LIBIDO_NOTES[Number(libido)] || null

  if (trafficLight === 'red') {
    return {
      id: 'pause',
      tone: 'red',
      partnerAllowed: false,
      suggestionCount: 1,
      messageKey: 'intimacyReadinessPause',
      message: 'Not tonight. Nothing is shared, and you can change this at any time.',
      libidoNote,
    }
  }

  if (trafficLight === 'yellow') {
    // Yellow with low comfort keeps the partner composer closed, because the two signals disagree.
    const partnerAllowed = band !== 'gentle'
    return {
      id: 'slow',
      tone: 'yellow',
      partnerAllowed,
      suggestionCount: Math.min(2, SUGGESTIONS_BY_COMFORT[band]),
      messageKey: partnerAllowed ? 'intimacyReadinessSlow' : 'intimacyReadinessSlowKeepPrivate',
      message: partnerAllowed
        ? 'Go slowly. Check in before each step, and keep the option to stop.'
        : 'Slow and low comfort: keep this to yourself for now.',
      libidoNote,
    }
  }

  if (trafficLight === 'green') {
    const messages = {
      gentle: 'Keep it gentle: closeness, talking, and no pressure.',
      open: 'Open today. Go at a pace you both agree on.',
      'open-plus': 'Wide open. Still check in as you go, and stop whenever you like.',
    }
    return {
      id: band,
      tone: 'green',
      partnerAllowed: true,
      suggestionCount: SUGGESTIONS_BY_COMFORT[band],
      messageKey: `intimacyReadiness_${band.replace('-', '_')}`,
      message: messages[band],
      libidoNote,
    }
  }

  // No light chosen yet: the comfort level still shapes how many ideas are offered.
  return {
    id: 'unset',
    tone: 'neutral',
    partnerAllowed: true,
    suggestionCount: SUGGESTIONS_BY_COMFORT[band],
    messageKey: 'intimacyReadinessUnset',
    message: "Pick a light above to shape tonight's guidance.",
    libidoNote,
  }
}
