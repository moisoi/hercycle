import {
  INTRO_LAST_VISIT_STORAGE_KEY,
  INTRO_SEEN_STORAGE_KEY,
  SIX_HOURS_MS,
  checkAndRefreshSixHourReturn,
  consumeFirstVisitEntranceFlag,
  getEntranceMotionProps,
  hasSeenEntranceIntro,
  markEntranceIntroSeen,
  prefersCalmMotion,
  resetFirstVisitEntranceCacheForTests,
} from './entrance'

describe('Integrated first-visit & >6-hour return entrance state & prefers-reduced-motion compliance', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-reduce-motion')
    resetFirstVisitEntranceCacheForTests()
    window.matchMedia = originalMatchMedia
  })

  afterAll(() => {
    window.matchMedia = originalMatchMedia
  })

  test('runs gentle non-blocking entrance on first visit, skips within 6 hours, and replays after > 6 hours', () => {
    const t0 = 1_700_000_000_000
    expect(hasSeenEntranceIntro({ now: t0 })).toBe(false)

    const firstBoot = consumeFirstVisitEntranceFlag({ now: t0 })
    expect(firstBoot).toBe(true)
    expect(window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY)).toBe('true')
    expect(window.localStorage.getItem(INTRO_LAST_VISIT_STORAGE_KEY)).toBe(String(t0))
    expect(hasSeenEntranceIntro({ now: t0 + 1000 })).toBe(true)

    // Repeat visit 5 hours 59 minutes later -> skips full intro
    resetFirstVisitEntranceCacheForTests()
    const withinSixHours = t0 + SIX_HOURS_MS - 60_000
    expect(consumeFirstVisitEntranceFlag({ now: withinSixHours })).toBe(false)

    // Visit more than 6 hours after most recent visit -> replays premium entrance!
    resetFirstVisitEntranceCacheForTests()
    const afterSixHours = withinSixHours + SIX_HOURS_MS + 5_000
    expect(hasSeenEntranceIntro({ now: afterSixHours })).toBe(false)
    expect(consumeFirstVisitEntranceFlag({ now: afterSixHours })).toBe(true)

    // Returning open tab after > 6 hours refreshes timestamp & triggers welcome bloom
    expect(checkAndRefreshSixHourReturn({ now: afterSixHours + 30_000 })).toBe(false)
    expect(checkAndRefreshSixHourReturn({ now: afterSixHours + 30_000 + SIX_HOURS_MS + 1_000 })).toBe(true)
  })

  test('detects OS prefers-reduced-motion and collapses motion props to zero translation', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    expect(prefersCalmMotion()).toBe(true)

    const reducedBrand = getEntranceMotionProps('brand', {
      isFirstVisit: true,
      reducedMotion: true,
    })
    expect(reducedBrand.initial.y).toBeUndefined()
    expect(reducedBrand.transition.duration).toBeLessThanOrEqual(0.16)
  })

  test('produces staggered opacity/transform-only beats on first visit and static props on repeat visits', () => {
    const surface = getEntranceMotionProps('surface', { isFirstVisit: true, reducedMotion: false })
    const brand = getEntranceMotionProps('brand', { isFirstVisit: true, reducedMotion: false })
    const content = getEntranceMotionProps('content', { isFirstVisit: true, reducedMotion: false })
    const controls = getEntranceMotionProps('controls', { isFirstVisit: true, reducedMotion: false })

    expect(surface.transition.delay || 0).toBeLessThan(brand.transition.delay)
    expect(brand.transition.delay).toBeLessThan(content.transition.delay)
    expect(content.transition.delay).toBeLessThan(controls.transition.delay)
    expect(controls.transition.duration).toBeLessThanOrEqual(0.5)

    // Repeat visit returns immediate static props without entrance delay
    expect(getEntranceMotionProps('content', { isFirstVisit: false })).toEqual({
      initial: false,
      animate: { opacity: 1, y: 0 },
    })
  })

  test('degrades safely to calm instant render without crashing when localStorage throws', () => {
    const getSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked storage')
    })
    const setSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked storage')
    })

    // Safe fallback treats intro as seen so UI renders immediately with zero errors
    expect(hasSeenEntranceIntro()).toBe(true)
    expect(markEntranceIntroSeen()).toBe(false)
    expect(consumeFirstVisitEntranceFlag()).toBe(false)

    getSpy.mockRestore()
    setSpy.mockRestore()
  })
})
