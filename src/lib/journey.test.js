import {
  LEARNING_GUIDES,
  addSelfCareNote,
  awardMilestoneOnce,
  completeLearningQuiz,
  computeGardenProgress,
  loadJourneyState,
  selectJourneyIntention,
  togglePauseIntention,
} from './journey'

describe('Your Journey non-punitive botanical conservatory engine', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('unlocks each milestone strictly once without duplicating points or timeline entries', () => {
    const first = awardMilestoneOnce('first-reflection', { celebrate: false })
    expect(first.unlockedNow).toBe(true)

    const duplicate = awardMilestoneOnce('first-reflection', { celebrate: false })
    expect(duplicate.unlockedNow).toBe(false)

    const state = loadJourneyState()
    expect(Object.keys(state.unlockedMilestones)).toEqual(['first-reflection'])
    expect(state.timeline).toHaveLength(1)
  })

  test('supports pausing/resuming intentions without penalty and advances botanical stages up to Stage 5', () => {
    selectJourneyIntention(null, 'gentle-reflection')
    expect(loadJourneyState().activeIntention).toBe('gentle-reflection')

    togglePauseIntention()
    expect(loadJourneyState().intentionPaused).toBe(true)

    LEARNING_GUIDES.forEach((guide) => {
      completeLearningQuiz(null, guide.id)
    })
    addSelfCareNote(null, 'Rest is productive and my body is wise.')
    awardMilestoneOnce('first-reflection', { celebrate: false })
    awardMilestoneOnce('three-reflections', { celebrate: false })
    awardMilestoneOnce('monthly-review', { celebrate: false })

    const progress = computeGardenProgress(loadJourneyState(), 4)
    expect(progress.stage).toBe(5)
    expect(progress.progressPercent).toBe(100)
  })

  test('supports flexible check-in cadences, journal themes, and strictly once-only personal reminder rewards', () => {
    const {
      addPersonalReminder,
      removePersonalReminder,
      selectCheckInCadence,
      selectJournalTheme,
      readJourneyState,
    } = require('./journey')

    selectCheckInCadence('', 'weekly-rhythm')
    selectJournalTheme('', 'linen-neutral')

    const first = addPersonalReminder('', 'Step into fresh air and sip warm water.')
    expect(first.newlyUnlocked.map((m) => m.id)).toEqual(['personal-reminder'])

    const second = addPersonalReminder('', 'Unclench your shoulders for thirty slow seconds.')
    expect(second.newlyUnlocked).toEqual([])

    const state = readJourneyState()
    expect(Object.keys(state.unlockedMilestones).filter((id) => id === 'personal-reminder')).toHaveLength(1)
    expect(state.personalReminders).toHaveLength(2)

    removePersonalReminder(second.state.personalReminders[0].id)
    expect(readJourneyState().personalReminders).toHaveLength(1)
  })

  test('calculates seeds & water deterministically, plants at Stage 0, advances continuously 0->5, and prevents over-consumption', () => {
    const {
      FLOWER_VARIETIES,
      computeGardenResources,
      plantGardenSeed,
      waterGardenPlant,
      setGardenAnimationsPaused,
    } = require('./journey')

    const initial = loadJourneyState()
    const startRes = computeGardenResources(initial, 2)
    expect(startRes.availableSeeds).toBeGreaterThanOrEqual(4)
    expect(startRes.availableWater).toBeGreaterThanOrEqual(6)

    // Plant a Damask Rose seed in empty Plot 2 -> starts strictly at growthStage 0 (Seed), spends 1 seed
    const plantRes = plantGardenSeed(2, 'rose', { cycleCount: 2 })
    expect(plantRes.ok).toBe(true)
    expect(plantRes.plant.growthStage).toBe(0)
    expect(plantRes.plant.species).toBe('rose')

    // Re-attempting on already occupied plot fails cleanly and spends 0 extra seeds
    const duplicatePlot = plantGardenSeed(2, 'tulip', { cycleCount: 2 })
    expect(duplicatePlot).toMatchObject({ ok: false, reason: 'plot_occupied' })

    const afterPlant = computeGardenResources(loadJourneyState(), 2)
    expect(afterPlant.availableSeeds).toBe(startRes.availableSeeds - 1)

    // Step-by-step continuous growth: 0 (Seed) -> 1 (Sprout) -> 2 (Seedling) -> 3 (Developing) -> 4 (Bud) -> 5 (Full bloom)
    for (let expectedStage = 1; expectedStage <= 5; expectedStage += 1) {
      const w = waterGardenPlant(2, { cycleCount: 2 })
      expect(w.ok).toBe(true)
      expect(w.nextStage).toBe(expectedStage)
      expect(w.plant.moistUntil).toBeGreaterThan(Date.now() - 1000)
    }

    // Attempting to water an already fully bloomed specimen spends 0 water
    const overWater = waterGardenPlant(2, { cycleCount: 2 })
    expect(overWater).toMatchObject({ ok: false, reason: 'already_bloomed' })

    const afterBloom = computeGardenResources(loadJourneyState(), 2)
    expect(afterBloom.availableWater).toBe(startRes.availableWater - 5)

    // All 8 varieties can be planted as authentic species definitions
    expect(FLOWER_VARIETIES.map((v) => v.id)).toEqual([
      'rose',
      'sunflower',
      'tulip',
      'daisy',
      'lavender',
      'orchid',
      'iris',
      'strelitzia',
    ])

    // Animation pause state persists across reload
    const paused = setGardenAnimationsPaused(true)
    expect(paused.ok).toBe(true)
    expect(loadJourneyState().gardenAnimationsPaused).toBe(true)
  })

  test('recovers cleanly without corrupting prior state when localStorage saving fails', () => {
    const { plantGardenSeed, waterGardenPlant } = require('./journey')

    const baselineBeforeError = loadJourneyState()
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    const failedPlant = plantGardenSeed(2, 'strelitzia', { cycleCount: 1 })
    expect(failedPlant).toMatchObject({ ok: false, reason: 'save_failed' })

    const failedWater = waterGardenPlant(0, { cycleCount: 1 })
    expect(failedWater).toMatchObject({ ok: false, reason: 'save_failed' })

    setItemSpy.mockRestore()

    // Persisted state remains 100% intact with zero corrupted resources or ghost plants
    const restored = loadJourneyState()
    expect(restored.gardenLedger).toEqual(baselineBeforeError.gardenLedger)
    expect(restored.plots[2]).toBeNull()
  })
})
