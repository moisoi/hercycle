import { loadPreferences } from './care'

export const INTRO_SEEN_STORAGE_KEY = 'hercycle.intro.seen'
export const INTRO_LAST_VISIT_STORAGE_KEY = 'hercycle.intro.lastVisitAt'
export const SIX_HOURS_MS = 6 * 60 * 60 * 1000

const readNow = (overrideNow) =>
  typeof overrideNow === 'number' && Number.isFinite(overrideNow) ? overrideNow : Date.now()

/**
 * Checks whether the visitor has seen the sanctuary entrance within the active
 * 6-hour window. Returns `false` for brand-new visitors AND for returning visitors
 * whose last recorded visit was more than 6 hours ago (> 6 * 60 * 60 * 1000 ms).
 * Falls back safely to `true` (calm instant render) if storage throws.
 */
export function hasSeenEntranceIntro({ now } = {}) {
  if (typeof window === 'undefined') return true
  try {
    const seen = window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY) === 'true'
    if (!seen) return false
    const rawLastVisit = window.localStorage.getItem(INTRO_LAST_VISIT_STORAGE_KEY)
    if (rawLastVisit !== null) {
      const parsed = Number(rawLastVisit)
      if (Number.isFinite(parsed) && parsed > 0 && readNow(now) - parsed > SIX_HOURS_MS) {
        return false
      }
    }
    return true
  } catch {
    return true
  }
}

/**
 * Marks the sanctuary entrance choreography as seen and stamps `lastVisitAt`.
 */
export function markEntranceIntroSeen({ now } = {}) {
  if (typeof window === 'undefined') return false
  try {
    const timestamp = String(readNow(now))
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true')
    window.localStorage.setItem(INTRO_LAST_VISIT_STORAGE_KEY, timestamp)
    return true
  } catch {
    return false
  }
}

/**
 * Checks whether an inactive open tab has been away for more than 6 hours,
 * refreshing `lastVisitAt` and returning `true` when the welcome entrance should replay.
 */
export function checkAndRefreshSixHourReturn({ now } = {}) {
  if (typeof window === 'undefined') return false
  try {
    const current = readNow(now)
    const rawLastVisit = window.localStorage.getItem(INTRO_LAST_VISIT_STORAGE_KEY)
    const parsed = rawLastVisit !== null ? Number(rawLastVisit) : NaN
    const expired = Number.isFinite(parsed) && parsed > 0 && current - parsed > SIX_HOURS_MS
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true')
    window.localStorage.setItem(INTRO_LAST_VISIT_STORAGE_KEY, String(current))
    if (expired) {
      cachedSessionFirstVisit = true
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Checks whether reduced motion is requested via either the operating system
 * (`prefers-reduced-motion: reduce`) or HerCycle's in-app preference toggle.
 */
export function prefersCalmMotion() {
  if (typeof window === 'undefined') return true
  try {
    if (loadPreferences().reduceMotion) return true
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return true
    }
  } catch {
    // Ignore matchMedia / storage errors in restricted environments.
  }
  return false
}

// Track within the current JS runtime whether the welcome entrance choreography is active
let cachedSessionFirstVisit = null

export function consumeFirstVisitEntranceFlag({ now } = {}) {
  if (cachedSessionFirstVisit !== null) return cachedSessionFirstVisit
  if (typeof window === 'undefined') {
    cachedSessionFirstVisit = false
    return false
  }
  try {
    const current = readNow(now)
    const alreadySeen = window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY) === 'true'
    const rawLastVisit = window.localStorage.getItem(INTRO_LAST_VISIT_STORAGE_KEY)
    const lastVisit = rawLastVisit !== null ? Number(rawLastVisit) : NaN
    const inactiveOverSixHours =
      Number.isFinite(lastVisit) && lastVisit > 0 && current - lastVisit > SIX_HOURS_MS

    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true')
    window.localStorage.setItem(INTRO_LAST_VISIT_STORAGE_KEY, String(current))

    if (!alreadySeen || inactiveOverSixHours) {
      cachedSessionFirstVisit = true
      return true
    }

    cachedSessionFirstVisit = false
    return false
  } catch {
    // Storage unavailable: keep interface immediately visible without error.
    cachedSessionFirstVisit = false
    return false
  }
}

export function resetFirstVisitEntranceCacheForTests() {
  cachedSessionFirstVisit = null
}

export const CALM_EASE = [0.22, 1, 0.36, 1]

/**
 * Returns non-blocking Framer Motion props for each beat of the sanctuary choreography:
 *  - 'surface': soft luxury atmospheric settle (0ms -> 260ms)
 *  - 'brand': lotus medallion & brand lockup glide (60ms -> 360ms)
 *  - 'content': primary sanctuary canvas lift (130ms -> 460ms)
 *  - 'controls': navigation & top controls reveal (180ms -> 490ms)
 *
 * Repeat visits inside 6 hours skip multi-beat choreography completely; reduced motion
 * collapses all movement to zero translation and an instant calm fade.
 */
export function getEntranceMotionProps(
  stage = 'content',
  { isFirstVisit = false, reducedMotion = false } = {}
) {
  if (!isFirstVisit) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0 },
    }
  }

  if (reducedMotion) {
    return {
      initial: { opacity: 0.94 },
      animate: { opacity: 1 },
      transition: { duration: 0.14, ease: 'easeOut' },
    }
  }

  switch (stage) {
    case 'surface':
      return {
        initial: { opacity: 0.88 },
        animate: { opacity: 1 },
        transition: { duration: 0.26, ease: CALM_EASE },
      }
    case 'brand':
      return {
        initial: { opacity: 0.88, y: 8, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.34, delay: 0.06, ease: CALM_EASE },
      }
    case 'controls':
      return {
        initial: { opacity: 0.88, y: 7 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.32, delay: 0.18, ease: CALM_EASE },
      }
    case 'content':
    default:
      return {
        initial: { opacity: 0.88, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.38, delay: 0.12, ease: CALM_EASE },
      }
  }
}
