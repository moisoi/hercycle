import { buildLunaProfile, cycleDayFor, phaseFor, ovulationDayFor, toDateKey } from './cycle'

describe('cycleDayFor', () => {
  test('day 1 is the start date itself', () => {
    expect(cycleDayFor('2026-10-01', '2026-10-01', 28)).toBe(1)
  })

  test('counts calendar days from the period start', () => {
    expect(cycleDayFor('2026-10-10', '2026-10-01', 28)).toBe(10)
  })

  test('wraps back to day 1 after one full cycle', () => {
    expect(cycleDayFor('2026-10-29', '2026-10-01', 28)).toBe(1)
    expect(cycleDayFor('2026-10-28', '2026-10-01', 28)).toBe(28)
    expect(cycleDayFor('2026-11-27', '2026-10-01', 28)).toBe(2)
  })

  test('returns null when there is no start date or the date is before it', () => {
    expect(cycleDayFor('2026-10-10', null, 28)).toBeNull()
    expect(cycleDayFor('2026-09-30', '2026-10-01', 28)).toBeNull()
  })

  test('clamps an unrealistic cycle length into the supported range', () => {
    expect(cycleDayFor('2026-10-05', '2026-10-01', 5)).toBe(5)
    expect(cycleDayFor('2026-10-30', '2026-10-01', 500)).toBe(30)
  })
})

describe('phaseFor', () => {
  test('menstrual covers the period days', () => {
    expect(phaseFor(1, { cycleLength: 28, periodLength: 5 })).toBe('menstrual')
    expect(phaseFor(5, { cycleLength: 28, periodLength: 5 })).toBe('menstrual')
  })

  test('ovulation is estimated 14 days before the next period, with a three-day window', () => {
    expect(ovulationDayFor(28)).toBe(14)
    expect(phaseFor(13, { cycleLength: 28 })).toBe('ovulatory')
    expect(phaseFor(14, { cycleLength: 28 })).toBe('ovulatory')
    expect(phaseFor(15, { cycleLength: 28 })).toBe('ovulatory')
  })

  test('follicular before ovulation and luteal after', () => {
    expect(phaseFor(7, { cycleLength: 28 })).toBe('follicular')
    expect(phaseFor(20, { cycleLength: 28 })).toBe('luteal')
  })

  test('no day means no phase', () => {
    expect(phaseFor(null)).toBeNull()
  })
})

describe('buildLunaProfile', () => {
  const profile = { lastPeriodStart: '2026-10-01', cycleLength: 28, periodLength: 5, tone: 'playful' }

  test('summarises the cycle position without copying notes or intimacy data', () => {
    const summary = buildLunaProfile({
      profile,
      today: new Date(2026, 9, 10),
      checkins: {
        '2026-10-08': { mood: 4, energy: 3, note: 'private words' },
        '2026-10-09': { mood: 6, energy: 5 },
      },
      intentions: [
        { label: 'Make time for reflection', status: 'active' },
        { label: 'Paused goal', status: 'paused' },
      ],
    })

    expect(summary.day).toBe(10)
    expect(summary.phase).toBe('follicular')
    expect(summary.tone).toBe('playful')
    expect(summary.daysLogged).toBe(2)
    expect(summary.lastCheckIn).toBe('2026-10-09')
    expect(summary.lastMood).toBe(6)
    expect(summary.averageMood).toBe(5)
    expect(summary.averageEnergy).toBe(4)
    expect(summary.activeIntentions).toEqual(['Make time for reflection'])
    expect(JSON.stringify(summary)).not.toContain('private words')
  })

  test('handles a brand-new user with nothing logged', () => {
    const summary = buildLunaProfile({ profile: { cycleLength: 28, periodLength: 5 }, checkins: {} })
    expect(summary.phase).toBeNull()
    expect(summary.averageMood).toBeNull()
    expect(summary.daysLogged).toBe(0)
  })
})

describe('toDateKey', () => {
  test('formats a local calendar date as yyyy-MM-dd', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
