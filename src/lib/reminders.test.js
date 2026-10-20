import { REMINDER_INTERVAL_MS, buildRotation, nextIndex } from './reminders'

describe('reminder rotation', () => {
  test('rotates every five seconds', () => {
    expect(REMINDER_INTERVAL_MS).toBe(5000)
  })

  test('puts phase-specific lines first and removes duplicates', () => {
    const rotation = buildRotation({
      general: ['Drink water', 'Eat a proper meal', 'Drink water'],
      phaseSpecific: ['Rest is productive'],
    })
    expect(rotation).toEqual(['Rest is productive', 'Drink water', 'Eat a proper meal'])
  })

  test('ignores blank or non-string entries', () => {
    expect(buildRotation({ general: ['  ', null, 'Hi'] })).toEqual(['Hi'])
  })

  test('wraps around and never divides by zero', () => {
    expect(nextIndex(0, 3)).toBe(1)
    expect(nextIndex(2, 3)).toBe(0)
    expect(nextIndex(0, 0)).toBe(0)
  })
})
