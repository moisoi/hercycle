import { mergeByDate, mergeMilestones } from './sync'

describe('guest-to-account import', () => {
  test('the account entry wins for a day that exists in both places', () => {
    const local = { '2026-10-02': { mood: 3 }, '2026-10-03': { mood: 7 } }
    const remote = { '2026-10-03': { mood: 9 } }
    const { merged } = mergeByDate(local, remote)
    expect(merged['2026-10-03']).toEqual({ mood: 9 })
  })

  test('days only on the device are imported and reported for upload', () => {
    const local = { '2026-10-02': { mood: 3 }, '2026-10-03': { mood: 7 } }
    const remote = { '2026-10-03': { mood: 9 } }
    const { merged, imported } = mergeByDate(local, remote)
    expect(imported).toEqual(['2026-10-02'])
    expect(merged['2026-10-02']).toEqual({ mood: 3 })
  })

  test('milestones are the union, and an award already on the account is not replaced', () => {
    const merged = mergeMilestones(
      { first_checkin: '2026-10-01T10:00:00Z', first_lesson: '2026-10-02T10:00:00Z' },
      { first_checkin: '2026-09-30T08:00:00Z' }
    )
    expect(Object.keys(merged).sort()).toEqual(['first_checkin', 'first_lesson'])
    expect(merged.first_checkin).toBe('2026-09-30T08:00:00Z')
  })
})
