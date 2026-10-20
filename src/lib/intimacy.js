// Intimacy readiness. Openness and comfort change what the screen offers. Nothing here reads the
// cycle phase: consent is never inferred from where someone is in their cycle.

export const OPENNESS = ['open', 'maybe', 'pause']
export const VIBES = ['tender', 'playful', 'bold']

export const comfortBand = (comfort) => {
  const value = Number(comfort)
  if (value <= 3) return 'gentle'
  if (value >= 8) return 'bold'
  return 'steady'
}

/**
 * The plan the screen renders. `ideaCount` and `band` decide how many ideas show and which set
 * they come from. The partner composer is always available, whatever the plan.
 */
export function planFor({ openness, comfort, vibe } = {}) {
  const band = comfortBand(comfort)
  const state = OPENNESS.includes(openness) ? openness : 'unset'
  let ideaCount
  if (state === 'pause') ideaCount = 2
  else if (state === 'maybe') ideaCount = band === 'gentle' ? 1 : 2
  else if (state === 'open') ideaCount = band === 'gentle' ? 2 : band === 'steady' ? 3 : 4
  else ideaCount = 2
  return {
    openness: state,
    band,
    vibe: VIBES.includes(vibe) ? vibe : 'tender',
    ideaCount,
    ideaSet: state === 'pause' ? 'pause' : band,
  }
}

export const messageKeyFor = (plan) => `${plan.vibe}.${plan.openness === 'unset' ? 'open' : plan.openness}`
