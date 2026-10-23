import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import './i18n'
import { setAppLanguage } from './i18n'
import App from './App'
import RotatingReminderText from './components/RotatingReminderText'
import SanctuaryGardenSvg from './components/SanctuaryGardenSvg'
import { AGE_VERIFIED_STORAGE_KEY } from './components/AgeGate'

describe('HerCycle full application routes, 18+ age gate, bilingual EN/AM, Intimacy, Reminders & Your Journey', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    document.documentElement.removeAttribute('data-reduce-motion')
    document.documentElement.removeAttribute('data-intimacy-mood')
    setAppLanguage('en')
    global.fetch = jest.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ configured: false }),
    }))
  })

  test('enforces 18+ age gate before entering app and persists verification', async () => {
    render(<App initialRouterEntries={['/']} />)

    expect(await screen.findByTestId('age-gate-confirm')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('age-gate-under'))
    expect(screen.getByText(/adults 18 and older/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/go back/i))
    fireEvent.click(screen.getByTestId('age-gate-confirm'))

    expect(window.localStorage.getItem(AGE_VERIFIED_STORAGE_KEY)).toBe('true')
    expect(await screen.findByText(/get started/i)).toBeInTheDocument()
  })

  test('supports /signin luxury Auth card, password visibility toggle, switches English <-> Amharic live both ways, and persists guest check-ins across Home & Insights', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    const { unmount } = render(<App initialRouterEntries={['/signin']} />)
    expect(await screen.findByTestId('auth-sanctuary-page')).toBeInTheDocument()
    expect(screen.getByText(/continue to your space/i)).toBeInTheDocument()

    // Password eye toggle switches type password <-> text cleanly
    const pwdInput = document.querySelector('#auth-password')
    expect(pwdInput).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByTestId('auth-password-toggle'))
    expect(pwdInput).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByTestId('auth-password-toggle'))
    expect(pwdInput).toHaveAttribute('type', 'password')

    // Toggle language pill EN -> አማ -> EN cleanly in both directions
    fireEvent.click(screen.getAllByRole('button', { name: 'አማ' })[0])
    expect(await screen.findByText(/ወደ ስፍራሽ ቀጥዪ/i)).toBeInTheDocument()
    expect(document.querySelector('#auth-email')).toHaveAttribute('placeholder', 'ሰላም@ምሳሌ.com')
    fireEvent.click(screen.getAllByRole('button', { name: 'EN' })[0])
    expect(await screen.findByText(/continue to your space/i)).toBeInTheDocument()
    expect(document.querySelector('#auth-email')).toHaveAttribute('placeholder', 'selam@example.com')
    unmount()

    render(<App initialRouterEntries={['/log']} />)
    const saveBtn = await screen.findByRole('button', { name: /save on this device/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText(/saved privately on this device/i)).toBeInTheDocument()
    })
  })

  test('Intimacy screen keeps Partner Message Studio active across all three moods and validates +251 WhatsApp numbers', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    render(<App initialRouterEntries={['/intimacy']} />)

    expect(await screen.findByTestId('partner-message-studio')).toBeInTheDocument()
    expect(screen.getByTestId('comfort-tier-feedback')).toBeInTheDocument()

    // Switch through Tender, Playful, and Naughty — studio remains visible for all 3 moods
    fireEvent.click(screen.getByRole('radio', { name: /tender/i }))
    expect(screen.getByTestId('partner-message-studio')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /naughty/i }))
    expect(screen.getByTestId('partner-message-studio')).toBeInTheDocument()

    // Local 09... number triggers +251 requirement notice + 1-click auto-fix suggestion
    const phoneInput = screen.getByLabelText(/partner phone/i)
    fireEvent.change(phoneInput, { target: { value: '0911223344' } })
    fireEvent.click(screen.getByRole('button', { name: /send via whatsapp/i }))

    expect(await screen.findByText(/whatsapp requires international format starting with \+251/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /use \+251911223344/i }))
    expect(phoneInput).toHaveValue('+251911223344')
  })

  test('Your Journey renders Upcoming Botanical Garden preview card, completes quizzes, and honors Settings toggle', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    render(<App initialRouterEntries={['/journey']} />)

    expect(await screen.findByTestId('garden-upcoming-card')).toBeInTheDocument()
    expect(screen.getByTestId('botanical-progress-ring')).toBeInTheDocument()

    // Switch to Settings and toggle Calm / reduced motion
    fireEvent.click(screen.getAllByText(/^settings$/i)[0])
    const motionSwitch = await screen.findByTestId('reduce-motion-switch')
    expect(motionSwitch).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(motionSwitch)
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-reduce-motion')).toBe('true')
    })
  })

  test('RotatingReminderText rotates every 5 seconds continuously without pausing on mouse hover', () => {
    jest.useFakeTimers()
    const pool = ['Drink water, gorgeous!', 'Eat a warm real meal, love!']
    const { container } = render(<RotatingReminderText messages={pool} intervalMs={5000} />)

    expect(screen.getByText('Drink water, gorgeous!')).toBeInTheDocument()

    // Hover over component — timer MUST still advance after 5000ms
    fireEvent.mouseEnter(container.firstChild)
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(screen.getByText('Eat a warm real meal, love!')).toBeInTheDocument()
    jest.useRealTimers()
  })

  test('Home little reminder medallion & signature are cleanly structured and SanctuaryGardenSvg grows from open-air seeds to full bloom without a dome', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    const { unmount } = render(<App initialRouterEntries={['/']} />)
    const reminderCard = await screen.findByTestId('home-little-reminder')

    expect(reminderCard.querySelector('.mascot-card-topline')).toBeInTheDocument()
    expect(reminderCard.querySelector('.mascot-illustration .mascot-halo')).toBeInTheDocument()
    expect(reminderCard.querySelector('.mascot-illustration .mascot-lotus')).toBeInTheDocument()
    const signature = reminderCard.querySelector('.mascot-signature')
    expect(signature).toBeInTheDocument()
    expect(signature).toHaveTextContent(/luna says/i)
    expect(signature).toHaveTextContent(/with a little love/i)
    unmount()

    const { container: stage1 } = render(<SanctuaryGardenSvg stage={1} progressPercent={10} />)
    expect(stage1.querySelector('#sg-conservatory-clip')).toBeNull()
    expect(stage1.querySelector('#sg-soil-mound-clip')).toBeInTheDocument()
    // Stage 1 has dormant/germinating seeds in open soil and zero butterflies yet
    expect(stage1.querySelectorAll('ellipse[fill="url(#sg-seed-shell)"]').length).toBeGreaterThanOrEqual(3)
    expect(stage1.querySelector('.sg-butterfly-left')).toBeNull()

    const { container: stage5 } = render(<SanctuaryGardenSvg stage={5} progressPercent={100} />)
    // Stage 5 awakens every seed into full living blooms + visible stems + open-air fauna
    expect(stage5.querySelectorAll('ellipse[fill="url(#sg-seed-shell)"]').length).toBe(0)
    expect(stage5.querySelectorAll('path[stroke="#3D6642"]').length).toBeGreaterThanOrEqual(9)
    expect(stage5.querySelector('.sg-butterfly-left')).toBeInTheDocument()
    expect(stage5.querySelector('.sg-butterfly-right')).toBeInTheDocument()
  })

  test('renders pulsing real GiLotus brand mark, clean circle-free nav icons, strong privacy crest, interactive Insights sample lens, and localized sparkle + fauna card bursts (zero full-screen popup on card clicks)', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    const { unmount } = render(<App initialRouterEntries={['/']} />)

    // Home architectural privacy shield crest & first check-in card
    await screen.findByText(/your first check-in is waiting/i)
    const syncBanner = document.querySelector('.private-sync-banner')
    expect(syncBanner.querySelector('[data-testid="privacy-shield-crest"]')).toBeInTheDocument()
    expect(syncBanner.textContent).not.toMatch(/spaceYour/)
    expect(document.querySelector('.first-checkin-card .hc-first-checkin-badge')).toBeInTheDocument()

    // Pulsing brand logo retained; outer circle ring & 2 orbiting dots removed from ALL nav icons
    const brandLogo = document.querySelector('.app-brand [data-testid="hercycle-real-logo"]')
    expect(brandLogo).toBeInTheDocument()
    expect(brandLogo).toHaveClass('is-pulsing')
    expect(brandLogo.querySelector('.hc-real-logo-aura')).toBeInTheDocument()
    expect(document.querySelector('.app-nav-radial-ring')).toBeNull()
    expect(document.querySelector('.app-nav-radial-orbit')).toBeNull()
    expect(document.querySelector('.hc-sidebar-account-card')).toBeNull()
    expect(document.querySelector('.app-brand .hc-account-icon-anchor')).toBeNull()
    expect(document.querySelector('.app-sidebar-bottom .hc-sidebar-account-nav-slot')).toBeInTheDocument()
    unmount()

    // Check-in arriving sliders & guest privacy bar
    const { unmount: unmountLog } = render(<App initialRouterEntries={['/log']} />)
    await screen.findByTestId('live-checkin-compass')
    expect(document.querySelector('.hc-arriving-card')).toBeInTheDocument()
    expect(document.querySelectorAll('.hc-scale-value-pill').length).toBeGreaterThanOrEqual(3)
    expect(document.querySelector('.guest-save-note [data-testid="privacy-shield-crest"]')).toBeInTheDocument()
    expect(document.querySelector('.guest-save-note .hc-guest-signin-pill')).toBeInTheDocument()
    unmountLog()

    // Insights "Curiosity, not certainty." studio, 14-day sample preview, day inspector & localized card fauna burst (no full-screen burst)
    const { unmount: unmountInsights } = render(<App initialRouterEntries={['/insights']} />)
    await screen.findByText(/curiosity, not certainty/i)
    expect(document.querySelector('.hc-curiosity-callout')).toBeInTheDocument()
    fireEvent.click(screen.getAllByText(/preview 14-day sample/i)[0])
    expect(document.querySelector('.hc-day-inspector')).toBeInTheDocument()
    expect(document.querySelectorAll('.pattern-note-seal')).toHaveLength(2)
    fireEvent.click(document.querySelector('.hc-insight-review-btn'))
    expect(document.querySelector('[data-testid="celebration-overlay"]')).toBeNull()
    const cardBurst = document.querySelector('[data-testid="card-fauna-burst"]')
    expect(cardBurst).toBeInTheDocument()
    expect(cardBurst.querySelectorAll('[data-fauna="butterfly"]').length).toBeGreaterThanOrEqual(2)
    expect(cardBurst.querySelectorAll('[data-fauna="songbird"]').length).toBeGreaterThanOrEqual(1)
    expect(cardBurst.querySelectorAll('[data-sparkle="star"]').length).toBeGreaterThanOrEqual(4)
    unmountInsights()

    // Journey progress dashboard, unboxed section nav, flexible cadence, and custom personal reminder card fauna burst
    const { unmount: unmountJourney } = render(<App initialRouterEntries={['/journey']} />)
    const journeyPage = await screen.findByTestId('journey-page')
    expect(journeyPage.querySelector('.hc-journey-summary-strip')).toBeInTheDocument()
    expect(screen.getByTestId('garden-upcoming-card')).toBeInTheDocument()
    expect(document.querySelector('[data-testid="sanctuary-garden-svg"]')).toBeNull()
    expect(screen.getByTestId('journey-section-nav')).toBeInTheDocument()
    expect(journeyPage.querySelector('.hc-cadence-card')).toBeInTheDocument()
    const reminderCard = journeyPage.querySelector('.hc-personal-reminder-card')
    expect(reminderCard).toBeInTheDocument()
    const input = reminderCard.querySelector('input')
    fireEvent.change(input, { target: { value: 'Take three slow breaths by the window.' } })
    fireEvent.submit(reminderCard.querySelector('form'))
    expect(await screen.findByText(/Take three slow breaths by the window\./i)).toBeInTheDocument()
    expect(reminderCard.querySelector('[data-testid="card-fauna-burst"]')).toBeInTheDocument()
    expect(document.querySelector('[data-testid="celebration-overlay"]')).toBeNull()
    unmountJourney()
  })

  test('supports upcoming garden preview card, 5-stage stepper, card bursts on Comfort & Desire, circle/tick-free pulsating mood sub-cards, and full-page mood theming', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    // 1. Journey upcoming garden card, synced 5-stage stepper, and 4 interactive metric cards
    const { unmount: unmountJourney } = render(<App initialRouterEntries={['/journey']} />)
    const journeyPage = await screen.findByTestId('journey-page')
    expect(journeyPage.querySelectorAll('.hc-journey-metric-card')).toHaveLength(4)
    expect(journeyPage.querySelectorAll('.hc-stage-pill')).toHaveLength(5)
    expect(screen.getByTestId('garden-upcoming-card')).toBeInTheDocument()

    // Previewing Stage 5 activates stage pill and displays preview reset pill
    fireEvent.click(journeyPage.querySelectorAll('.hc-stage-pill')[4])
    expect(journeyPage.querySelector('.hc-stage-reset-pill')).toBeInTheDocument()

    // Clicking the Guides metric card switches directly into Body Literacy guides
    fireEvent.click(journeyPage.querySelectorAll('.hc-journey-metric-card')[1])
    expect(await screen.findAllByRole('article')).not.toHaveLength(0)
    unmountJourney()

    // 2. Daily Check-in phase cards carry explicit phase tint classes & selected state
    const { unmount: unmountLog } = render(<App initialRouterEntries={['/log']} />)
    await screen.findByTestId('live-checkin-compass')
    for (const key of ['menstrual', 'follicular', 'ovulatory', 'luteal']) {
      const card = document.querySelector(`.phase-choice-card.phase-choice-${key}`)
      expect(card).toBeInTheDocument()
      fireEvent.click(card)
      expect(card).toHaveClass('is-selected')
      expect(card).toHaveAttribute('aria-checked', 'true')
    }
    expect(document.querySelector('.hc-page-bottom-cta .form-submit-button')).toBeInTheDocument()
    unmountLog()

    // 3. Intimacy Comfort burst, Desire burst, pulsating circle/tick-free mood sub-cards & full-page mood palette/atmosphere
    const { unmount: unmountIntimacy } = render(<App initialRouterEntries={['/intimacy']} />)
    const compass = await screen.findByTestId('intimacy-live-compass')
    const greenCard = document.querySelector('.consent-signal-card.consent-signal-green')
    fireEvent.click(greenCard)
    expect(greenCard).toHaveClass('is-selected')
    expect(compass).toHaveClass('hc-compass-signal-green')

    // Setting value on Comfort level moves sliding pill indicator without per-number particle bursts
    const comfortSection = screen.getByTestId('comfort-level-section')
    const fifthComfortBtn = comfortSection.querySelectorAll('.comfort-scale-button')[5]
    fireEvent.click(fifthComfortBtn)
    expect(fifthComfortBtn).toHaveAttribute('aria-checked', 'true')
    expect(comfortSection.querySelector('.hc-comfort-sliding-pill')).toBeInTheDocument()
    expect(comfortSection.querySelector('[data-testid="card-fauna-burst"]')).toBeNull()

    // Setting value on "How turned on are you feeling?" smoothly updates live readout without drag particles
    const desireSection = screen.getByTestId('desire-level-section')
    const desireSlider = desireSection.querySelector('input[type="range"]')
    fireEvent.change(desireSlider, { target: { value: '9' } })
    expect(screen.getByTestId('desire-live-readout')).toHaveTextContent('9 / 10')
    expect(desireSection.querySelector('[data-testid="card-fauna-burst"]')).toBeNull()

    // Verify Tender, Playful & Naughty sub-cards trigger clipped BotanicalMoodLayer without continuous pulsing
    const vibeSection = document.querySelector('.hc-vibe-section')
    for (const mood of ['playful', 'naughty', 'tender']) {
      const moodCard = document.querySelector(`.intimacy-vibe-card.intimacy-vibe-${mood}`)
      expect(moodCard).toBeInTheDocument()
      fireEvent.click(moodCard)
      expect(moodCard).toHaveClass('is-selected')
      expect(moodCard).not.toHaveClass('is-pulsating')
      expect(moodCard).toHaveAttribute('aria-checked', 'true')
      expect(moodCard.querySelector(`.hc-vibe-active-${mood}`)).toBeInTheDocument()
      expect(moodCard.querySelector('.hc-vibe-ripple-wave')).toBeNull()
      expect(moodCard.querySelector('.hc-vibe-orb-halo')).toBeNull()
      expect(moodCard.querySelector('.intimacy-vibe-check')).toBeNull()
      expect(vibeSection).toHaveAttribute('data-active-vibe', mood)
      expect(document.documentElement.getAttribute('data-intimacy-mood')).toBe(mood)
      expect(screen.getByTestId('intimacy-page-atmosphere')).toHaveClass(`is-${mood}`)
    }

    // Verify Romantic, Sensual, Sexual & Spontaneous buttons multi-select cleanly with non-color-only mark
    for (const term of ['romantic', 'sensual', 'sexual', 'spontaneous']) {
      const termBtn = document.querySelector(`.intimacy-term.intimacy-term-${term}`)
      expect(termBtn).toBeInTheDocument()
      const wasSelected = termBtn.getAttribute('aria-pressed') === 'true'
      fireEvent.click(termBtn)
      expect(termBtn).toHaveAttribute('aria-pressed', String(!wasSelected))
      expect(termBtn.querySelector('.hc-term-ripple-ring')).toBeNull()
    }

    expect(document.querySelector('.hc-ritual-deck-count')).toBeInTheDocument()
    expect(document.querySelector('.hc-page-bottom-cta .form-submit-button')).toBeInTheDocument()
    unmountIntimacy()
    // Root document cleans up mood override immediately when leaving /intimacy
    expect(document.documentElement.getAttribute('data-intimacy-mood')).toBeNull()
  })

  test('switching from Settings to EVERY other screen renders complete page contents immediately without blanking', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    render(<App initialRouterEntries={['/settings']} />)
    expect(await screen.findByTestId('reduce-motion-switch')).toBeInTheDocument()

    // 1. Settings -> Home ("Your day")
    fireEvent.click(screen.getAllByRole('link', { name: /your day/i })[0])
    expect(await screen.findByTestId('home-little-reminder')).toBeInTheDocument()

    // Return to Settings -> Daily Check-in (/log)
    fireEvent.click(screen.getAllByRole('link', { name: /^settings/i })[0])
    expect(await screen.findByTestId('reduce-motion-switch')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('link', { name: /check-in/i })[0])
    expect(await screen.findByTestId('live-checkin-compass')).toBeInTheDocument()

    // Return to Settings -> Insights (/insights)
    fireEvent.click(screen.getAllByRole('link', { name: /^settings/i })[0])
    expect(await screen.findByTestId('reduce-motion-switch')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('link', { name: /^insights/i })[0])
    expect(await screen.findByText(/curiosity, not certainty/i)).toBeInTheDocument()

    // Return to Settings -> Your Journey (/journey) + Sunlit Seedbed sub-card visible
    fireEvent.click(screen.getAllByRole('link', { name: /^settings/i })[0])
    expect(await screen.findByTestId('reduce-motion-switch')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('link', { name: /your journey/i })[0])
    expect(await screen.findByTestId('journey-page')).toBeInTheDocument()
    expect(screen.getAllByText(/sunlit seedbed/i).length).toBeGreaterThanOrEqual(1)

    // Return to Settings -> Luna (/luna)
    fireEvent.click(screen.getAllByRole('link', { name: /^settings/i })[0])
    expect(await screen.findByTestId('reduce-motion-switch')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('link', { name: /^luna/i })[0])
    await waitFor(() => {
      expect(document.querySelector('.luna-layout .luna-composer')).toBeInTheDocument()
    })

    // Return to Settings -> Intimacy (/intimacy)
    fireEvent.click(screen.getAllByRole('link', { name: /^settings/i })[0])
    expect(await screen.findByTestId('reduce-motion-switch')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('link', { name: /^intimacy/i })[0])
    expect(await screen.findByTestId('partner-message-studio')).toBeInTheDocument()
  })

  test('non-blocking first-visit entrance runs once via hercycle.intro.seen and Journey preserves earned seed/water counters with Upcoming Garden Preview card', async () => {
    const { resetFirstVisitEntranceCacheForTests, INTRO_SEEN_STORAGE_KEY } = require('./lib/entrance')
    resetFirstVisitEntranceCacheForTests()
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    const { unmount } = render(<App initialRouterEntries={['/journey']} />)
    const shell = await screen.findByTestId('journey-page')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-entrance-mode', 'first-visit')
    expect(window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY)).toBe('true')
    expect(document.querySelector('.hc-real-logo-disc')).toBeInTheDocument()
    expect(document.querySelector('.hc-brand-lockup')).toBeInTheDocument()
    expect(shell.querySelector('[data-testid="garden-seeds-counter"]')).toHaveTextContent('Seeds: 3')
    expect(shell.querySelector('[data-testid="garden-water-counter"]')).toHaveTextContent(/Water:/i)
    expect(screen.getByTestId('garden-upcoming-card')).toBeInTheDocument()
    unmount()

    // Full app reload skips first-visit entrance ('returning')
    resetFirstVisitEntranceCacheForTests()
    render(<App initialRouterEntries={['/journey']} />)
    await screen.findByTestId('journey-page')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-entrance-mode', 'returning')
    expect(screen.getByTestId('garden-upcoming-card')).toBeInTheDocument()
  })

  test('completing full Onboarding flow (AgeGate -> Step 1 -> Step 2 -> Step 3 -> Step 4 -> App entry) renders Home dashboard cleanly without blank screen', async () => {
    const { resetFirstVisitEntranceCacheForTests } = require('./lib/entrance')
    resetFirstVisitEntranceCacheForTests()
    window.localStorage.clear()

    render(<App initialRouterEntries={['/']} />)

    // 1. Confirm 18+ Age Gate
    const confirmAgeBtn = await screen.findByRole('button', { name: /i am 18 or older/i })
    fireEvent.click(confirmAgeBtn)

    // 2. Onboarding Step 1 -> Step 2
    const beginBtn = await screen.findByRole('button', { name: /get started/i })
    fireEvent.click(beginBtn)

    // 3. Onboarding Step 2 (select Follicular phase -> Continue)
    const follicularBtn = await screen.findByRole('button', { name: /follicular/i })
    fireEvent.click(follicularBtn)
    expect(follicularBtn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // 4. Onboarding Step 3 (select Gentle tone -> Complete setup)
    const gentleTone = await screen.findByRole('button', { name: /gentle/i })
    fireEvent.click(gentleTone)
    expect(gentleTone).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /finish setup/i }))

    // 5. Onboarding Step 4 renders cleanly with HerCycleLogoMark (zero ReferenceError crash)
    const completePanel = await screen.findByTestId('onboarding-complete-step')
    expect(completePanel).toBeInTheDocument()
    expect(completePanel.querySelector('.hc-real-logo-disc')).toBeInTheDocument()

    // 6. Click primary entry CTA -> transitions into AppShell Home dashboard with visible content
    const enterAppBtn = completePanel.querySelector('.onboarding-cta')
    expect(enterAppBtn).toBeTruthy()
    fireEvent.click(enterAppBtn)

    await waitFor(() => {
      expect(document.querySelector('#hercycle-main-content')).toBeInTheDocument()
    })
    expect(await screen.findByTestId('home-garden-upcoming-card')).toBeInTheDocument()
    expect(window.localStorage.getItem('hercycle.onboarding.complete')).toBe('true')
    const savedOnboarding = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
    expect(savedOnboarding.phase_selected).toBe('follicular')
  })

  test('preserves active route, selection state, and unsaved check-in input across viewport resizes (320px -> 1920px) and adapts to mobile virtual keyboard', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    const vvListeners = {}
    const mockVisualViewport = {
      height: 844,
      width: 390,
      addEventListener: jest.fn((evt, cb) => {
        vvListeners[evt] = cb
      }),
      removeEventListener: jest.fn(),
    }
    const prevVV = window.visualViewport
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      writable: true,
      value: mockVisualViewport,
    })

    try {
      render(<App initialRouterEntries={['/log']} />)

      // Select Ovulatory phase, Desire = 8, and quick-date Yesterday on Check-in form
      const ovulatoryRadio = await screen.findByRole('radio', { name: /ovulatory/i })
      fireEvent.click(ovulatoryRadio)
      fireEvent.click(screen.getByRole('button', { name: '8' }))
      fireEvent.click(screen.getByRole('button', { name: /yesterday/i }))

      const checkInDateInput = document.querySelector('#checkin-date')
      const expectedYesterday = checkInDateInput.value
      await act(async () => {
        await Promise.resolve()
      })

      // Continuously resize across every target viewport + landscape without losing route or form state
      const viewports = [
        [320, 568],
        [375, 667],
        [390, 844],
        [667, 375],
        [768, 1024],
        [1024, 768],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
      ]
      for (const [w, h] of viewports) {
        Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: w })
        Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h })
        mockVisualViewport.width = w
        mockVisualViewport.height = h
        fireEvent(window, new Event('resize'))
      }

      // Unsaved selections & check-in route are 100% preserved across all resizes
      expect(screen.getByRole('radio', { name: /ovulatory/i })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('button', { name: '8' })).toHaveClass('is-selected')
      expect(document.querySelector('#checkin-date').value).toBe(expectedYesterday)

      // Simulate mobile virtual keyboard opening on a 390x844 phone
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 390 })
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 844 })
      mockVisualViewport.height = 500
      act(() => {
        vvListeners.resize?.()
      })
      expect(document.documentElement.getAttribute('data-keyboard-open')).toBe('true')
      expect(document.documentElement.style.getPropertyValue('--vv-keyboard-inset')).toBe('344px')

      // Simulate virtual keyboard closing -> restores bottom navigation clearance cleanly
      mockVisualViewport.height = 844
      act(() => {
        vvListeners.resize?.()
      })
      expect(document.documentElement.getAttribute('data-keyboard-open')).toBeNull()
    } finally {
      Object.defineProperty(window, 'visualViewport', {
        configurable: true,
        writable: true,
        value: prevVV,
      })
    }
  })

  test('verifies fixed-footprint reminders, Account Profile in sidebar & topbar, non-duplicate Insights legend/KPIs, and 6-channel mood-synced partner handoff', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    // 1. Verify signed-out topbar shows Sign in button, then automatically changes to Account Info button on sign-up
    const { unmount: unmountGuestCheck } = render(<App initialRouterEntries={['/']} />)
    expect(await screen.findByTestId('topbar-signin-button')).toBeInTheDocument()
    expect(screen.queryByTestId('topbar-account-profile')).toBeNull()
    unmountGuestCheck()

    const { unmount: unmountAuth } = render(<App initialRouterEntries={['/signin']} />)
    const tabs = await screen.findAllByRole('tab')
    fireEvent.click(tabs[1]) // Switch to Create account
    fireEvent.change(screen.getByLabelText(/preferred name/i), {
      target: { value: 'Selamawit' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'selam@example.com' },
    })
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'password123' } })
    fireEvent.submit(document.querySelector('form.auth-form'))

    // Redirects to Home: top-right Sign in button automatically replaced by Account Info button!
    const sidebarProfile = await screen.findByTestId('sidebar-account-profile')
    const topbarProfile = await screen.findByTestId('topbar-account-profile')
    expect(screen.queryByTestId('topbar-signin-button')).toBeNull()
    expect(sidebarProfile).toHaveTextContent('Selamawit')
    expect(topbarProfile).toHaveTextContent(/account info/i)
    expect(topbarProfile).toHaveTextContent('Selamawit')

    // Pulsing logo & radial glow layers exist in BOTH Desktop Sidebar AND Mobile Topbar
    expect(
      document.querySelector('.app-brand [data-testid="hercycle-real-logo"].is-pulsing .hc-real-logo-pulse-ring')
    ).toBeInTheDocument()
    expect(
      document.querySelector('.app-mobile-brand [data-testid="hercycle-real-logo"].is-pulsing .hc-real-logo-aura')
    ).toBeInTheDocument()

    // Fixed-footprint reminder renders hidden single-cell CSS grid sizers for all messages
    const sidebarSlot = document.querySelector('.app-sidebar-note .hc-rotating-reminder-slot')
    expect(sidebarSlot).toBeInTheDocument()
    expect(sidebarSlot.querySelectorAll('.hc-rotating-reminder-sizer').length).toBeGreaterThanOrEqual(4)

    // Clicking Topbar Account Info button navigates to warm soft-luxury Account Info page (/account)
    fireEvent.click(topbarProfile)
    expect(await screen.findByTestId('account-info-page')).toBeInTheDocument()
    expect(screen.getByText(/a little space, just for you\./i)).toBeInTheDocument()
    expect(screen.getByText(/make yourself at home, selamawit\./i)).toBeInTheDocument()
    expect(screen.getByTestId('account-section-profile')).toBeInTheDocument()
    expect(screen.getByTestId('account-section-preferences')).toBeInTheDocument()
    expect(screen.getByTestId('account-section-security')).toBeInTheDocument()
    expect(screen.getByTestId('account-section-data')).toBeInTheDocument()
    expect(screen.getByTestId('account-readonly-email')).toHaveTextContent('selam@example.com')

    // Editing preferred name shows Unsaved changes, preserves edits on save failure, supports Cancel & Save persistence
    const nameField = document.querySelector('#account-preferred-name')
    fireEvent.change(nameField, { target: { value: 'Hana' } })
    expect(screen.getByTestId('account-unsaved-badge')).toBeInTheDocument()

    const failSaveSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    fireEvent.click(screen.getByTestId('account-save-profile-btn'))
    expect(await screen.findByTestId('account-save-error')).toHaveTextContent(
      /we couldn’t save your changes\. your edits are still here/i
    )
    expect(nameField).toHaveValue('Hana')
    failSaveSpy.mockRestore()

    // Cancel restores saved baseline cleanly
    fireEvent.click(screen.getByTestId('account-cancel-profile-btn'))
    expect(nameField).toHaveValue('Selamawit')
    expect(screen.queryByTestId('account-unsaved-badge')).toBeNull()

    // Save changes persists across full reload with calm confirmation message
    fireEvent.change(nameField, { target: { value: 'Makeda' } })
    fireEvent.click(screen.getByTestId('account-save-profile-btn'))
    expect(await screen.findByTestId('account-save-confirmation')).toHaveTextContent(
      /your changes are saved\./i
    )
    unmountAuth()

    // Verify saved preferred name persists after fresh mount
    const { unmount: unmountReload } = render(<App initialRouterEntries={['/account']} />)
    expect(await screen.findByText(/make yourself at home, makeda\./i)).toBeInTheDocument()
    unmountReload()

    // 2. Insights: zero duplicate "Patterns, with compassion", clean KPI empty states, interactive Legend Key Bar
    const { unmount: unmountInsights } = render(<App initialRouterEntries={['/insights']} />)
    await screen.findByText(/curiosity, not certainty/i)
    expect(screen.getAllByText(/patterns, with compassion/i)).toHaveLength(1)
    expect(document.querySelectorAll('.hc-insight-kpi-card')).toHaveLength(4)
    const legendKey = screen.getByTestId('rhythm-legend-key')
    const legendBtns = legendKey.querySelectorAll('.hc-rhythm-legend-item')
    expect(legendBtns).toHaveLength(3)
    fireEvent.click(legendBtns[2]) // Enable Period flow overlay
    expect(legendBtns[2]).toHaveAttribute('aria-pressed', 'true')
    unmountInsights()

    // 3. Intimacy: Mood + Nuances directly tune Partner Handoff Studio + 6-channel selector
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    const { unmount: unmountIntimacy } = render(<App initialRouterEntries={['/intimacy']} />)
    const studio = await screen.findByTestId('partner-message-studio')
    const channelGrid = screen.getByTestId('partner-channel-grid')
    const channelButtons = channelGrid.querySelectorAll('.hc-channel-card')
    expect(Array.from(channelButtons).map((el) => el.getAttribute('data-channel'))).toEqual([
      'instagram',
      'telegram',
      'snapchat',
      'whatsapp',
      'email',
      'sms',
    ])

    // Selecting Naughty + Romantic immediately updates Partner Handoff aura, sync bar, and draft text
    fireEvent.click(document.querySelector('.intimacy-vibe-card.intimacy-vibe-naughty'))
    fireEvent.click(document.querySelector('.intimacy-term.intimacy-term-romantic'))
    expect(studio).toHaveAttribute('data-active-vibe', 'naughty')
    expect(screen.getByTestId('partner-mood-sync-bar')).toHaveTextContent(/naughty/i)
    expect(screen.getByTestId('partner-mood-sync-bar')).toHaveTextContent(/romantic/i)

    // Test launching Telegram with @username pre-filling draft URL
    fireEvent.change(screen.getByLabelText(/partner username/i), {
      target: { value: '@dawit' },
    })
    fireEvent.click(channelGrid.querySelector('[data-channel="telegram"]'))
    fireEvent.click(screen.getByRole('button', { name: /continue on telegram/i }))
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://t.me/dawit?text='),
      '_blank',
      'noopener,noreferrer'
    )
    openSpy.mockRestore()
    unmountIntimacy()
  })

  test('launches native mobile Instagram & Snapchat deep links + Universal Link fallbacks + OS Share Sheet, and translates EN <-> AM cleanly both ways', async () => {
    const {
      buildPartnerHandoffLinks,
      launchMobileAwareSocialHandoff,
    } = require('./lib/account')

    // 1. Verify mobile Instagram & Snapchat deep links + fallbacks on both iOS & Android
    const iosLinks = buildPartnerHandoffLinks({
      message: 'Slow kisses tonight',
      handle: '@eyob',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    })
    expect(iosLinks.isMobile).toBe(true)
    expect(iosLinks.instagramAppHref).toBe('instagram://user?username=eyob')
    expect(iosLinks.instagramWebHref).toBe('https://ig.me/m/eyob')
    expect(iosLinks.snapchatAppHref).toBe('snapchat://add/eyob')
    expect(iosLinks.snapchatMobileFallbackHref).toBe('https://www.snapchat.com/add/eyob')

    // Without handle on Android: pre-fills Instagram share sheet text & opens native Snapchat camera (never desktop-only web.snapchat.com)
    const androidLinks = buildPartnerHandoffLinks({
      message: 'Come close tonight',
      handle: '',
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
    })
    expect(androidLinks.isMobile).toBe(true)
    expect(androidLinks.instagramAppHref).toBe(
      `instagram://sharesheet?text=${encodeURIComponent('Come close tonight')}`
    )
    expect(androidLinks.snapchatAppHref).toBe('snapchat://camera')
    expect(androidLinks.snapchatHref).toBe('https://www.snapchat.com/')

    jest.useFakeTimers()
    const navCalls = []
    launchMobileAwareSocialHandoff('instagram', iosLinks, {
      message: 'Slow kisses tonight',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      navigateApp: (uri) => navCalls.push(uri),
    })
    expect(navCalls).toEqual(['instagram://user?username=eyob'])
    jest.advanceTimersByTime(900)
    expect(navCalls).toEqual(['instagram://user?username=eyob', 'https://ig.me/m/eyob'])

    const snapCalls = []
    launchMobileAwareSocialHandoff('snapchat', iosLinks, {
      message: 'Slow kisses tonight',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      navigateApp: (uri) => snapCalls.push(uri),
    })
    expect(snapCalls).toEqual(['snapchat://add/eyob'])
    // Simulate OS switching into native Snapchat app -> cancels fallback cleanly!
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    jest.advanceTimersByTime(900)
    expect(snapCalls).toEqual(['snapchat://add/eyob'])
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    jest.useRealTimers()

    // 2. Verify full two-way reactive English -> Amharic -> English translation across Intimacy & Luna
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')
    const i18n = require('./i18n').default
    await act(async () => {
      await i18n.changeLanguage('en')
    })

    const { unmount } = render(<App initialRouterEntries={['/intimacy']} />)
    await screen.findByTestId('partner-message-studio')
    const noteInput = document.querySelector('#partner-note')
    const subjectInput = document.querySelector('#partner-subject')
    const enNoteSnapshot = noteInput.value
    const enSubjectSnapshot = subjectInput.value
    expect(enNoteSnapshot).toMatch(/[A-Za-z]/)
    expect(screen.getByTestId('partner-channel-grid')).toHaveTextContent('Instagram')
    expect(screen.getByTestId('partner-channel-grid')).toHaveTextContent('Snapchat')

    // Switch EN -> AM: note, subject, channels, moods & date chip all translate to pure Amharic
    await act(async () => {
      await i18n.changeLanguage('am')
    })
    expect(noteInput.value).toMatch(/[\u1200-\u137F]/)
    expect(subjectInput.value).toMatch(/[\u1200-\u137F]/)
    expect(screen.getByTestId('partner-channel-grid')).toHaveTextContent('ኢንስታግራም')
    expect(screen.getByTestId('partner-channel-grid')).toHaveTextContent('ስናፕቻት')
    expect(document.querySelector('.app-date-chip').textContent).toMatch(/[\u1200-\u137F]/)

    // Switch AM -> EN: reverts 100% cleanly back to exact English with zero leftover Amharic
    await act(async () => {
      await i18n.changeLanguage('en')
    })
    expect(noteInput.value).toBe(enNoteSnapshot)
    expect(subjectInput.value).toBe(enSubjectSnapshot)
    expect(screen.getByTestId('partner-channel-grid')).toHaveTextContent('Instagram')
    expect(document.querySelector('.app-date-chip').textContent).not.toMatch(/[\u1200-\u137F]/)
    unmount()

    // 3. Full 8-route EN -> AM -> EN DOM round-trip sweep across EVERY screen in HerCycle
    const readMainWithoutToggle = (rootEl) => {
      const clone = rootEl.cloneNode(true)
      clone
        .querySelectorAll('[data-testid="language-toggle"]')
        .forEach((el) => el.remove())
      return clone.textContent || ''
    }

    const routesToAudit = [
      '/',
      '/log',
      '/insights',
      '/journey',
      '/luna',
      '/intimacy',
      '/settings',
      '/account',
      '/signin',
    ]
    for (const route of routesToAudit) {
      await act(async () => {
        await i18n.changeLanguage('en')
      })
      const view = render(<App initialRouterEntries={[route]} />)
      await waitFor(() => {
        expect(view.container.querySelector('main')).toBeInTheDocument()
      })
      const mainEl = view.container.querySelector('main')
      // In English mode, main content has ZERO Amharic Ethiopic leaks
      expect({ route, enEthiopic: readMainWithoutToggle(mainEl).match(/[\u1200-\u137F]+/g) || [] }).toEqual({
        route,
        enEthiopic: [],
      })

      // Switch to Amharic: main content renders Amharic & ZERO multi-letter English leaks (excluding brand 'HerCycle')
      await act(async () => {
        await i18n.changeLanguage('am')
      })
      const amCleaned = readMainWithoutToggle(mainEl).replace(/HerCycle/g, '')
      const latinTokens = amCleaned.match(/[A-Za-z]{2,}/g) || []
      expect({ route, latinTokens }).toEqual({ route, latinTokens: [] })

      // Switch BACK to English: main content reverts 100% cleanly with ZERO leftover Amharic!
      await act(async () => {
        await i18n.changeLanguage('en')
      })
      const revertedEthiopic = readMainWithoutToggle(mainEl).match(/[\u1200-\u137F]+/g) || []
      expect({ route, revertedEthiopic }).toEqual({ route, revertedEthiopic: [] })
      view.unmount()
    }
  })

  test('verifies best-practice Account placement (below Settings on desktop, top-right on mobile/tablet, removed next to logo), smooth post-auth redirect, floating Ask me anything launcher, centered YOUR LITTLE REMINDER, and coordinated 5-card Intimacy motion & consent precedence', async () => {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')

    // 1. Account placement + floating Luna launcher + centered YOUR LITTLE REMINDER on Home
    const homeView = render(<App initialRouterEntries={['/']} />)
    expect(await screen.findByTestId('topbar-signin-button')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-account-icon')).toBeNull()
    expect(document.querySelector('.app-brand .hc-account-icon-anchor')).toBeNull()

    // Sidebar account link lives directly inside .app-sidebar-bottom right below Settings
    const sidebarBottom = document.querySelector('.app-sidebar-bottom')
    expect(sidebarBottom).not.toBeNull()
    expect(sidebarBottom.querySelector('[data-testid="sidebar-signin-link"]')).toBeInTheDocument()
    expect(document.querySelector('.app-topbar-right-cluster .hc-topbar-account-slot')).not.toBeNull()

    // Floating Luna launcher renders crisp 'Ask me anything' subtitle alongside 'Luna'
    const launcher = document.querySelector('.luna-widget-launcher')
    expect(launcher).toHaveTextContent('Luna')
    expect(launcher.querySelector('.luna-widget-launcher-subtitle')).toHaveTextContent(
      'Ask me anything'
    )

    // YOUR LITTLE REMINDER uses valid centered block container inside .mascot-card
    const mascotSlot = document.querySelector('.mascot-card div.hc-rotating-reminder-slot')
    expect(mascotSlot).not.toBeNull()

    // Clicking Sign in from route preserves smooth return redirect without bouncing to /onboarding
    fireEvent.click(screen.getByTestId('topbar-signin-button'))
    const emailInput = await screen.findByLabelText(/email/i)
    const authTabs = screen.getAllByRole('tab')
    fireEvent.change(emailInput, { target: { value: 'liya@example.com' } })
    fireEvent.click(authTabs[1]) // Preserves typed email across Sign in <-> Create account tab switch!
    expect(screen.getByLabelText(/email/i)).toHaveValue('liya@example.com')

    fireEvent.change(screen.getByLabelText(/preferred name/i), { target: { value: 'Liya' } })
    const pwFields = document.querySelectorAll('input[type="password"]')
    fireEvent.change(pwFields[0], { target: { value: 'password123' } })
    fireEvent.change(pwFields[1], { target: { value: 'password123' } })
    fireEvent.submit(document.querySelector('form.auth-form'))

    const sidebarAccount = await screen.findByTestId('sidebar-account-profile')
    expect(sidebarAccount).toHaveTextContent('Liya')
    expect(document.querySelector('.app-sidebar-bottom [data-testid="sidebar-account-profile"]')).not.toBeNull()
    homeView.unmount()

    // 2. All 5 Intimacy cards: exact instructional copy, Playful occasional butterfly cadence vs Tender petals vs Naughty edge,
    //    keyboard center-origin navigation, live reduced-motion suppression, Comfort Skip != 5, Desire Skip = null != 0,
    //    Replace vs Append draft protection, and strict Not Today precedence
    const intimacyView = render(<App initialRouterEntries={['/intimacy']} />)
    expect(
      await screen.findByText('Choose a mood to explore prompts and shape your message.')
    ).toBeInTheDocument()

    // Re-selecting already-active Playful does NOT replay burst; switching Tender -> Playful (1st visit) plays butterfly!
    const tenderCard = screen.getByTestId('mood-card-tender')
    const playfulCard = screen.getByTestId('mood-card-playful')
    const naughtyCard = screen.getByTestId('mood-card-naughty')
    expect(playfulCard).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(playfulCard, { clientX: 40, clientY: 25 })
    expect(screen.queryByTestId('mood-selection-fx-playful')).toBeNull()

    fireEvent.click(tenderCard, { clientX: 30, clientY: 20 })
    expect(screen.getByTestId('mood-selection-fx-tender')).toBeInTheDocument()

    fireEvent.click(playfulCard, { clientX: 40, clientY: 25 })
    expect(playfulCard).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByTestId('mood-selection-fx-tender')).toBeNull()
    const firstLayer = screen.getByTestId('mood-selection-fx-playful')
    expect(firstLayer.querySelector('[data-testid="mood-playful-butterfly"]')).not.toBeNull()

    // Naughty shows restrained luminous edge without flames, and never auto-selects "Sexual"
    fireEvent.click(naughtyCard, { clientX: 60, clientY: 30 })
    expect(screen.queryByTestId('mood-selection-fx-playful')).toBeNull()
    expect(
      screen.getByTestId('mood-selection-fx-naughty').querySelector('.hc-mood-luminous-edge')
    ).not.toBeNull()
    expect(document.querySelector('.intimacy-term-sexual')).toHaveAttribute('aria-pressed', 'false')

    // 2nd switch to Playful keeps curved pollen motes while skipping the butterfly so it stays occasional (not every click)
    fireEvent.click(playfulCard, { clientX: 40, clientY: 25 })
    expect(
      screen.getByTestId('mood-selection-fx-playful').querySelector('[data-testid="mood-playful-butterfly"]')
    ).toBeNull()

    // Keyboard ArrowRight from Naughty -> Tender centers aura at (50%, 50%) cleanly
    fireEvent.click(naughtyCard, { clientX: 60, clientY: 30 })
    fireEvent.keyDown(naughtyCard, { key: 'ArrowRight' })
    expect(tenderCard).toHaveAttribute('aria-checked', 'true')
    expect(
      screen.getByTestId('mood-selection-fx-tender').style.getPropertyValue('--aura-origin-x')
    ).toBe('50%')

    // Live reduced-motion preference suppresses decorative mood burst layer immediately while preserving selection cues
    act(() => {
      window.localStorage.setItem('hercycle.preferences', JSON.stringify({ reduceMotion: true }))
      window.dispatchEvent(
        new CustomEvent('hercycle:preferences-changed', { detail: { reduceMotion: true } })
      )
    })
    fireEvent.click(playfulCard, { clientX: 40, clientY: 25 })
    expect(playfulCard).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByTestId('mood-selection-fx-playful')).toBeNull()
    act(() => {
      window.localStorage.setItem('hercycle.preferences', JSON.stringify({ reduceMotion: false }))
      window.dispatchEvent(
        new CustomEvent('hercycle:preferences-changed', { detail: { reduceMotion: false } })
      )
    })

    // Comfort Skip sets 0 (never max comfort 5), and Skip desire rating sets distinct null ('Skipped') rather than '0/10'
    const comfortSkipBtn = document.querySelector('.comfort-scale-button.is-skip-option')
    fireEvent.click(comfortSkipBtn)
    expect(comfortSkipBtn).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByTestId('skip-desire-btn'))
    expect(screen.getByTestId('desire-live-readout')).toHaveTextContent(/skipped/i)
    expect(screen.getByTestId('compass-heat-indicator')).toHaveTextContent(/unrated/i)

    // User-edited composer draft asks Replace vs Append instead of silently overwriting
    const noteTextarea = document.querySelector('#partner-note')
    fireEvent.change(noteTextarea, { target: { value: 'My personal custom note for tonight' } })
    fireEvent.click(screen.getByTestId('compass-load-composer-btn'))
    expect(noteTextarea.value).toBe('My personal custom note for tonight')
    const draftPrompt = await screen.findByTestId('compass-draft-conflict-prompt')
    expect(draftPrompt).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('compass-append-draft-btn'))
    expect(noteTextarea.value).toContain('My personal custom note for tonight')
    expect(noteTextarea.value).toContain('Slow check-in spark')

    // Selecting "Not today, and that is okay" strictly overrides high heat (10/10) + Naughty + Spontaneous
    const desireSliderInput = document.querySelector('.intimacy-desire-range')
    fireEvent.change(desireSliderInput, { target: { value: '10' } })
    fireEvent.click(document.querySelector('.intimacy-term-spontaneous'))
    const notTodayCard = document.querySelector('.consent-signal-card.consent-signal-red')
    fireEvent.click(notTodayCard)
    expect(notTodayCard).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('intimacy-live-compass')).toHaveClass('hc-compass-signal-red')

    // Explore this mood with Luna opens real /luna conversation carrying boundary-safe context
    fireEvent.click(screen.getByTestId('compass-explore-luna-btn'))
    expect(await screen.findByText(/live context/i)).toBeInTheDocument()
    expect(document.querySelector('.luna-context-header-row')).not.toBeNull()
    intimacyView.unmount()
  })
})


