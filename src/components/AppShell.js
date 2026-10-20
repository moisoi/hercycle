import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiActivity, FiAward, FiCalendar, FiHeart, FiHome, FiLogIn, FiLogOut, FiMessageCircle, FiSettings, FiDroplet } from 'react-icons/fi'

import Celebration from './Celebration'
import LanguageToggle from './LanguageToggle'
import LunaLauncher from './LunaLauncher'
import Logo from './Logo'
import Splash from './Splash'
import { supabase } from '../lib/supabase'
import { ROUTE_SPLASH_MS } from '../lib/splash'
import { formatDate } from '../lib/i18n'
import { usePrefs } from '../lib/store'

const navigation = [
  { to: '/', label: 'nav.home', icon: FiHome, end: true },
  { to: '/log', label: 'nav.checkIn', icon: FiDroplet },
  { to: '/insights', label: 'nav.insights', icon: FiActivity },
  { to: '/luna', label: 'nav.luna', icon: FiMessageCircle },
  { to: '/intimacy', label: 'nav.intimacy', icon: FiHeart },
  { to: '/journey', label: 'nav.journey', icon: FiAward, requires: 'gamification' },
]

const titles = {
  '/': 'nav.home',
  '/log': 'nav.checkIn',
  '/insights': 'nav.insights',
  '/luna': 'nav.luna',
  '/intimacy': 'nav.intimacy',
  '/journey': 'nav.journey',
  '/settings': 'nav.settings',
}

const AppShell = ({ session }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const prefs = usePrefs()
  const [routeSplash, setRouteSplash] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // A page change shows the splash over the new page for a short moment. The page itself renders
  // straight away underneath, and the overlay never blocks clicks.
  useEffect(() => {
    setRouteSplash(true)
    const timer = window.setTimeout(() => setRouteSplash(false), ROUTE_SPLASH_MS)
    return () => window.clearTimeout(timer)
  }, [location.pathname])

  const items = navigation.filter((item) => {
    if (item.to === '/intimacy' && prefs.hideIntimacy) return false
    if (item.requires === 'gamification' && !prefs.gamification) return false
    return true
  })

  const signOut = async () => {
    setSigningOut(true)
    if (supabase) await supabase.auth.signOut()
    setSigningOut(false)
    navigate('/auth')
  }

  const titleKey = titles[location.pathname] || 'nav.home'
  const today = formatDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label={t('mainNavigation')}>
        <NavLink to="/" className="app-brand spot" aria-label={t('homeLabel')}>
          <Logo size={44} />
          <span className="app-brand-copy">
            <strong>hercycle</strong>
            <small>{t('tagline')}</small>
          </span>
        </NavLink>
        <nav className="app-navigation" aria-label={t('mainNavigation')}>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-nav-link spot${isActive ? ' is-active' : ''}`}>
              <Icon aria-hidden="true" />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar-bottom">
          <NavLink to="/settings" className={({ isActive }) => `app-nav-link spot${isActive ? ' is-active' : ''}`}>
            <FiSettings aria-hidden="true" />
            <span>{t('nav.settings')}</span>
          </NavLink>
          {session ? (
            <button type="button" className="app-nav-link spot" onClick={signOut} disabled={signingOut}>
              <FiLogOut aria-hidden="true" />
              <span>{t('signOut')}</span>
            </button>
          ) : (
            <button type="button" className="app-nav-link spot" onClick={() => navigate('/auth')}>
              <FiLogIn aria-hidden="true" />
              <span>{t('signIn')}</span>
            </button>
          )}
        </div>
      </aside>

      <div className="app-main-column">
        <header className="app-topbar">
          <div className="app-topbar-heading">
            <span className="app-mobile-brand"><Logo size={26} /> hercycle</span>
            <h1>{t(titleKey)}</h1>
          </div>
          <div className="app-topbar-actions">
            <span className="app-date-chip"><FiCalendar aria-hidden="true" />{today}</span>
            <LanguageToggle />
          </div>
        </header>

        <main className="app-page-content" id="main">
          <div key={location.pathname} className="app-route">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="app-mobile-nav" aria-label={t('mainNavigation')}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `app-mobile-nav-link spot${isActive ? ' is-active' : ''}`}>
            <Icon aria-hidden="true" />
            <span>{t(label)}</span>
          </NavLink>
        ))}
        <NavLink to="/settings" className={({ isActive }) => `app-mobile-nav-link spot${isActive ? ' is-active' : ''}`}>
          <FiSettings aria-hidden="true" />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </nav>

      {routeSplash && <Splash overlay />}
      <LunaLauncher />
      <Celebration />
    </div>
  )
}

export default AppShell
