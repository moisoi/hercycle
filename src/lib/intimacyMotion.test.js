import {
  INTIMACY_MOTION_TOKENS,
  deriveIntimacySuggestionContext,
  describeDesireState,
  getMoodSelectionArtDirection,
  nextCoordinatedEffect,
  resolveAuraOrigin,
} from './intimacyMotion'

const mockT = (key) => {
  const dict = {
    compassBoundarySpark_0: 'Boundary spark zero: warm tea and zero expectations.',
    compassBoundarySpark_1: 'Boundary spark one: rest in your own calm space.',
    compassBoundarySpark_2: 'Boundary spark two: soft blanket and quiet evening.',
    compassGentleSpark_0: 'Gentle spark zero: unhurried warmth at your pace.',
    compassGentleSpark_1: 'Gentle spark one: slow breathing side by side.',
    compassGentleSpark_2: 'Gentle spark two: light hand-holding only if comfortable.',
    intimacyNoteRedBoundary: 'Tonight I need rest and a quiet boundary—thank you for understanding.',
    intimacyNoteYellowSlow: 'Feeling open to slow, gentle closeness at my pace tonight.',
    intimacyNoteTender: 'Feeling tender tonight.',
    intimacyNotePlayful: 'Feeling playful tonight.',
    intimacyNoteNaughty: 'Feeling close tonight.',
    intimacyVibeTender: 'Tender',
    intimacyVibePlayful: 'Playful',
    intimacyVibeNaughty: 'Naughty',
  }
  return dict[key] || key
}

describe('Intimacy soft-botanical motion tokens, pointer origin, coordination & boundary precedence', () => {
  test('resolves exact clamped pointer percentages on click and center (50, 50) on keyboard activation', () => {
    expect(resolveAuraOrigin({ detail: 0 })).toEqual({ xPct: 50, yPct: 50 })

    const origin = resolveAuraOrigin({
      detail: 1,
      clientX: 125,
      clientY: 40,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 100, top: 20, width: 100, height: 80 }),
      },
    })
    expect(origin).toEqual({ xPct: 25, yPct: 25 })
  })

  test('caps sparse particles at <= 4 across all moods, alternates Playful butterfly occasionally without spamming, and suppresses under reduced motion', () => {
    const tender = getMoodSelectionArtDirection('tender')
    const playfulFirst = getMoodSelectionArtDirection('playful', 1)
    const playfulSecond = getMoodSelectionArtDirection('playful', 2)
    const playfulThird = getMoodSelectionArtDirection('playful', 3)
    const naughty = getMoodSelectionArtDirection('naughty')

    expect(tender.particles.length).toBeLessThanOrEqual(INTIMACY_MOTION_TOKENS.maxParticles)
    expect(playfulFirst.particles.length).toBeLessThanOrEqual(INTIMACY_MOTION_TOKENS.maxParticles)
    expect(naughty.particles.length).toBeLessThanOrEqual(INTIMACY_MOTION_TOKENS.maxParticles)

    expect(tender.hasButterfly).toBe(false)
    expect(playfulFirst.hasButterfly).toBe(true)
    expect(playfulSecond.hasButterfly).toBe(false)
    expect(playfulThird.hasButterfly).toBe(true)
    expect(naughty.hasButterfly).toBe(false)
    expect(naughty.hasLuminousEdge).toBe(true)

    const e1 = nextCoordinatedEffect(null, 'mood', { vibe: 'tender' }, false)
    const e2 = nextCoordinatedEffect(e1, 'mood', { vibe: 'playful' }, false)
    expect(e2.seq).toBe(e1.seq + 1)
    expect(e2.vibe).toBe('playful')
    expect(nextCoordinatedEffect(e2, 'mood', { vibe: 'naughty' }, true)).toBeNull()
  })

  test('distinguishes unrated null desire from explicit 0/10 desire rating', () => {
    expect(describeDesireState(null)).toEqual({
      isUnrated: true,
      numericValue: null,
      fillPct: 0,
      glowAlpha: 0.03,
    })
    expect(describeDesireState(0)).toEqual({
      isUnrated: false,
      numericValue: 0,
      fillPct: 0,
      glowAlpha: 0.04,
    })
  })

  test('enforces strict precedence: Not today > Skipped/Low comfort > Mood & Spontaneous multi-select nuances', () => {
    // 1. Even at 10/10 desire + Naughty + Sexual + Spontaneous, "Not today" (`red`) strictly wins
    const boundary = deriveIntimacySuggestionContext({
      signal: 'red',
      comfort: 5,
      desire: 10,
      desireVibe: 'naughty',
      selectedTerms: ['sexual', 'spontaneous'],
      promptCursor: 0,
      locale: 'en',
      t: mockT,
    })
    expect(boundary.isBoundaryActive).toBe(true)
    expect(boundary.suggestedPartnerNote).toBe(mockT('intimacyNoteRedBoundary'))
    expect(boundary.stagePrompt).toBe(mockT('compassBoundarySpark_0'))

    // 2. Skipped comfort (`0`) maps to baseline `2` (never `5`), keeping Spontaneous gentle
    const skippedComfort = deriveIntimacySuggestionContext({
      signal: 'green',
      comfort: 0,
      desire: 9,
      desireVibe: 'naughty',
      selectedTerms: ['spontaneous'],
      promptCursor: 0,
      locale: 'en',
      t: mockT,
    })
    expect(skippedComfort.effectiveComfort).toBe(2)
    expect(skippedComfort.suggestedPartnerNote).toMatch(/tea and ten unhurried minutes/i)

    // 3. Toggling additional message directions updates suggestedPartnerNote immediately
    const singleDirection = deriveIntimacySuggestionContext({
      signal: 'green',
      comfort: 4,
      desire: 7,
      desireVibe: 'playful',
      selectedTerms: ['sensual'],
      promptCursor: 0,
      locale: 'en',
      t: mockT,
    })
    const multiDirection = deriveIntimacySuggestionContext({
      signal: 'green',
      comfort: 4,
      desire: 7,
      desireVibe: 'playful',
      selectedTerms: ['sensual', 'romantic'],
      promptCursor: 0,
      locale: 'en',
      t: mockT,
    })
    expect(multiDirection.suggestedPartnerNote).not.toBe(singleDirection.suggestedPartnerNote)
    expect(multiDirection.suggestedPartnerNote).toMatch(/candle/i)
  })
})
