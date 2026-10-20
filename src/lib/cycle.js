import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'

export const PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal']

export const DEFAULT_PROFILE = Object.freeze({
  onboarded: false,
  lastPeriodStart: null, // 'yyyy-MM-dd'
  cycleLength: 28,
  periodLength: 5,
  tone: 'balanced',
  fontSize: 'medium',
})

const clamp = (value, min, max, fallback) => {
  const number = Math.round(Number(value))
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

export const normalizeCycleLength = (value) => clamp(value, 21, 40, 28)
export const normalizePeriodLength = (value) => clamp(value, 2, 10, 5)

const asDay = (value) => (value instanceof Date ? startOfDay(value) : startOfDay(parseISO(value)))

export const toDateKey = (date) => format(startOfDay(date), 'yyyy-MM-dd')

/**
 * Day of the cycle (1-based) for `today`, given the start of the last period.
 * Returns null when there is no start date or the date is before it.
 */
export function cycleDayFor(today, lastPeriodStart, cycleLength = 28) {
  if (!lastPeriodStart) return null
  const diff = differenceInCalendarDays(asDay(today), asDay(lastPeriodStart))
  if (diff < 0) return null
  return (diff % normalizeCycleLength(cycleLength)) + 1
}

/** Ovulation is estimated as 14 days before the next period starts. */
export function ovulationDayFor(cycleLength = 28) {
  return normalizeCycleLength(cycleLength) - 14
}

export function phaseFor(day, { cycleLength = 28, periodLength = 5 } = {}) {
  if (day == null) return null
  const ovulation = ovulationDayFor(cycleLength)
  if (day <= normalizePeriodLength(periodLength)) return 'menstrual'
  if (day >= ovulation - 1 && day <= ovulation + 1) return 'ovulatory'
  if (day < ovulation - 1) return 'follicular'
  return 'luteal'
}

/**
 * A compact, privacy-minimal summary used to personalise Luna's replies.
 * It never includes intimacy logs, and notes are never copied in.
 */
export function buildLunaProfile({ profile, checkins = {}, intentions = [], today = new Date() }) {
  const cycleLength = normalizeCycleLength(profile?.cycleLength)
  const periodLength = normalizePeriodLength(profile?.periodLength)
  const day = cycleDayFor(today, profile?.lastPeriodStart, cycleLength)
  const phase = phaseFor(day, { cycleLength, periodLength })

  const dates = Object.keys(checkins).sort()
  const lastKey = dates[dates.length - 1] ?? null
  const last = lastKey ? checkins[lastKey] : null

  const recent = dates.slice(-7).map((key) => checkins[key])
  const average = (field) => {
    const values = recent.map((entry) => entry?.[field]).filter((value) => Number.isFinite(value))
    if (!values.length) return null
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
  }

  return {
    phase,
    day,
    cycleLength,
    periodLength,
    tone: profile?.tone || 'balanced',
    daysLogged: dates.length,
    lastCheckIn: lastKey,
    lastMood: Number.isFinite(last?.mood) ? last.mood : null,
    averageMood: average('mood'),
    averageEnergy: average('energy'),
    activeIntentions: intentions.filter((item) => item.status === 'active').map((item) => item.label),
  }
}
