import { useMemo, useSyncExternalStore } from 'react'

// Everything is stored on the device first. Signed-in users also sync to Supabase (see sync.js),
// and the account is the source of truth when the two disagree.
export const KEYS = {
  onboarded: 'hercycle.onboarding.complete',
  profile: 'hercycle.profile',
  checkins: 'hercycle.checkins',
  intimacy: 'hercycle.intimacy',
  journey: 'hercycle.journey',
  prefs: 'hercycle.prefs',
  motion: 'hercycle.motion',
  lang: 'hercycle.lang',
  pendingImport: 'hercycle.pendingImport',
}

export const DEFAULT_PREFS = Object.freeze({
  fontSize: 'medium',
  theme: 'light',
  gamification: true,
  showRewards: true,
  celebrate: true,
  notifications: true, // gentle reminders on the home screen; in-app only, no device push
  hideIntimacy: false,
})

export const DEFAULT_PROFILE = Object.freeze({
  lastPeriodStart: null,
  cycleLength: 28,
  periodLength: 5,
  tone: 'balanced',
  phaseSelected: null,
})

export const DEFAULT_JOURNEY = Object.freeze({
  milestones: {}, // key -> ISO timestamp, written once
  intentions: [], // { id, label, status: 'active' | 'paused' }
  quizzes: {}, // lessonId -> { bestPercent, attempts }
  accent: 'berry',
  flags: {}, // private, one-way markers: reflection, reviewedMonth, accentChosen
})

const listeners = new Set()

const notify = () => listeners.forEach((listener) => listener())

const subscribe = (listener) => {
  listeners.add(listener)
  const onStorage = () => listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export const readRaw = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const readJson = (key, fallback) => {
  const raw = readRaw(key)
  if (raw == null) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export const writeRaw = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage can be full or disabled. Callers show the failure in their save state.
    return false
  }
  notify()
  return true
}

export const writeJson = (key, value) => writeRaw(key, JSON.stringify(value))

/** React hook: re-renders when the stored value changes, here or in another tab. */
export function useStoredJson(key, fallback) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null)
  return useMemo(() => {
    if (raw == null) return fallback
    try {
      return JSON.parse(raw) ?? fallback
    } catch {
      return fallback
    }
  }, [raw, fallback])
}

export const getPrefs = () => ({ ...DEFAULT_PREFS, ...readJson(KEYS.prefs, {}) })

export const savePrefs = (patch) => {
  const next = { ...getPrefs(), ...patch }
  return writeJson(KEYS.prefs, next) ? next : null
}

export const getProfile = () => ({ ...DEFAULT_PROFILE, ...readJson(KEYS.profile, {}) })

export const saveProfile = (patch) => {
  const next = { ...getProfile(), ...patch }
  return writeJson(KEYS.profile, next) ? next : null
}

export const getCheckins = () => readJson(KEYS.checkins, {})

export const saveCheckin = (dateKey, entry) => {
  const stamped = { ...entry, updatedAt: new Date().toISOString() }
  writeJson(KEYS.checkins, { ...getCheckins(), [dateKey]: stamped })
  return stamped
}

export const getIntimacy = () => readJson(KEYS.intimacy, {})

export const saveIntimacy = (dateKey, entry) => {
  const stamped = { ...entry, updatedAt: new Date().toISOString() }
  writeJson(KEYS.intimacy, { ...getIntimacy(), [dateKey]: stamped })
  return stamped
}

export const getJourney = () => ({ ...DEFAULT_JOURNEY, ...readJson(KEYS.journey, {}) })

export const updateJourney = (patch) => {
  writeJson(KEYS.journey, { ...getJourney(), ...patch })
  return getJourney()
}

/** Awards a milestone once. Returns true only the first time, so repeat clicks and refreshes give nothing new. */
export const awardMilestone = (key) => {
  const journey = getJourney()
  if (journey.milestones[key]) return false
  updateJourney({ milestones: { ...journey.milestones, [key]: new Date().toISOString() } })
  return true
}

export const isOnboarded = () => readRaw(KEYS.onboarded) === 'true'

export const getMotionOn = () => readRaw(KEYS.motion) !== 'off'

export const setMotionOn = (on) => {
  writeRaw(KEYS.motion, on ? 'on' : 'off')
  applyMotion(on)
}

/** Motion is controlled only by the in-app switch. The OS setting is never read. */
export const applyMotion = (on) => {
  document.documentElement.setAttribute('data-motion', on ? 'on' : 'off')
}

const EMPTY = Object.freeze({})

/** Reactive preferences with defaults applied. */
export const usePrefs = () => {
  const raw = useStoredJson(KEYS.prefs, EMPTY)
  return useMemo(() => ({ ...DEFAULT_PREFS, ...raw }), [raw])
}

export const useProfile = () => {
  const raw = useStoredJson(KEYS.profile, EMPTY)
  return useMemo(() => ({ ...DEFAULT_PROFILE, ...raw }), [raw])
}

export const useCheckins = () => useStoredJson(KEYS.checkins, EMPTY)

export const useIntimacy = () => useStoredJson(KEYS.intimacy, EMPTY)

export const useJourney = () => {
  const raw = useStoredJson(KEYS.journey, EMPTY)
  return useMemo(() => ({ ...DEFAULT_JOURNEY, ...raw }), [raw])
}

export const useMotionOn = () => {
  const raw = useSyncExternalStore(subscribe, () => readRaw(KEYS.motion), () => null)
  return raw !== 'off'
}
