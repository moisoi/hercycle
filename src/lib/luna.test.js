import {
  buildLunaProfile,
  clearSharedThread,
  inferConversationTopic,
  makeLocalReply,
  readSharedThread,
  summarizeCycles,
  writeSharedThread,
} from './luna'

describe('Luna context, profile sanitization, thread coherence, and bilingual replies', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  test('uses explicit unique period starts to summarize the last start, cycle day, and observed average', () => {
    const summary = summarizeCycles(
      [
        { date: '2025-01-01', phase: 'menstrual', mood: 5, energy: 5, period_start_date: '2025-01-01' },
        { date: '2025-01-02', phase: 'menstrual', mood: 5, energy: 4, period_start_date: '2025-01-01' },
        { date: '2025-01-29', phase: 'follicular', mood: 6, energy: 6, period_start_date: '2025-01-29' },
        { date: '2025-03-01', phase: 'menstrual', mood: 6, energy: 6, period_start_date: '2025-03-01' },
        { date: '2025-03-04', phase: 'menstrual', mood: 6, energy: 6, period_start_date: '2025-02-31' },
      ],
      '2025-03-10'
    )

    expect(summary.lastPeriodStartDate).toBe('2025-03-01')
    expect(summary.cycleDay).toBe(10)
    expect(summary.averageCycleLength).toBe(29.5)
    expect(summary.cycleLengthObservations).toBe(2)
  })

  test('buildLunaProfile computes active phase, cycle day, and strips PII fields', () => {
    const profile = buildLunaProfile({
      cycles: [
        {
          date: '2026-10-15',
          phase: 'ovulatory',
          mood: 8,
          energy: 9,
          period_start_date: '2026-10-03',
          email: 'secret@example.com',
          partnerPhone: '+251911223344',
        },
      ],
      settings: { phase_selected: 'follicular', tone_preference: 'playful' },
      referenceDate: '2026-10-21',
    })

    expect(profile.activePhase).toBe('ovulatory')
    expect(profile.cycleDay).toBe(19)
    expect(profile.tonePreference).toBe('playful')
    expect(JSON.stringify(profile)).not.toContain('secret@example.com')
    expect(JSON.stringify(profile)).not.toContain('+251911223344')
  })

  test('varies local replies instead of repeating one of the recent answers', () => {
    const conversation = []
    const replies = []

    for (let index = 0; index < 4; index += 1) {
      const reply = makeLocalReply('hello', {}, null, 'balanced', conversation)
      expect(
        conversation.slice(-3).some((item) => item.role === 'assistant' && item.content === reply)
      ).toBe(false)
      replies.push(reply)
      conversation.push({ role: 'assistant', content: reply })
    }

    expect(new Set(replies).size).toBe(4)
  })

  test('maintains multi-turn context on short incomplete follow-up fragments and handles adult spicy & Amharic prompts', () => {
    const priorThread = [
      { role: 'user', content: 'cramps' },
      { role: 'assistant', content: 'Heating pads help relax uterine smooth muscle.' },
    ]
    const followUpTopic = inferConversationTopic('more tips pls', priorThread)
    expect(followUpTopic).toBe('cramps')

    const spicyReply = makeLocalReply('spicy', {}, 'ovulatory', 'playful', [])
    expect(spicyReply.length).toBeGreaterThan(40)

    const amharicReply = makeLocalReply('ቁርጠት', {}, 'menstrual', 'balanced', [], 'am')
    expect(amharicReply).toMatch(/ፕሮስታግላንዲን|ሙቅ|ሐኪም/)
  })

  test('persists shared thread cleanly across LunaWidget and /luna', () => {
    writeSharedThread('guest', [
      { id: '1', role: 'assistant', content: 'Welcome!' },
      { id: '2', role: 'user', content: 'ovulation' },
    ])
    expect(readSharedThread('guest', 'Fallback')).toHaveLength(2)
    clearSharedThread('guest', 'Fresh start')
    expect(readSharedThread('guest', 'Fallback')[0].content).toBe('Fresh start')
  })
})
