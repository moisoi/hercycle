import { DEFAULT_PROFILE, normalizeCycleLength, normalizePeriodLength } from './cycle'
import { KEYS, readJson, writeJson } from './store'

export const DEFAULT_PREFS = Object.freeze({
  gamification: true, // Journey and milestones on or off
  showRewards: true, // show milestone and stage celebrations
  celebrate: true, // full-screen celebrations
  hideIntimacy: false, // hide the Intimacy tab from navigation
})

export const DEFAULT_JOURNEY = Object.freeze({
  milestones: {}, // key -> ISO date awarded (each key appears once)
  intentions: [], // { id, label, status: 'active' | 'paused' }
  quizzes: {}, // lessonId -> { attempts, best, updatedAt }
  accent: 'berry',
})

const EMPTY_OBJECT = Object.freeze({})
const EMPTY_LIST = Object.freeze([])

export const getProfile = () => ({ ...DEFAULT_PROFILE, ...readJson(KEYS.profile, EMPTY_OBJECT) })

export function saveProfile(patch) {
  const next = { ...getProfile(), ...patch }
  next.cycleLength = normalizeCycleLength(next.cycleLength)
  next.periodLength = normalizePeriodLength(next.periodLength)
  writeJson(KEYS.profile, next)
  return next
}

export const getCheckins = () => readJson(KEYS.checkins, EMPTY_OBJECT)

export function saveCheckin(dateKey, entry) {
  const all = getCheckins()
  writeJson(KEYS.checkins, { ...all, [dateKey]: { ...all[dateKey], ...entry, updatedAt: new Date().toISOString() } })
}

export const getIntimacy = () => readJson(KEYS.intimacy, EMPTY_OBJECT)

export function saveIntimacyLog(dateKey, entry) {
  const all = getIntimacy()
  writeJson(KEYS.intimacy, { ...all, [dateKey]: { ...entry, updatedAt: new Date().toISOString() } })
}

export const getPrefs = () => ({ ...DEFAULT_PREFS, ...readJson(KEYS.prefs, EMPTY_OBJECT) })

export function savePrefs(patch) {
  writeJson(KEYS.prefs, { ...getPrefs(), ...patch })
}

export const getJourney = () => ({ ...DEFAULT_JOURNEY, ...readJson(KEYS.journey, EMPTY_OBJECT) })

function writeJourney(patch) {
  writeJson(KEYS.journey, { ...getJourney(), ...patch })
}

/**
 * Records a milestone. Returns true only the first time, so repeated clicks, refreshes, or
 * a second device cannot award it twice.
 */
export function awardMilestone(key) {
  const journey = getJourney()
  if (journey.milestones[key]) return false
  writeJourney({ milestones: { ...journey.milestones, [key]: new Date().toISOString() } })
  return true
}

export function setIntentions(intentions) {
  writeJourney({ intentions })
}

export function recordQuiz(lessonId, { correct, total }) {
  const journey = getJourney()
  const previous = journey.quizzes[lessonId] || { attempts: 0, best: 0 }
  const score = total ? Math.round((correct / total) * 100) : 0
  writeJourney({
    quizzes: {
      ...journey.quizzes,
      [lessonId]: { attempts: previous.attempts + 1, best: Math.max(previous.best, score), updatedAt: new Date().toISOString() },
    },
  })
}

export const getLanguage = () => {
  try {
    return window.localStorage.getItem(KEYS.lang) === 'am' ? 'am' : 'en'
  } catch {
    return 'en'
  }
}

export const hasMotion = () => {
  try {
    return window.localStorage.getItem(KEYS.motion) !== 'off'
  } catch {
    return true
  }
}

export { EMPTY_LIST }
