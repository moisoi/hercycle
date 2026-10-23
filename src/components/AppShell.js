import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiActivity,
  FiCalendar,
  FiCompass,
  FiDroplet,
  FiHeart,
  FiHome,
  FiMessageCircle,
  FiSettings,
  FiUser,
} from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded'
import { useTranslation } from 'react-i18next'

import { getAccountProfile } from '../lib/account'
import { supabase } from '../lib/supabase'
import { loadPreferences, loadUserCycles } from '../lib/care'
import { CALM_EASE, getEntranceMotionProps } from '../lib/entrance'
import { computeGardenProgress, loadJourneyState } from '../lib/journey'
import { formatDisplayDate, getTodayIsoDate } from '../lib/period'
import { buildGentleReminderPool } from '../lib/reminders'
import CelebrationOverlay from './CelebrationOverlay'
import LanguageToggle from './LanguageToggle'
import LunaWidget from './LunaWidget'
import RotatingReminderText from './RotatingReminderText'
import { HerCycleBrandLockup, HerCycleLogoMark } from './SplashScreen'

const primaryNavigation = [
  { to: '/', label: 'dashboard', icon: FiHome, end: true },
  { to: '/log', label: 'cycleLog', icon: FiDroplet },
  { to: '/insights', label: 'insights', icon: FiActivity },
  { to: '/journey', label: 'journey', icon: FiCompass },
  { to: '/luna', label: 'luna', icon: FiMessageCircle },
  { to: '/intimacy', label: 'intimacy', icon: FiHeart },
]

const routeTitles = {
  '/': ['dashboard', 'dashboardDescription'],
  '/log': ['cycleLog', 'checkInDescription'],
  '/cycle-log': ['cycleLog', 'checkInDescription'],
  '/insights': ['insights', 'insightsTopbarSubtitle'],
  '/journey': ['journey', 'journeyDescription'],
  '/luna': ['lunaTitle', 'lunaDescription'],
  '/intimacy': ['intimacy', 'intimacyDescription'],
  '/settings': ['settings', 'settingsDescription'],
  '/account': ['accountInfoNavLabel', 'accountInfoTopbarSubtitle'],
}

const AppShell = ({ session, isFirstVisit = false, reducedMotion = false }) => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const [prefs, setPrefs] = useState(() => loadPreferences())
  const [cycles, setCycles] = useState([])
  const [journeyState, setJourneyState] = useState(() => loadJourneyState(userId))
  const [celebration, setCelebration] = useState(null)
  const [showWelcomeVeil, setShowWelcomeVeil] = useState(Boolean(isFirstVisit))
  const [, setAccountVersion] = useState(0)

  const latestEntry = cycles[0] || null
  const account = getAccountProfile(session)
  const calmMotion = Boolean(reducedMotion || prefs.reduceMotion)

  useEffect(() => {
    if (!isFirstVisit || calmMotion) {
      setShowWelcomeVeil(false)
      return undefined
    }
    setShowWelcomeVeil(true)
    const timer = window.setTimeout(() => setShowWelcomeVeil(false), 1150)
    return () => window.clearTimeout(timer)
  }, [calmMotion, isFirstVisit])

  useEffect(() => {
    const bumpAccount = () => setAccountVersion((prev) => prev + 1)
    window.addEventListener('hercycle:account-changed', bumpAccount)
    return () => window.removeEventListener('hercycle:account-changed', bumpAccount)
  }, [])

  // Ensure route switches reset scroll cleanly without blocking page paint
  useEffect(() => {
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')
    if (!isJsdom && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  useEffect(() => {
    let mounted = true
    const onDataChanged = async () => {
      try {
        const entries = await loadUserCycles(userId)
        if (mounted) setCycles(entries)
      } catch {
        if (mounted) setCycles([])
      }
      if (mounted) setJourneyState(loadJourneyState(userId))
    }
    const onJourneyChanged = () => {
      if (mounted) setJourneyState(loadJourneyState(userId))
    }
    onDataChanged()
    window.addEventListener('hercycle:data-changed', onDataChanged)
    window.addEventListener('hercycle:journey-changed', onJourneyChanged)
    return () => {
      mounted = false
      window.removeEventListener('hercycle:data-changed', onDataChanged)
      window.removeEventListener('hercycle:journey-changed', onJourneyChanged)
    }
  }, [userId])

  useEffect(() => {
    const syncPreferences = (event) => {
      const next = event?.detail ? { ...loadPreferences(), ...event.detail } : loadPreferences()
      setPrefs(next)
    }
    window.addEventListener('hercycle:preferences-changed', syncPreferences)
    return () => window.removeEventListener('hercycle:preferences-changed', syncPreferences)
  }, [])

  useEffect(() => {
    const handleCelebration = (event) => {
      const currentPrefs = loadPreferences()
      if (currentPrefs.journeyEnabled === false || currentPrefs.journeyRewards === false) return
      const detail = event?.detail || {}
      const activeLocale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'
      const resolvedTitle =
        detail.title || (activeLocale === 'am' ? detail.titleAm : detail.titleEn)
      const resolvedDescription =
        detail.description || (activeLocale === 'am' ? detail.subtitleAm : detail.subtitleEn) || ''
      if (resolvedTitle) {
        setCelebration({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          icon: detail.icon,
          title: resolvedTitle,
          description: resolvedDescription,
        })
      }
    }
    window.addEventListener('hercycle:celebrate', handleCelebration)
    return () => window.removeEventListener('hercycle:celebrate', handleCelebration)
  }, [i18n.language])

  useEffect(() => {
    if (!userId || !supabase || session?.isLocalSanctuary) return undefined
    let isMounted = true
    supabase
      .from('user_settings')
      .select('hide_intimacy')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (isMounted && !error && data?.hide_intimacy !== undefined && data.hide_intimacy !== null) {
          setPrefs((prev) => ({ ...prev, hideIntimacy: Boolean(data.hide_intimacy) }))
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [session?.isLocalSanctuary, userId])

  const garden = useMemo(
    () => computeGardenProgress(journeyState, cycles.length),
    [cycles.length, journeyState]
  )

  const visiblePrimaryNavigation = useMemo(
    () =>
      primaryNavigation.filter((item) => {
        if (item.to === '/intimacy' && prefs.hideIntimacy) return false
        if (item.to === '/journey' && prefs.journeyEnabled === false) return false
        return true
      }),
    [prefs.hideIntimacy, prefs.journeyEnabled]
  )

  const gentlePool = useMemo(
    () =>
      buildGentleReminderPool({
        phase: latestEntry?.phase || '',
        mood: latestEntry?.mood,
        energy: latestEntry?.energy,
        locale,
      }),
    [latestEntry?.energy, latestEntry?.mood, latestEntry?.phase, locale]
  )

  const [titleKey, descriptionKey] = routeTitles[location.pathname] || routeTitles['/']
  const formattedToday = formatDisplayDate(getTodayIsoDate(), locale)
  const isOnAccountPage = location.pathname === '/account'

  const surfaceEntrance = getEntranceMotionProps('surface', {
    isFirstVisit,
    reducedMotion: calmMotion,
  })
  const brandEntrance = getEntranceMotionProps('brand', {
    isFirstVisit,
    reducedMotion: calmMotion,
  })
  const contentEntrance = getEntranceMotionProps('content', {
    isFirstVisit,
    reducedMotion: calmMotion,
  })
  const controlsEntrance = getEntranceMotionProps('controls', {
    isFirstVisit,
    reducedMotion: calmMotion,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return undefined
    const vv = window.visualViewport
    const syncKeyboardViewport = () => {
      const keyboardHeight = Math.max(0, Math.round(window.innerHeight - vv.height))
      const isOpen = keyboardHeight > 110
      document.documentElement.style.setProperty('--vv-keyboard-inset', `${keyboardHeight}px`)
      if (isOpen) {
        document.documentElement.setAttribute('data-keyboard-open', 'true')
      } else {
        document.documentElement.removeAttribute('data-keyboard-open')
      }
    }
    syncKeyboardViewport()
    vv.addEventListener('resize', syncKeyboardViewport)
    vv.addEventListener('scroll', syncKeyboardViewport)
    return () => {
      vv.removeEventListener('resize', syncKeyboardViewport)
      vv.removeEventListener('scroll', syncKeyboardViewport)
      document.documentElement.removeAttribute('data-keyboard-open')
      document.documentElement.style.removeProperty('--vv-keyboard-inset')
    }
  }, [])

  // Clean, calm navigation links — zero outer circle rings or orbiting dots
  const renderNavigationLink = ({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      title={t(label)}
      className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}
    >
      <span className="app-nav-icon-halo" aria-hidden="true">
        <Icon />
      </span>
      <span className="app-nav-label">{t(label)}</span>
      {to === '/journey' && prefs.journeyEnabled !== false && prefs.journeyRewards !== false && (
        <span className="app-nav-stage-pill" aria-hidden="true">
          {t('gardenStageShort', { stage: garden.stage })}
        </span>
      )}
    </NavLink>
  )

  const accountAccessibleLabel = account.isAuthenticated
    ? `${t('accountInfoNavLabel')}: ${account.displayName}`
    : t('signIn')

  return (
    <motion.div
      className={`app-shell${isFirstVisit ? ' is-first-visit' : ''}`}
      data-entrance-mode={isFirstVisit ? 'first-visit' : 'returning'}
      {...surfaceEntrance}
    >
      <a href="#hercycle-main-content" className="hc-skip-link">
        {t('skipToMain')}
      </a>

      {/* Non-blocking soft-luxury atmospheric entrance veil (first visit & > 6h return) */}
      <AnimatePresence>
        {showWelcomeVeil && !calmMotion && (
          <motion.div
            className="hc-sanctuary-welcome-veil"
            data-testid="sanctuary-welcome-veil"
            aria-hidden="true"
            initial={{ opacity: 0.92 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: CALM_EASE }}
          >
            <motion.div
              className="hc-sanctuary-welcome-bloom"
              initial={{ scale: 0.9, opacity: 0.85 }}
              animate={{ scale: 1.24, opacity: 0 }}
              transition={{ duration: 1.05, ease: CALM_EASE }}
            >
              <GiLotus />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-sparkle-field" aria-hidden="true">
        <span>✦</span>
        <span>✧</span>
        <span>✧</span>
      </div>

      <aside className="app-sidebar">
        {/* Clean standalone brand mark — zero account icon next to the logo */}
        <motion.div className="hc-intro-brand-slot" {...brandEntrance}>
          <NavLink to="/" className="app-brand" aria-label={t('hercycle')}>
            <HerCycleBrandLockup size={40} pulse showTagline />
          </NavLink>
        </motion.div>

        <motion.div className="hc-intro-nav-slot" {...controlsEntrance}>
          <div className="app-sidebar-label">{t('yourSpace')}</div>
          <nav className="app-navigation" aria-label={t('yourSpace')}>
            {visiblePrimaryNavigation.map(renderNavigationLink)}
          </nav>
        </motion.div>

        {prefs.remindersEnabled !== false && (
          <div className="app-sidebar-note hc-spotlight-card" data-testid="sidebar-gentle-reminder">
            <div className="app-sidebar-note-header">
              <span className="app-sidebar-note-icon">
                <LocalFloristRoundedIcon sx={{ fontSize: 16 }} aria-hidden="true" />
              </span>
              <p>{t('gentleReminderLabel')}</p>
            </div>
            <RotatingReminderText as="strong" messages={gentlePool} intervalMs={5000} />
          </div>
        )}

        <div className="app-sidebar-bottom">
          {renderNavigationLink({ to: '/settings', label: 'settings', icon: FiSettings })}

          {/* Desktop (> 1024px) dedicated Account Info button positioned cleanly right below Settings */}
          <div className="hc-sidebar-account-nav-slot">
            {account.isAuthenticated ? (
              <NavLink
                to="/account"
                title={accountAccessibleLabel}
                aria-label={accountAccessibleLabel}
                data-testid="sidebar-account-profile"
                className={({ isActive }) =>
                  `app-nav-link hc-sidebar-account-nav-link is-authenticated${
                    isActive ? ' is-active' : ''
                  }`
                }
              >
                <span className="hc-sidebar-nav-avatar" aria-hidden="true">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" />
                  ) : (
                    <span>{account.initials}</span>
                  )}
                </span>
                <span className="app-nav-label hc-sidebar-account-text">
                  <strong>{t('accountInfoNavLabel')}</strong>
                  <small>{account.displayName}</small>
                </span>
              </NavLink>
            ) : (
              <NavLink
                to="/signin"
                state={{ from: location.pathname }}
                title={t('signIn')}
                aria-label={t('signIn')}
                data-testid="sidebar-signin-link"
                className={({ isActive }) =>
                  `app-nav-link hc-sidebar-account-nav-link is-signin${
                    isActive ? ' is-active' : ''
                  }`
                }
              >
                <span className="app-nav-icon-halo" aria-hidden="true">
                  <FiUser />
                </span>
                <span className="app-nav-label">{t('signIn')}</span>
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-topbar">
          {/* Mobile & Tablet top row keeps brand left and dedicated Account Info / Sign in pinned at top-right */}
          <motion.div className="app-topbar-heading" {...brandEntrance}>
            <span className="app-topbar-kicker">{t('companionKicker')}</span>
            <h1>{t(titleKey)}</h1>
            <p>{t(descriptionKey)}</p>
          </motion.div>

          <motion.div className="app-topbar-actions" {...controlsEntrance}>
            <NavLink to="/" className="app-mobile-brand" aria-label={t('hercycle')}>
              <HerCycleLogoMark size={34} pulse />
              <span className="app-mobile-brand-name">{t('hercycle')}</span>
            </NavLink>

            <div className="app-topbar-right-cluster">
              <LanguageToggle compact />
              <span className="app-date-chip">
                <FiCalendar aria-hidden="true" />
                <span>{formattedToday}</span>
              </span>

              {/* Dedicated Top-Right Corner Account Button for Phones & Tablets (<= 1024px) */}
              <div className="hc-topbar-account-slot">
                {account.isAuthenticated ? (
                  <button
                    type="button"
                    className={`hc-topbar-auth-switch is-account hc-spotlight-btn${
                      isOnAccountPage ? ' is-active' : ''
                    }`}
                    data-testid="topbar-account-profile"
                    aria-current={isOnAccountPage ? 'page' : undefined}
                    aria-label={accountAccessibleLabel}
                    title={accountAccessibleLabel}
                    onClick={() => navigate('/account')}
                  >
                    <span className="hc-topbar-auth-avatar" aria-hidden="true">
                      {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt="" />
                      ) : (
                        <span>{account.initials}</span>
                      )}
                    </span>
                    <span className="hc-topbar-auth-label">{t('accountInfoNavLabel')}</span>
                    <span className="hc-sr-only">{account.displayName}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="hc-topbar-auth-switch is-signin hc-spotlight-btn"
                    data-testid="topbar-signin-button"
                    aria-label={t('signIn')}
                    onClick={() => navigate('/signin', { state: { from: location.pathname } })}
                  >
                    <FiUser aria-hidden="true" />
                    <span className="hc-topbar-auth-label">{t('signIn')}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </header>

        {/* Direct, non-blocking Outlet mount so switching routes NEVER hangs or blanks */}
        <motion.main
          id="hercycle-main-content"
          className="app-page-content"
          tabIndex={-1}
          {...contentEntrance}
        >
          <div key={location.pathname} className="app-route-transition">
            <Outlet />
          </div>
        </motion.main>
      </div>

      <nav
        className="app-mobile-nav"
        aria-label={t('yourSpace')}
        style={{ '--mobile-nav-count': visiblePrimaryNavigation.length + 1 }}
      >
        {visiblePrimaryNavigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={t(label)}
            aria-label={t(label)}
            className={({ isActive }) => `app-mobile-nav-link${isActive ? ' is-active' : ''}`}
          >
            <span className="app-nav-icon-halo" aria-hidden="true">
              <Icon />
            </span>
            <span className="app-mobile-nav-text">{t(label)}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          title={t('settings')}
          aria-label={t('settings')}
          className={({ isActive }) => `app-mobile-nav-link${isActive ? ' is-active' : ''}`}
        >
          <span className="app-nav-icon-halo" aria-hidden="true">
            <FiSettings />
          </span>
          <span className="app-mobile-nav-text">{t('settings')}</span>
        </NavLink>
      </nav>

      <LunaWidget session={session} />
      <CelebrationOverlay
        celebration={celebration}
        reducedMotion={calmMotion}
        onDismiss={() => setCelebration(null)}
      />
    </motion.div>
  )
}

export default AppShell
