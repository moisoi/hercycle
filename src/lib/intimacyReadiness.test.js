import { comfortBand, readinessFor } from './intimacyReadiness'

describe('readinessFor', () => {
  it('pauses on red and offers one gentle idea', () => {
    const r = readinessFor({ trafficLight: 'red', comfort: 9, libido: 5 })
    expect(r.id).toBe('pause')
    expect(r.suggestionCount).toBe(1)
  })

  it('never hides the partner composer, whatever the light', () => {
    // Your spec: the composer shows for all three moods.
    const lights = ['green', 'yellow', 'red', null]
    const comforts = [1, 5, 10]
    for (const light of lights) {
      for (const comfort of comforts) {
        expect(readinessFor({ trafficLight: light, comfort }).id).toBeTruthy()
      }
    }
  })

  it('keeps yellow with low comfort gentle, and offers fewer ideas', () => {
    expect(readinessFor({ trafficLight: 'yellow', comfort: 1 }).id).toBe('slow')
    expect(readinessFor({ trafficLight: 'yellow', comfort: 1 }).suggestionCount).toBe(2)
    expect(readinessFor({ trafficLight: 'yellow', comfort: 10 }).suggestionCount).toBe(2)
  })

  it('scales the number of ideas with comfort on green', () => {
    expect(readinessFor({ trafficLight: 'green', comfort: 2 }).suggestionCount).toBe(2)
    expect(readinessFor({ trafficLight: 'green', comfort: 5 }).suggestionCount).toBe(3)
    expect(readinessFor({ trafficLight: 'green', comfort: 9 }).suggestionCount).toBe(4)
  })

  it('gives each comfort band its own readiness id', () => {
    const ids = [2, 5, 9].map((comfort) => readinessFor({ trafficLight: 'green', comfort }).id)
    expect(new Set(ids).size).toBe(3)
  })

  it('still reacts to comfort when no light is chosen', () => {
    expect(readinessFor({ trafficLight: null, comfort: 2 }).suggestionCount).toBe(2)
    expect(readinessFor({ trafficLight: null, comfort: 9 }).suggestionCount).toBe(4)
    expect(readinessFor({ trafficLight: null, comfort: 5 }).id).toBe('unset')
  })

  it('adds a libido note only at the low and high ends', () => {
    expect(readinessFor({ trafficLight: 'green', comfort: 5, libido: 1 }).libidoNoteKey).toBe('intimacyLibidoLowNote')
    expect(readinessFor({ trafficLight: 'green', comfort: 5, libido: 10 }).libidoNoteKey).toBe('intimacyLibidoHighNote')
    expect(readinessFor({ trafficLight: 'green', comfort: 5, libido: 5 }).libidoNoteKey).toBeNull()
  })

  it('maps comfort 1-10 into three bands', () => {
    expect(comfortBand(1)).toBe('gentle')
    expect(comfortBand(3)).toBe('gentle')
    expect(comfortBand(5)).toBe('open')
    expect(comfortBand(8)).toBe('open-plus')
  })
})
