export const localDateString = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const estimatePeriodEndDate = (startDate, duration) => {
  const days = Number(duration)
  const endDate = parseLocalDate(startDate)
  if (!endDate || !Number.isInteger(days) || days < 1 || days > 10) return ''

  endDate.setDate(endDate.getDate() + days - 1)
  return localDateString(endDate)
}

export const formatPeriodDate = (dateString, options = {}) => {
  const date = parseLocalDate(dateString)
  if (!date) return ''
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(date)
}

const parseLocalDate = (dateString) => {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null
  const date = new Date(`${dateString}T12:00:00`)
  return Number.isFinite(date.getTime()) && localDateString(date) === dateString ? date : null
}
