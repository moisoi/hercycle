import { buildLunaProfile, cycleDayFor, normalizeCycleLength, parseDateKey, phaseFor, toDateKey } from './cycle'

describe('cycleDayFor', () => {
  test('returns 1 on the start day and counts up', () => {
    expect(cycleDayFor('2026-10-01', '2026-10-01', 28)).toBe(1)
    expect(cycleDayFor('2026-10-05', '2026-10-01', 28)).toBe(5)
  })

  test('wraps back to day 1 after one full cycle', () => {
    expect(cycleDayFor('2026-10-29', '2026-10-01', 28)).toBe(1)
  })

  test('counts correctly across months', () => {
    // 1 Oct to 27 Nov is 57 days: 57 % 28 = 1, so day 2 of the next cycle.
    expect(cycleDayFor('2026-11-27', '2026-10-01', 28)).toBe(2)
  })

  test('returns null without a start date or before the start date', () => {
    expect(cycleDayFor('2026-10-05', null, 28)).toBeNull()
    expect(cycleDayFor('2026-09-30', '2026-10-01', 28)).toBeNull()
  })

  test('clamps the cycle length to the supported range', () => {
    expect(normalizeCycleLength(10)).toBe(21)
    expect(normalizeCycleLength(99)).toBe(40)
    expect(normalizeCycleLength(undefined)).toBe(28)
  })

  test('accepts Date objects and rejects impossible calendar keys', () => {
    expect(cycleDayFor(new Date(2026, 9, 3), new Date(2026, 9, 1), 28)).toBe(3)
    expect(parseDateKey('2026-02-31')).toBeNull()
    expect(toDateKey(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
})

describe('phaseFor', () => {
  test('maps days to phases using period and ovulation boundaries', () => {
    const options = { cycleLength: 28, periodLength: 5 }
    expect(phaseFor(1, options)).toBe('menstrual')
    expect(phaseFor(5, options)).toBe('menstrual')
    expect(phaseFor(9, options)).toBe('follicular')
    expect(phaseFor(14, options)).toBe('ovulatory')
    expect(phaseFor(20, options)).toBe('luteal')
    expect(phaseFor(null, options)).toBeNull()
  })
})

describe('buildLunaProfile', () => {
  const profile = { lastPeriodStart: '2026-10-01', cycleLength: 28, periodLength: 5, tone: 'playful' }
  const checkins = {
    '2026-10-01': { mood: 4, energy: 3, note: 'PRIVATE NOTE', phase: 'menstrual' },
    '2026-10-02': { mood: 6, energy: 5, note: 'more private text' },
    '2026-10-03': { mood: 8, energy: 7 },
  }

  test('summarises the cycle position and recent averages', () => {
    const result = buildLunaProfile({
      profile,
      checkins,
      intentions: [{ label: 'Make time for reflection', status: 'active' }, { label: 'Old goal', status: 'removed' }],
      today: new Date(2026, 9, 3),
    })
    expect(result.day).toBe(3)
    expect(result.phase).toBe('menstrual')
    expect(result.tone).toBe('playful')
    expect(result.daysLogged).toBe(3)
    expect(result.lastCheckIn).toBe('2026-10-03')
    expect(result.lastMood).toBe(8)
    expect(result.averageMood).toBe(6)
    expect(result.averageEnergy).toBe(5)
    expect(result.intentions).toEqual(['Make time for reflection'])
  })

  test('never includes notes or intimacy data', () => {
    const json = JSON.stringify(buildLunaProfile({ profile, checkins, today: new Date(2026, 9, 3) }))
    expect(json).not.toContain('PRIVATE NOTE')
    expect(json).not.toContain('intimacy')
  })

  test('handles a brand-new user with no data', () => {
    const result = buildLunaProfile({ profile: {}, checkins: {}, today: new Date(2026, 9, 3) })
    expect(result.day).toBeNull()
    expect(result.phase).toBeNull()
    expect(result.daysLogged).toBe(0)
    expect(result.averageMood).toBeNull()
  })
})
