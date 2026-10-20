import { useEffect } from 'react'

const SPOT_SELECTOR = '.card, .btn, .select-card, .chip'

/**
 * Cursor spotlight: tracks the pointer over cards and buttons and sets CSS variables
 * (--mx, --my, --glow) on the element under it. The glow and border ring are drawn in CSS
 * with the element's own border radius, so the light follows the exact shape.
 * Only runs on devices with a fine pointer. Touch screens get no hover effect.
 */
const Spotlight = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined

    let current = null
    const setGlow = (el, value) => el.style.setProperty('--glow', value)

    const onMove = (event) => {
      const el = event.target?.closest?.(SPOT_SELECTOR)
      if (!el) {
        if (current) setGlow(current, '0')
        current = null
        return
      }
      if (el !== current) {
        if (current) setGlow(current, '0')
        current = el
      }
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      el.style.setProperty('--my', `${event.clientY - rect.top}px`)
      setGlow(el, '1')
    }

    const onOut = (event) => {
      if (!event.relatedTarget && current) {
        setGlow(current, '0')
        current = null
      }
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [])

  return null
}

export default Spotlight
