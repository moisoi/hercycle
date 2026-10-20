import { markStageSeen, shouldCelebrate } from './celebrate'

const allOn = { gamification: true, showRewards: true, celebrate: true }

describe('celebration gating', () => {
  test('feedback bursts show whenever motion is on, regardless of reward settings', () => {
    expect(shouldCelebrate('vibe', { motionOn: true, prefs: { gamification: false } })).toBe(true)
    expect(shouldCelebrate('claim', { motionOn: true, prefs: { showRewards: false } })).toBe(true)
  })

  test('full-screen rewards need gamification, showRewards, and celebrate all on', () => {
    expect(shouldCelebrate('milestone', { motionOn: true, prefs: allOn })).toBe(true)
    expect(shouldCelebrate('stage', { motionOn: true, prefs: { ...allOn, celebrate: false } })).toBe(false)
    expect(shouldCelebrate('level', { motionOn: true, prefs: { ...allOn, showRewards: false } })).toBe(false)
  })

  test('the in-app motion switch turns everything off', () => {
    expect(shouldCelebrate('milestone', { motionOn: false, prefs: allOn })).toBe(false)
    expect(shouldCelebrate('burst', { motionOn: false, prefs: allOn })).toBe(false)
  })

  test('stage-up plays once per stage per session', () => {
    window.sessionStorage.clear()
    expect(markStageSeen('bloom')).toBe(true)
    expect(markStageSeen('bloom')).toBe(false)
    expect(markStageSeen('grove')).toBe(true)
  })
})
