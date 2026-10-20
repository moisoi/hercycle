import { replyTo, toServerSummary, topicFor } from './lunaReply'

describe('topicFor', () => {
  test('urgent symptoms win over every other topic', () => {
    expect(topicFor('I soaked through two pads and I have a fever')).toBe('urgent')
    expect(topicFor('sex hurts and I fainted')).toBe('urgent')
  })

  test('matches whole words only, so "this" is not a greeting', () => {
    expect(topicFor('this is so confusing')).not.toBe('greeting')
    expect(topicFor('hi')).toBe('greeting')
  })

  test('explicit questions are routed to the explicit topic, while "sexual" stays sexual health', () => {
    expect(topicFor('I want something sexy tonight')).toBe('explicit')
    expect(topicFor('a question about sexual health')).toBe('sexual_health')
  })

  test('short follow-ups reuse the topic of the last Luna reply', () => {
    expect(topicFor('why?', 'period')).toBe('period')
    expect(topicFor('more', 'relationship')).toBe('relationship')
  })

  test('recognises Amharic period terms', () => {
    expect(topicFor('ቁርጥማት አለብኝ')).toBe('period')
  })
})

describe('replyTo', () => {
  test('answers an urgent message by pointing to a clinician first', () => {
    const { text, topic } = replyTo('heavy bleeding and fever since this morning')
    expect(topic).toBe('urgent')
    expect(text.toLowerCase()).toContain('clinician')
  })

  test('answers explicit questions frankly without graphic content', () => {
    const { text, topic } = replyTo('tell me something sexy', { lang: 'en' })
    expect(topic).toBe('explicit')
    expect(text.toLowerCase()).toMatch(/non-graphic|tasteful|classy|cheeky/)
  })

  test('a fragment after a topic answers in that topic', () => {
    const first = replyTo('my cramps are bad', { history: [] })
    expect(first.topic).toBe('period')
    const followUp = replyTo('why?', { history: [{ role: 'user', text: 'my cramps are bad' }, { role: 'luna', text: first.text, topic: first.topic }] })
    expect(followUp.topic).toBe('period')
  })

  test('uses Amharic replies for Ethiopic input', () => {
    const { text, topic } = replyTo('ቁርጥማት አለብኝ', { lang: 'am' })
    expect(topic).toBe('period')
    expect(text).toMatch(/[\u1200-\u137F]/)
  })

  test('adds a phase note for body and period topics when the phase is known', () => {
    const { text } = replyTo('cramps again', { profile: { phase: 'menstrual' } })
    expect(text).toContain('period phase')
  })

  test('empty input returns a gentle unknown reply', () => {
    expect(replyTo('   ').topic).toBe('unknown')
  })
})

describe('toServerSummary', () => {
  const checkins = {
    '2026-10-01': { mood: 4, energy: 3, phase: 'menstrual', note: 'SECRET NOTE', intimacy: { openness: 'open' } },
    '2026-10-02': { mood: 6, energy: 5, phase: 'menstrual', note: 'another private thing' },
    '2026-10-03': { mood: 8, energy: 7, phase: 'follicular' },
  }

  test('returns counts, averages, phases, and the last period start', () => {
    const summary = toServerSummary(checkins, { lastPeriodStart: '2026-10-01' }, new Date(2026, 9, 3))
    expect(summary.checkInCount).toBe(3)
    expect(summary.averageMood).toBe(6)
    expect(summary.averageEnergy).toBe(5)
    expect(summary.phaseCounts).toEqual({ menstrual: 2, follicular: 1 })
    expect(summary.mostCommonPhase).toBe('menstrual')
    expect(summary.lastPeriodStartDate).toBe('2026-10-01')
    expect(summary.recentCheckIns[0]).toEqual({ daysAgo: 0, phase: 'follicular', mood: 8, energy: 7 })
  })

  test('never includes notes or intimacy data', () => {
    const json = JSON.stringify(toServerSummary(checkins, {}, new Date(2026, 9, 3)))
    expect(json).not.toContain('SECRET NOTE')
    expect(json).not.toContain('private thing')
    expect(json).not.toContain('intimacy')
    expect(json).not.toContain('openness')
  })
})
