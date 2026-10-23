import {
  cycleDayFor,
  estimatePeriodEndDate,
  filterCyclesByRange,
  formatDisplayDate,
  formatPeriodDate,
  localDateString,
} from './period'

describe('period date & cycle helpers', () => {
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

  test('formats valid calendar dates in English and Amharic without fallback crash', () => {
    expect(formatPeriodDate('2026-03-03')).not.toBe('')
    expect(formatPeriodDate('2026-03-03', {}, 'am')).toContain('3')
    expect(formatDisplayDate('2026-10-21', 'am')).toContain('21')
    expect(formatPeriodDate('2026-02-31')).toBe('')
  })

  test('cycleDayFor calculates 1-indexed cycle days accurately across strings, objects, and arrays', () => {
    expect(cycleDayFor('2026-10-10', '2026-10-10')).toBe(1)
    expect(cycleDayFor('2026-10-10', '2026-10-21')).toBe(12)
    expect(
      cycleDayFor(
        [
          { date: '2026-09-02', period_start_date: '2026-09-02' },
          { date: '2026-10-08', period_start_date: '2026-10-08' },
        ],
        '2026-10-21'
      )
    ).toBe(14)

    // Future period start or stale >120 day start returns null cleanly
    expect(cycleDayFor('2026-10-25', '2026-10-21')).toBeNull()
    expect(cycleDayFor('2026-01-01', '2026-10-21')).toBeNull()
    expect(cycleDayFor('', '2026-10-21')).toBeNull()
  })

  test('filterCyclesByRange filters entries accurately for 7d, 14d, 30d, and all', () => {
    const records = [
      { id: 1, date: '2026-08-01', mood: 5 },
      { id: 2, date: '2026-10-05', mood: 6 },
      { id: 3, date: '2026-10-18', mood: 8 },
      { id: 4, date: '2026-10-21', mood: 9 },
    ]
    expect(filterCyclesByRange(records, '7d', '2026-10-21').map((r) => r.id)).toEqual([3, 4])
    expect(filterCyclesByRange(records, '30d', '2026-10-21').map((r) => r.id)).toEqual([2, 3, 4])
    expect(filterCyclesByRange(records, 'all', '2026-10-21')).toHaveLength(4)
  })
})
