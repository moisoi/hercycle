import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiActivity,
  FiCalendar,
  FiDroplet,
  FiHeart,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiMessageCircle,
  FiSettings,
} from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'

import { supabase } from '../lib/supabase'
import LunaWidget from './LunaWidget'

const primaryNavigation = [
  { to: '/', label: 'dashboard', icon: FiHome, end: true },
  { to: '/log', label: 'cycleLog', icon: FiDroplet },
  { to: '/insights', label: 'insights', icon: FiActivity },
  { to: '/luna', label: 'luna', icon: FiMessageCircle },
  { to: '/intimacy', label: 'intimacy', icon: FiHeart },
]

const routeTitles = {
  '/': ['dashboard', 'dashboardDescription'],
  '/log': ['cycleLog', 'checkInDescription'],
  '/insights': ['insightsTitle', 'insightsDescription'],
  '/luna': ['lunaTitle', 'lunaDescription'],
  '/intimacy': ['intimacy', 'intimacyDescription'],
  '/settings': ['settings', 'settingsDescription'],
}

const AppShell = ({ session }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [hideIntimacy, setHideIntimacy] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}').hideIntimacy || false
    } catch {
      return false
    }
  })

  useEffect(() => {
    const syncPreferences = (event) => {
      if (event.detail && Object.prototype.hasOwnProperty.call(event.detail, 'hideIntimacy')) {
        setHideIntimacy(Boolean(event.detail.hideIntimacy))
        return
      }
      try {
        setHideIntimacy(Boolean(JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}').hideIntimacy))
      } catch {
        setHideIntimacy(false)
      }
    }

    window.addEventListener('hercycle:preferences-changed', syncPreferences)
    return () => window.removeEventListener('hercycle:preferences-changed', syncPreferences)
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return undefined
    let isMounted = true
    supabase
      .from('user_settings')
      .select('hide_intimacy')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (isMounted && !error && data?.hide_intimacy !== undefined && data.hide_intimacy !== null) {
          setHideIntimacy(data.hide_intimacy)
        }
      })
      .catch((error) => console.error('Unable to load navigation preferences:', error))
    return () => { isMounted = false }
  }, [session?.user?.id])

  const visiblePrimaryNavigation = hideIntimacy
    ? primaryNavigation.filter((item) => item.to !== '/intimacy')
    : primaryNavigation
  const [titleKey, descriptionKey] = routeTitles[location.pathname] || routeTitles['/']
  const userEmail = session?.user?.email
  const userInitial = userEmail?.charAt(0)?.toUpperCase() || 'H'

  const handleAccountAction = async () => {
    if (!session) {
      navigate('/auth')
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Could not sign out:', error)
      return
    }
    navigate('/auth')
  }

  const renderNavigationLink = ({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      title={t(label)}
      className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}
    >
      <Icon aria-hidden="true" />
      <span>{t(label)}</span>
    </NavLink>
  )

  return (
    <div className="app-shell">
      <div className="app-sparkle-field" aria-hidden="true"><span>✦</span><span>✧</span><span>✧</span></div>
      <aside className="app-sidebar">
        <NavLink to="/" className="app-brand" aria-label="HerCycle home">
          <span className="app-brand-mark"><GiLotus aria-hidden="true" /></span>
          <span className="app-brand-copy">
            <strong>hercycle</strong>
            <small>care in your rhythm</small>
          </span>
        </NavLink>

        <div className="app-sidebar-label">YOUR SPACE</div>
        <nav className="app-navigation" aria-label="Main navigation">
          {visiblePrimaryNavigation.map(renderNavigationLink)}
        </nav>

        <div className="app-sidebar-note">
          <span className="app-sidebar-note-icon"><GiLotus aria-hidden="true" /></span>
          <p>A gentle reminder</p>
          <strong>Your body is not a problem to solve.</strong>
        </div>

        <div className="app-sidebar-bottom">
          {renderNavigationLink({ to: '/settings', label: 'settings', icon: FiSettings })}
          <button type="button" className="app-nav-link app-account-action" title={session ? t('signOut') : t('signIn')} onClick={handleAccountAction}>
            {session ? <FiLogOut aria-hidden="true" /> : <FiLogIn aria-hidden="true" />}
            <span>{session ? t('signOut') : t('signIn')}</span>
          </button>
          <div className="app-profile-chip">
            <span className="app-profile-avatar">{userInitial}</span>
            <span className="app-profile-copy">
              <strong>{userEmail ? userEmail.split('@')[0] : 'Your private space'}</strong>
              <small>{session ? 'Synced securely' : 'Just for you'}</small>
            </span>
            <FiCalendar className="app-profile-flower" aria-hidden="true" />
          </div>
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-topbar">
          <div className="app-topbar-heading">
            <span className="app-mobile-brand"><GiLotus aria-hidden="true" /> hercycle</span>
            <span className="app-topbar-kicker">YOUR CYCLE COMPANION</span>
            <h1>{t(titleKey)}</h1>
            <p>{t(descriptionKey)}</p>
          </div>
          <div className="app-topbar-actions">
            <span className="app-date-chip"><FiCalendar aria-hidden="true" />{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            {!session && (
              <button type="button" className="app-sign-in-button" onClick={() => navigate('/auth')}>
                {t('signIn')}
              </button>
            )}
          </div>
        </header>

        <main className="app-page-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="app-route-transition"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="app-mobile-nav" aria-label="Main navigation" style={{ gridTemplateColumns: `repeat(${visiblePrimaryNavigation.length + 1}, minmax(0, 1fr))` }}>
        {visiblePrimaryNavigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `app-mobile-nav-link${isActive ? ' is-active' : ''}`}
          >
            <Icon aria-hidden="true" />
            <span>{t(label)}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) => `app-mobile-nav-link${isActive ? ' is-active' : ''}`}
        >
          <FiSettings aria-hidden="true" />
          <span>{t('settings')}</span>
        </NavLink>
      </nav>

      <LunaWidget key={session?.user?.id || 'guest'} session={session} />
    </div>
  )
}

export default AppShell
