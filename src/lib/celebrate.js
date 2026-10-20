// Celebrations are fire-and-forget events. The CelebrationLayer listens and decides what to show.
//
// Kinds:
//  - feedback (card bursts): 'burst', 'claim', 'progress', 'vibe'. Always shown when motion is on.
//  - rewards (full screen): 'milestone', 'stage', 'level'. Gated by the Settings preferences
//    `gamification`, `showRewards`, and `celebrate`.
//
// Motion is controlled only by the in-app switch (hercycle.motion), never by the OS setting.

export const CELEBRATE_EVENT = 'hercycle:celebrate'

export const REWARD_KINDS = ['milestone', 'stage', 'level']
export const FEEDBACK_KINDS = ['burst', 'claim', 'progress', 'vibe']

export function celebrate(kind, detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CELEBRATE_EVENT, { detail: { kind, ...detail } }))
}

/** Decides whether an event should render. Pure, so it can be unit tested. */
export function shouldCelebrate(kind, { motionOn, prefs }) {
  if (!motionOn) return false
  if (FEEDBACK_KINDS.includes(kind)) return true
  if (REWARD_KINDS.includes(kind)) {
    return Boolean(prefs?.gamification && prefs?.showRewards && prefs?.celebrate)
  }
  return false
}

const STAGE_KEY = 'hercycle.stagesSeen'

/**
 * Stage-up celebrations play once per stage per browser session, so revisiting the garden
 * does not replay them. Returns true the first time a stage is seen this session.
 */
export function markStageSeen(stageId) {
  try {
    const seen = JSON.parse(window.sessionStorage.getItem(STAGE_KEY) || '[]')
    if (seen.includes(stageId)) return false
    window.sessionStorage.setItem(STAGE_KEY, JSON.stringify([...seen, stageId]))
    return true
  } catch {
    return false
  }
}
