import { replyTo } from './luna'

const profile = { phase: 'menstrual', day: 2 }

describe('Luna replies', () => {
  test('answers a one-word message with context', () => {
    const reply = replyTo('cramps', { lang: 'en', profile })
    expect(reply.topic).toBe('cramps')
    expect(reply.text).toContain('day 2')
  })

  test('greets warmly and asks about the body and mood', () => {
    expect(replyTo('hey', { lang: 'en' }).topic).toBe('greeting')
  })

  test('sends urgent symptoms to a clinician, not a casual reply', () => {
    const reply = replyTo('I soaked through pads and have a fever', { lang: 'en' })
    expect(reply.topic).toBe('urgent')
    expect(reply.text).toMatch(/clinician|health professional/)
  })

  test('a bare word like "bleeding" stays with period questions', () => {
    expect(replyTo('bleeding', { lang: 'en' }).topic).toBe('period')
  })

  test('explicit messages get a witty, frank reply without graphic detail', () => {
    const reply = replyTo('you are so fucking hot', { lang: 'en' })
    expect(reply.topic).toBe('explicit')
    expect(reply.text).toMatch(/bold|spicy|witty/i)
    expect(reply.text).not.toMatch(/fuck|cock|pussy/i)
  })

  test('answers sex-health questions with practical education', () => {
    expect(replyTo('pain during sex, what do I do', { lang: 'en' }).topic).toBe('sexpain')
    expect(replyTo('which contraception is best', { lang: 'en' }).topic).toBe('contraception')
  })

  test('follow-ups like "tell me more" continue the previous topic', () => {
    const first = replyTo('my energy is low', { lang: 'en', profile })
    const history = [{ role: 'user', text: 'my energy is low' }, { role: 'luna', ...first }]
    const follow = replyTo('tell me more', { lang: 'en', profile, history })
    expect(follow.topic).toBe('energy')
  })

  test('falls back to a clarifying question for unclear messages', () => {
    const reply = replyTo('zxq', { lang: 'en' })
    expect(reply.topic).toBeNull()
    expect(reply.text).toMatch(/\?/)
  })

  test('replies in Amharic when the message is in Amharic', () => {
    const reply = replyTo('ቁርጠት አለብኝ', { lang: 'en' })
    expect(reply.topic).toBe('cramps')
    expect(reply.text).toMatch(/[\u1200-\u137F]/)
  })

  test('varies replies across a conversation instead of repeating one line', () => {
    const first = replyTo('hungry', { lang: 'en' })
    const second = replyTo('hungry', { lang: 'en', history: [{ role: 'user', text: 'x' }, { role: 'luna', text: first.text }] })
    expect(second.text).not.toBe(first.text)
  })
})
