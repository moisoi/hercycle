import React from 'react'
import { act, render } from '@testing-library/react'
import '@testing-library/jest-dom'

import '../i18n'
import SanctuaryGardenSvg from './SanctuaryGardenSvg'
import { FLOWER_VARIETIES } from '../lib/journey'

describe('SanctuaryGardenSvg multi-part botanical anatomy, choreography & performance guards', () => {
  const originalHardwareConcurrency = navigator.hardwareConcurrency

  afterEach(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: originalHardwareConcurrency,
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  test('renders distinct species-specific multi-part vector geometry across all 8 varieties and all 6 stages', () => {
    // Verify Rose end-to-end across all 6 stages (0: Seed -> 5: Full Bloom)
    const stageFingerprints = []
    for (let growthStage = 0; growthStage <= 5; growthStage += 1) {
      const { container } = render(
        <SanctuaryGardenSvg
          stage={Math.max(1, growthStage)}
          plots={[{ id: `rose-${growthStage}`, species: 'rose', growthStage }, null, null, null, null, null]}
        />
      )
      const roseSpecimen = container.querySelector('[data-species="rose"]')
      expect(roseSpecimen).toBeInTheDocument()
      expect(roseSpecimen).toHaveAttribute('data-plant-stage', String(growthStage))
      stageFingerprints.push(roseSpecimen.innerHTML)
    }

    // Every stage has distinct structural SVG paths (not static scaling of one flower)
    expect(new Set(stageFingerprints).size).toBe(6)

    // Verify all 8 botanical varieties produce unique, non-generic vector geometry at full bloom
    const bloomMarkupBySpecies = FLOWER_VARIETIES.map((v) => {
      const { container } = render(
        <SanctuaryGardenSvg
          stage={5}
          plots={[{ id: `sp-${v.id}`, species: v.id, growthStage: 5 }, null, null, null, null, null]}
        />
      )
      const specimen = container.querySelector(`[data-species="${v.id}"]`)
      expect(specimen).toBeInTheDocument()
      return specimen.innerHTML
    })

    expect(new Set(bloomMarkupBySpecies).size).toBe(FLOWER_VARIETIES.length)
  })

  test('renders soil-parting planting sequence, targeted watering stream & moist darkened soil, and pointer-safe butterflies', () => {
    const plots = [
      { id: 'p0', species: 'rose', growthStage: 5 },
      null,
      { id: 'p2', species: 'strelitzia', growthStage: 0 },
      null,
      null,
      null,
    ]

    const { getByTestId, container, rerender } = render(
      <SanctuaryGardenSvg stage={3} plots={plots} plantingPlotIndex={2} />
    )

    expect(getByTestId('planting-sequence-2')).toBeInTheDocument()

    rerender(<SanctuaryGardenSvg stage={5} plots={plots} wateringPlotIndex={0} />)
    expect(getByTestId('garden-watering-can')).toBeInTheDocument()
    expect(getByTestId('wet-soil-0')).toBeInTheDocument()

    const butterfly = container.querySelector('.sg-butterfly-left')
    expect(butterfly).toBeInTheDocument()
    expect(butterfly).toHaveAttribute('pointer-events', 'none')
  })

  test('scales down ambient complexity on low-core mobile hardware and pauses when tab is hidden or animationsPaused', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 1,
    })

    const bloomPlots = [{ id: 'p0', species: 'sunflower', growthStage: 5 }, null, null, null, null, null]
    const { container, rerender } = render(<SanctuaryGardenSvg stage={5} plots={bloomPlots} />)

    // Low-power mobile hardware sheds secondary butterfly automatically
    expect(container.querySelector('.sg-butterfly-left')).toBeInTheDocument()
    expect(container.querySelector('.sg-butterfly-right')).toBeNull()

    // Explicit user pause immediately halts ambient fauna & sparkles
    rerender(<SanctuaryGardenSvg stage={5} plots={bloomPlots} animationsPaused />)
    expect(container.querySelector('.sg-butterfly-left')).toBeNull()
    expect(container.querySelector('.sg-sparkles')).toBeNull()

    // Background tab visibility change also pauses ambient animations automatically
    rerender(<SanctuaryGardenSvg stage={5} plots={bloomPlots} animationsPaused={false} />)
    expect(container.querySelector('.sg-butterfly-left')).toBeInTheDocument()

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(container.querySelector('.sg-butterfly-left')).toBeNull()
  })

  test('preserves full plant proportions on narrow phone widths via responsive conservatory camera framing without losing plot state', () => {
    let roCallback = null
    let mockWidth = 290
    const prevRO = global.ResizeObserver
    global.ResizeObserver = class {
      constructor(cb) {
        roCallback = cb
      }
      observe() {}
      disconnect() {}
    }
    const rectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({
        width: mockWidth,
        height: 220,
        top: 0,
        left: 0,
        right: mockWidth,
        bottom: 220,
      })
    )

    try {
      const samplePlots = [
        { id: 'p0', species: 'rose', growthStage: 5 },
        null,
        null,
        null,
        { id: 'p4', species: 'sunflower', growthStage: 4 },
        null,
      ]

      const { container, getByRole, rerender } = render(
        <SanctuaryGardenSvg stage={5} plots={samplePlots} selectedPlotIndex={0} />
      )

      const svg = container.querySelector('svg.hc-sanctuary-garden-svg')
      // Narrow frame zooms smoothly onto Plots 1–3 at desktop botanical scale instead of shrinking
      expect(svg).toHaveAttribute('viewBox', '24 6 336 256')
      expect(getByRole('button', { name: /plots 1–3/i })).toHaveClass('is-active')

      // Selecting Plot 5 (index 4) automatically pans camera cleanly to Plots 4–6
      rerender(<SanctuaryGardenSvg stage={5} plots={samplePlots} selectedPlotIndex={4} />)
      expect(svg).toHaveAttribute('viewBox', '320 6 336 256')
      expect(getByRole('button', { name: /plots 4–6/i })).toHaveClass('is-active')

      // User can also inspect all 6 plots at once on mobile with 1 tap
      act(() => {
        getByRole('button', { name: /all 6/i }).click()
      })
      expect(svg).toHaveAttribute('viewBox', '0 0 680 262')

      // Widening back to tablet/desktop restores full panoramic conservatory view cleanly
      mockWidth = 640
      act(() => {
        roCallback?.()
      })
      expect(svg).toHaveAttribute('viewBox', '0 0 680 262')
      expect(container.querySelector('.hc-garden-camera-bar')).toBeNull()
    } finally {
      rectSpy.mockRestore()
      global.ResizeObserver = prevRO
    }
  })
})
