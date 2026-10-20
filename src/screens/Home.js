import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowRight, FiDroplet, FiHeart, FiMessageCircle, FiAward } from 'react-icons/fi'

import GentleReminder from '../components/GentleReminder'
import Logo from '../components/Logo'
import { cycleDayFor, phaseFor, toDateKey } from '../lib/cycle'
import { formatDate } from '../lib/i18n'
import { awardedCount, ringProgress, MILESTONES } from '../lib/journey'
import { moodFamily, buildRotation } from '../lib/reminders'
import { useCheckins, usePrefs, useProfile, useJourney } from '../lib/store'

const PHASE_KEYS = ['menstrual', 'follicular', 'ovulatory', 'luteal']

const Home = () => {
  const { t } = useTranslation()
  const profile = useProfile()
  const checkins = useCheckins()
  const journey = useJourney()
  const prefs = usePrefs()

  const today = new Date()
  const todayKey = toDateKey(today)
  const cycleDay = cycleDayFor(today, profile.lastPeriodStart, profile.cycleLength)
  const phase = phaseFor(cycleDay, { cycleLength: profile.cycleLength, periodLength: profile.periodLength })
  const todayEntry = checkins[todayKey]

  const reminderLines = useMemo(() => {
    const general = t('reminders.general', { returnObjects: true })
    const phaseSpecific = phase ? t(`reminders.phase.${phase}`, { returnObjects: true }) : []
    const mood = todayEntry ? moodFamily(todayEntry.mood) : 'neutral'
    const moodSpecific = t(`reminders.mood.${mood}`, { returnObjects: true })
    return buildRotation({
      general: Array.isArray(general) ? general : [],
      phaseSpecific: Array.isArray(phaseSpecific) ? phaseSpecific : [],
      moodSpecific: Array.isArray(moodSpecific) ? moodSpecific : [],
    })
  }, [t, phase, todayEntry])

  const littleNotes = t('littleNotes', { returnObjects: true })
  const note = Array.isArray(littleNotes) && littleNotes.length
    ? littleNotes[today.getDate() % littleNotes.length]
    : ''

  const count = awardedCount(journey.milestones)
  const ring = ringProgress(journey.milestones)

  return (
    <div className="page home-page">
      <section className="hero-card spot glow-radial">
        <div className="hero-copy">
          <span className="eyebrow-label">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h2>{t('homeHeadline')}</h2>
          {cycleDay ? (
            <p>{t('cycleDayLine', { day: cycleDay, phase: t(`phase.${phase}`) })}</p>
          ) : (
            <p>{t('setCycleStartPrompt')}</p>
          )}
          <Link to="/log" className="primary-link spot">
            {todayEntry ? t('updateToday') : t('checkInNow')} <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className={`phase-orb phase-${phase || 'none'}`} aria-hidden="true">
          <Logo size={72} />
          <span>{phase ? t(`phase.${phase}`) : t('phase.unknown')}</span>
        </div>
      </section>

      <section className="home-reminders">
        {prefs.notifications && <GentleReminder lines={reminderLines} />}
        <p className="little-note">{note}</p>
      </section>

      <section className="quick-grid" aria-label={t('quickActions')}>
        <Link to="/log" className="quick-card spot"><FiDroplet aria-hidden="true" /><strong>{t('nav.checkIn')}</strong><span>{todayEntry ? t('loggedToday') : t('notLoggedYet')}</span></Link>
        <Link to="/luna" className="quick-card spot"><FiMessageCircle aria-hidden="true" /><strong>{t('nav.luna')}</strong><span>{t('lunaQuickLine')}</span></Link>
        {!prefs.hideIntimacy && (
          <Link to="/intimacy" className="quick-card spot"><FiHeart aria-hidden="true" /><strong>{t('nav.intimacy')}</strong><span>{t('intimacyQuickLine')}</span></Link>
        )}
        {prefs.gamification && (
          <Link to="/journey" className="quick-card spot"><FiAward aria-hidden="true" /><strong>{t('nav.journey')}</strong><span>{t('journeyQuickLine', { done: count, total: MILESTONES.length })}</span></Link>
        )}
      </section>

      {prefs.gamification && (
        <section className="mini-ring-card spot">
          <svg viewBox="0 0 120 120" className="mini-ring" aria-hidden="true">
            <circle cx="60" cy="60" r="48" className="ring-track" />
            <circle cx="60" cy="60" r="48" className="ring-value" pathLength="100" strokeDasharray={`${Math.round(ring * 100)} 100`} />
          </svg>
          <div>
            <strong>{t('journeyPreviewTitle')}</strong>
            <p>{t('journeyPreviewCopy')}</p>
          </div>
        </section>
      )}

      {!todayEntry && PHASE_KEYS.includes(phase) && <p className="home-footnote">{t('noPressureFootnote')}</p>}
    </div>
  )
}

export default Home
