import { makeLocalReply, summarizeCycles } from './luna'

describe('Luna context and local conversation', () => {
  test('uses explicit unique period starts to summarize the last start and observed average', () => {
    const summary = summarizeCycles([
      { date: '2025-01-01', phase: 'menstrual', mood: 5, energy: 5, period_start_date: '2025-01-01' },
      { date: '2025-01-02', phase: 'menstrual', mood: 5, energy: 4, period_start_date: '2025-01-01' },
      { date: '2025-01-29', phase: 'follicular', mood: 6, energy: 6, period_start_date: '2025-01-29' },
      { date: '2025-03-01', phase: 'menstrual', mood: 6, energy: 6, period_start_date: '2025-03-01' },
      { date: '2025-03-04', phase: 'menstrual', mood: 6, energy: 6, period_start_date: '2025-02-31' },
    ])

    expect(summary.lastPeriodStartDate).toBe('2025-03-01')
    expect(summary.averageCycleLength).toBe(29.5)
    expect(summary.cycleLengthObservations).toBe(2)
  })

  test('varies local replies instead of repeating one of the recent answers', () => {
    const conversation = []
    const replies = []

    for (let index = 0; index < 4; index += 1) {
      const reply = makeLocalReply('hello', {}, null, 'balanced', conversation)
      expect(conversation.slice(-3).some((item) => item.role === 'assistant' && item.content === reply)).toBe(false)
      replies.push(reply)
      conversation.push({ role: 'assistant', content: reply })
    }

    expect(new Set(replies).size).toBe(4)
  })
})
