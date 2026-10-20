// Pure cycle maths. No storage, no network. Dates are local calendar days.

export const PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal']

const DAY_MS = 24 * 60 * 60 * 1000
const pad = (value) => String(value).padStart(2, '0')

/** Parses a YYYY-MM-DD key into a local Date, or null when the key is not a real calendar day. */
export const parseDateKey = (key) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key))) return null
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

/** Formats a Date (or current date) as a local YYYY-MM-DD key. */
export const toDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : parseDateKey(value)
  if (!date) return null
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const toDate = (value) => (value instanceof Date ? value : parseDateKey(value))

// Whole days between two local calendar days, immune to daylight-saving shifts.
const wholeDaysBetween = (from, to) => {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / DAY_MS)
}

export const clampInt = (value, min, max, fallback) => {
  const number = Math.round(Number(value))
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

export const normalizeCycleLength = (value) => clampInt(value, 21, 40, 28)
export const normalizePeriodLength = (value) => clampInt(value, 2, 10, 5)

/**
 * Cycle day, 1-based, for `today` given the most recent period start. Wraps after each cycle
 * length. Returns null when there is no start date or today is before it.
 */
export function cycleDayFor(today, lastPeriodStart, cycleLength = 28) {
  const now = toDate(today)
  const start = toDate(lastPeriodStart)
  if (!now || !start) return null
  const elapsed = wholeDaysBetween(start, now)
  if (elapsed < 0) return null
  return (elapsed % normalizeCycleLength(cycleLength)) + 1
}

export const ovulationDayFor = (cycleLength = 28) => normalizeCycleLength(cycleLength) - 14

/** Phase for a cycle day. Menstrual wins first, then ovulatory (ovulation day ±1), then follicular and luteal. */
export function phaseFor(day, { cycleLength = 28, periodLength = 5 } = {}) {
  if (!Number.isFinite(day) || day < 1) return null
  const length = normalizeCycleLength(cycleLength)
  if (day <= normalizePeriodLength(periodLength)) return 'menstrual'
  const ovulation = ovulationDayFor(length)
  if (day >= ovulation - 1 && day <= ovulation + 1) return 'ovulatory'
  return day < ovulation - 1 ? 'follicular' : 'luteal'
}

const average = (values) => {
  const numbers = values.filter(Number.isFinite)
  if (!numbers.length) return null
  return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10
}

/**
 * Context Luna may use. It contains only the cycle position, averages of mood and energy, and
 * the names of active intentions. Notes and intimacy logs are never included.
 */
export function buildLunaProfile({ profile = {}, checkins = {}, intentions = [], today = new Date() } = {}) {
  const cycleLength = normalizeCycleLength(profile.cycleLength)
  const periodLength = normalizePeriodLength(profile.periodLength)
  const day = cycleDayFor(today, profile.lastPeriodStart, cycleLength)
  const keys = Object.keys(checkins).filter((key) => parseDateKey(key)).sort()
  const recent = keys.slice(-7).map((key) => checkins[key] || {})
  const last = keys.length ? keys[keys.length - 1] : null

  return {
    phase: phaseFor(day, { cycleLength, periodLength }),
    day,
    cycleLength,
    periodLength,
    tone: profile.tone || 'balanced',
    daysLogged: keys.length,
    lastCheckIn: last,
    lastMood: last ? checkins[last]?.mood ?? null : null,
    averageMood: average(recent.map((entry) => entry.mood)),
    averageEnergy: average(recent.map((entry) => entry.energy)),
    intentions: intentions.filter((item) => item.status !== 'removed').map((item) => item.label),
  }
}
