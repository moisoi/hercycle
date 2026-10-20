import { readinessFor } from './intimacyReadiness'

describe('readinessFor', () => {
  it('pauses on red, closes the partner note, and offers one gentle idea', () => {
    const r = readinessFor({ trafficLight: 'red', comfort: 5, libido: 5 })
    expect(r.id).toBe('pause')
    expect(r.partnerAllowed).toBe(false)
    expect(r.suggestionCount).toBe(1)
  })

  it('keeps the partner note closed on yellow with low comfort, and open on yellow otherwise', () => {
    expect(readinessFor({ trafficLight: 'yellow', comfort: 1 }).partnerAllowed).toBe(false)
    expect(readinessFor({ trafficLight: 'yellow', comfort: 3 }).partnerAllowed).toBe(true)
    expect(readinessFor({ trafficLight: 'yellow', comfort: 5 }).suggestionCount).toBe(2)
  })

  it('scales the number of ideas with comfort on green', () => {
    expect(readinessFor({ trafficLight: 'green', comfort: 1 }).suggestionCount).toBe(2)
    expect(readinessFor({ trafficLight: 'green', comfort: 3 }).suggestionCount).toBe(3)
    expect(readinessFor({ trafficLight: 'green', comfort: 5 }).suggestionCount).toBe(4)
  })

  it('gives each comfort band its own message', () => {
    const messages = [1, 3, 5].map((comfort) => readinessFor({ trafficLight: 'green', comfort }).message)
    expect(new Set(messages).size).toBe(3)
  })

  it('still reacts to comfort when no light is chosen', () => {
    expect(readinessFor({ trafficLight: null, comfort: 1 }).suggestionCount).toBe(2)
    expect(readinessFor({ trafficLight: null, comfort: 5 }).suggestionCount).toBe(4)
    expect(readinessFor({ trafficLight: null, comfort: 3 }).id).toBe('unset')
  })

  it('adds a libido note only at the low and high ends', () => {
    expect(readinessFor({ trafficLight: 'green', comfort: 3, libido: 1 }).libidoNote).not.toBeNull()
    expect(readinessFor({ trafficLight: 'green', comfort: 3, libido: 10 }).libidoNote).not.toBeNull()
    expect(readinessFor({ trafficLight: 'green', comfort: 3, libido: 5 }).libidoNote).toBeNull()
  })
})
