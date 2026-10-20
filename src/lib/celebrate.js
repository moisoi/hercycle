import { useCallback, useState } from 'react'
import { getMotionOn, getPrefs } from './store'

export const CELEBRATE_EVENT = 'hercycle:celebrate'

// Full-screen moments are rewards. Card bursts are feedback. They are controlled separately.
export const REWARD_KINDS = ['milestone', 'stage', 'level']
export const FEEDBACK_KINDS = ['burst', 'claim', 'progress', 'vibe']

const STAGE_SEEN_PREFIX = 'hercycle.stageSeen.'

const readSession = (key) => {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSession = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Session storage can be disabled. The stage-up may then replay, which is harmless.
  }
}

/**
 * Whether a celebration may play. Motion off skips everything. Rewards need gamification and
 * "show rewards". Feedback needs "celebrate". Stage-up plays once per stage per session.
 */
export function celebrationAllowed(kind, detail = {}, prefs = getPrefs(), motionOn = getMotionOn()) {
  if (!motionOn) return false
  if (REWARD_KINDS.includes(kind)) {
    if (!prefs.gamification || !prefs.showRewards) return false
    if (kind === 'stage' && detail.stage) {
      if (readSession(`${STAGE_SEEN_PREFIX}${detail.stage}`)) return false
    }
    return true
  }
  if (FEEDBACK_KINDS.includes(kind)) return Boolean(prefs.celebrate)
  return false
}

/** Dispatches a celebration. Returns true when one was shown, so callers can skip extra effects. */
export function celebrate(kind, detail = {}) {
  if (!celebrationAllowed(kind, detail)) return false
  if (kind === 'stage' && detail.stage) writeSession(`${STAGE_SEEN_PREFIX}${detail.stage}`, '1')
  window.dispatchEvent(new CustomEvent(CELEBRATE_EVENT, { detail: { kind, ...detail } }))
  return true
}

/** Card-level feedback. Returns a key that changes on each fire, so the burst animation replays. */
export function useBurst() {
  const [key, setKey] = useState(0)
  const fire = useCallback((kind = 'burst') => {
    if (!celebrationAllowed(kind)) return
    setKey((value) => value + 1)
  }, [])
  return [key, fire]
}
