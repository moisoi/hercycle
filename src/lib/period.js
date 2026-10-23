import { addDays, differenceInCalendarDays, format, isValid, subDays } from 'date-fns'

const AMHARIC_MONTHS_LONG = [
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
]

const AMHARIC_GREGORIAN_MONTHS = [
  'ጃንዋሪ',
  'ፌብሩዋሪ',
  'ማርች',
  'ኤፕሪል',
  'ሜይ',
  'ጁን',
  'ጁላይ',
  'ኦገስት',
  'ሴፕቴምበር',
  'ኦክቶበር',
  'ኖቬምበር',
  'ዲሴምበር',
]

const AMHARIC_WEEKDAYS_LONG = [
  'እሑድ',
  'ሰኞ',
  'ማክሰኞ',
  'ረቡዕ',
  'ሐሙስ',
  'ዓርብ',
  'ቅዳሜ',
]

const AMHARIC_WEEKDAYS_SHORT = [
  'እሑድ',
  'ሰኞ',
  'ማክሰ',
  'ረቡዕ',
  'ሐሙስ',
  'ዓርብ',
  'ቅዳሜ',
]

export const localDateString = (date = new Date()) => {
  if (!(date instanceof Date) || !isValid(date)) return ''
  return format(date, 'yyyy-MM-dd')
}

export const getTodayIsoDate = localDateString

export const parseLocalDate = (dateString) => {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null
  const date = new Date(`${dateString}T12:00:00`)
  return isValid(date) && localDateString(date) === dateString ? date : null
}

export const estimatePeriodEndDate = (startDate, duration) => {
  const days = Number(duration)
  const parsedStart = parseLocalDate(startDate)
  if (!parsedStart || !Number.isInteger(days) || days < 1 || days > 10) return ''
  return localDateString(addDays(parsedStart, days - 1))
}

/**
 * Calculates the 1-indexed cycle day given the last logged period start date
 * and a reference date. Returns null if dates are missing, invalid, or in the
 * future relative to targetDate, or beyond a plausible single-cycle span (>120d).
 */
export const cycleDayFor = (periodStartDate, targetDate = localDateString()) => {
  let startSource = periodStartDate
  if (Array.isArray(periodStartDate)) {
    const candidates = periodStartDate
      .map((entry) => (typeof entry === 'string' ? entry : entry?.period_start_date))
      .filter((value) => parseLocalDate(value) && value <= targetDate)
      .sort()
    startSource = candidates[candidates.length - 1] || null
  } else if (periodStartDate && typeof periodStartDate === 'object') {
    startSource = periodStartDate.lastPeriodStartDate || periodStartDate.period_start_date || null
  }

  const start = parseLocalDate(startSource)
  const target = parseLocalDate(targetDate)
  if (!start || !target) return null

  const diff = differenceInCalendarDays(target, start)
  if (diff < 0 || diff >= 120) return null
  return diff + 1
}

export const formatPeriodDate = (dateString, options = {}, locale = 'en') => {
  const date = parseLocalDate(dateString)
  if (!date) return ''

  const lang = String(locale || '').toLowerCase()
  if (lang.startsWith('am')) {
    const includeWeekday = options.weekday !== undefined ? Boolean(options.weekday) : true
    const shortWeekday = options.weekday === 'short'
    const weekday = includeWeekday
      ? `${(shortWeekday ? AMHARIC_WEEKDAYS_SHORT : AMHARIC_WEEKDAYS_LONG)[date.getDay()]}፣ `
      : ''
    const monthName = AMHARIC_GREGORIAN_MONTHS[date.getMonth()] || AMHARIC_MONTHS_LONG[date.getMonth()]
    const yearSuffix = options.year ? ` ${date.getFullYear()}` : ''
    return `${weekday}${monthName} ${date.getDate()}${yearSuffix}`
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(date)
}

export const formatDisplayDate = (dateInput = new Date(), optionsOrLocale = {}, maybeLocale = 'en') => {
  const options = typeof optionsOrLocale === 'string' ? {} : (optionsOrLocale || {})
  const locale = typeof optionsOrLocale === 'string' ? optionsOrLocale : maybeLocale
  const { includeWeekday = false, short = false, includeYear = false } = options
  const date = dateInput instanceof Date ? dateInput : parseLocalDate(String(dateInput || ''))
  if (!date || !isValid(date)) return ''

  const lang = String(locale || '').toLowerCase()
  if (lang.startsWith('am')) {
    const weekdayPart = includeWeekday
      ? `${(short ? AMHARIC_WEEKDAYS_SHORT : AMHARIC_WEEKDAYS_LONG)[date.getDay()]}፣ `
      : ''
    const monthPart = AMHARIC_GREGORIAN_MONTHS[date.getMonth()]
    const yearPart = includeYear ? ` ${date.getFullYear()}` : ''
    return `${weekdayPart}${monthPart} ${date.getDate()}${yearPart}`
  }

  return new Intl.DateTimeFormat('en-US', {
    ...(includeWeekday ? { weekday: short ? 'short' : 'long' } : {}),
    month: short ? 'short' : 'long',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date)
}

export const formatShortDate = (dateInput, locale = 'en') =>
  formatDisplayDate(dateInput, { short: true }, locale)

export const averageCycleLength = (records = []) => {
  if (!Array.isArray(records) || records.length < 2) return null
  const uniqueStarts = [
    ...new Set(
      records
        .map((entry) => entry?.period_start_date)
        .filter((value) => Boolean(parseLocalDate(value)))
    ),
  ].sort()

  if (uniqueStarts.length < 2) return null
  const diffs = []
  for (let i = 1; i < uniqueStarts.length; i += 1) {
    const span = differenceInCalendarDays(
      parseLocalDate(uniqueStarts[i]),
      parseLocalDate(uniqueStarts[i - 1])
    )
    if (span >= 18 && span <= 60) diffs.push(span)
  }
  if (!diffs.length) return null
  return Math.round(diffs.reduce((sum, val) => sum + val, 0) / diffs.length)
}

export const filterCyclesByRange = (records = [], range = '14d', referenceDate = localDateString()) => {
  const sorted = [...records]
    .filter((entry) => entry && parseLocalDate(entry.date))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))

  if (range === 'all') return sorted
  const daysMap = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }
  const span = daysMap[range] || 14
  const anchor = parseLocalDate(referenceDate) || new Date()
  const cutoff = localDateString(subDays(anchor, span - 1))
  return sorted.filter((entry) => entry.date >= cutoff && entry.date <= localDateString(anchor))
}
