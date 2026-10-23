const SPOTLIGHT_SELECTOR = [
  '.phase-spotlight',
  '.mascot-card',
  '.stat-card',
  '.luna-home-invitation',
  '.private-sync-banner',
  '.first-checkin-card',
  '.garden-home-card',
  '.garden-hero-card',
  '.journey-card',
  '.milestone-card',
  '.learning-card',
  '.form-section',
  '.intimacy-section',
  '.intimacy-privacy-card',
  '.partner-spark-card',
  '.settings-card',
  '.settings-about-card',
  '.insight-chart-card',
  '.insight-stat-card',
  '.pattern-note',
  '.onboarding-welcome',
  '.onboarding-step-panel',
  '.onboarding-complete-panel',
  '.auth-card',
  '.phase-choice-card',
  '.consent-signal-card',
  '.intimacy-vibe-card',
  '.onboarding-phase-card',
  '.onboarding-tone-card',
  '.settings-choice',
  '.app-nav-link',
  '.app-sign-in-button',
  '.luna-home-invitation-button',
  '.form-submit-button',
  '.onboarding-cta',
  '.lang-pill',
  '.hc-lang-pill',
  '.hc-spotlight-card',
  '.hc-spotlight-btn',
  '.spot-target',
].join(', ')

export const attachGlobalSpotlight = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  let rafId = null
  let touchClearTimer = null
  let activeElement = null

  const clearElement = (element) => {
    if (!element) return
    element.removeAttribute('data-spot-active')
  }

  const updateSpotAt = (clientX, clientY, target) => {
    if (!(target instanceof Element)) {
      clearElement(activeElement)
      activeElement = null
      return
    }

    const matched = target.closest(SPOTLIGHT_SELECTOR)
    if (matched !== activeElement) {
      clearElement(activeElement)
      activeElement = matched
    }
    if (!matched) return

    const rect = matched.getBoundingClientRect()
    const x = Math.round(clientX - rect.left)
    const y = Math.round(clientY - rect.top)
    matched.style.setProperty('--spot-x', `${x}px`)
    matched.style.setProperty('--spot-y', `${y}px`)
    matched.setAttribute('data-spot-active', 'true')
  }

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return
    if (rafId) window.cancelAnimationFrame(rafId)
    const { clientX, clientY, target } = event
    rafId = window.requestAnimationFrame(() => {
      rafId = null
      updateSpotAt(clientX, clientY, target)
    })
  }

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'touch') return
    window.clearTimeout(touchClearTimer)
    updateSpotAt(event.clientX, event.clientY, event.target)
    touchClearTimer = window.setTimeout(() => {
      clearElement(activeElement)
      activeElement = null
    }, 520)
  }

  const handlePointerLeave = () => {
    clearElement(activeElement)
    activeElement = null
  }

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave, { passive: true })
  window.addEventListener('pointercancel', handlePointerLeave, { passive: true })

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId)
    window.clearTimeout(touchClearTimer)
    clearElement(activeElement)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('pointerleave', handlePointerLeave)
    window.removeEventListener('pointercancel', handlePointerLeave)
  }
}
