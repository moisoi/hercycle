import React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LuCalendarHeart, LuFlame, LuFlower2, LuHouse, LuSettings, LuTrendingUp } from 'react-icons/lu'

import Logo from './Logo'
import LangToggle from './LangToggle'
import LunaChat from './LunaChat'
import Spotlight from './Spotlight'
import Celebration from './Celebration'
import { useStoredJson, KEYS } from '../lib/store'
import { DEFAULT_PREFS } from '../lib/repo'

const EMPTY = Object.freeze({})

/** App frame: header with the logo and language pill, navigation, the page, and Luna. */
const Shell = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const stored = useStoredJson(KEYS.prefs, EMPTY)
  const prefs = { ...DEFAULT_PREFS, ...stored }

  const items = [
    { to: '/', label: t('nav.today'), icon: <LuHouse />, end: true },
    { to: '/check-in', label: t('nav.checkIn'), icon: <LuCalendarHeart /> },
    !prefs.hideIntimacy && { to: '/intimacy', label: t('nav.intimacy'), icon: <LuFlame /> },
    prefs.gamification && { to: '/journey', label: t('nav.journey'), icon: <LuFlower2 /> },
    { to: '/insights', label: t('nav.insights'), icon: <LuTrendingUp /> },
    { to: '/settings', label: t('nav.settings'), icon: <LuSettings /> },
  ].filter(Boolean)

  return (
    <div className="shell">
      <nav className="nav" aria-label={t('nav.label')}>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shell-body">
        <header className="topbar">
          <NavLink to="/" className="brand" aria-label={t('app.name')}>
            <span className="brand-logo">
              <Logo />
            </span>
            <span className="brand-name">{t('app.name')}</span>
          </NavLink>
          <div className="topbar-end">
            <LangToggle />
          </div>
        </header>

        <main className="main" id="main">
          <div className="page" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <LunaChat />
      <Spotlight />
      <Celebration />
    </div>
  )
}

export default Shell
