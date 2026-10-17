import { estimatePeriodEndDate, formatPeriodDate, localDateString } from './period'

describe('period date helpers', () => {
  test('formats a date using the local calendar, not a UTC day shift', () => {
    expect(localDateString(new Date(2026, 1, 28, 23, 45))).toBe('2026-02-28')
  })

  test('estimates the inclusive last day across month, leap-year, and year boundaries', () => {
    expect(estimatePeriodEndDate('2026-02-27', 5)).toBe('2026-03-03')
    expect(estimatePeriodEndDate('2024-02-27', 5)).toBe('2024-03-02')
    expect(estimatePeriodEndDate('2025-12-31', 3)).toBe('2026-01-02')
  })

  test('accepts a one-day duration and rejects invalid dates or durations', () => {
    expect(estimatePeriodEndDate('2026-05-18', 1)).toBe('2026-05-18')
    expect(estimatePeriodEndDate('2026-02-31', 5)).toBe('')
    expect(estimatePeriodEndDate('2026-05-18', 0)).toBe('')
    expect(estimatePeriodEndDate('2026-05-18', 11)).toBe('')
    expect(estimatePeriodEndDate('2026-05-18', 2.5)).toBe('')
  })

  test('formats valid calendar dates and leaves invalid dates empty', () => {
    expect(formatPeriodDate('2026-03-03')).not.toBe('')
    expect(formatPeriodDate('2026-02-31')).toBe('')
  })
})
