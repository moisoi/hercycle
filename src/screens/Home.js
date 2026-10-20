import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuCalendarHeart, LuFlower2, LuLightbulb } from 'react-icons/lu'

import { GentleReminder, RotatingNote } from '../components/Reminders'
import Garden from '../components/Garden'
import { cycleDayFor, phaseFor, toDateKey, normalizeCycleLength } from '../lib/cycle'
import { KEYS, useStoredJson } from '../lib/store'
import { DEFAULT_JOURNEY, DEFAULT_PREFS, getProfile } from '../lib/repo'
import { stageFor } from '../lib/journey'
import { PHASE_TINTS } from '../lib/phases'

const EMPTY = Object.freeze({})

const Bar = ({ value, max, tint, label }) => (
  <div className="stack" style={{ gap: 6 }}>
    <div className="between">
      <span className="muted" style={{ fontSize: '0.9rem' }}>{label}</span>
      <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{value ?? '–'}/{max}</strong>
    </div>
    <div className="bar" style={{ '--tint': tint }} role="img" aria-label={`${label} ${value ?? 0} of ${max}`}>
      <i style={{ '--w': `${value ? (value / max) * 100 : 0}%`, width: `${value ? (value / max) * 100 : 0}%` }} />
    </div>
  </div>
)

/** Today: where the user is in their cycle, today's check-in, reminders, and the garden. */
const Today = () => {
  const { t } = useTranslation()
  const profileStore = useStoredJson(KEYS.profile, EMPTY)
  const checkins = useStoredJson(KEYS.checkins, EMPTY)
  const journey = useStoredJson(KEYS.journey, DEFAULT_JOURNEY)
  const prefs = { ...DEFAULT_PREFS, ...useStoredJson(KEYS.prefs, EMPTY) }

  const profile = { ...getProfile(), ...profileStore }
  const cycleLength = normalizeCycleLength(profile.cycleLength)
  const today = new Date()
  const day = cycleDayFor(today, profile.lastPeriodStart, cycleLength)
  const phase = phaseFor(day, { cycleLength, periodLength: profile.periodLength })
  const todayKey = toDateKey(today)
  const entry = checkins[todayKey]
  const stage = stageFor(journey.milestones)
  const tint = phase ? PHASE_TINTS[phase] : 'var(--berry)'

  const dateLabel = new Intl.DateTimeFormat(i18nLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(today)

  return (
    <div className="section-gap">
      <section className="phase-hero" data-phase={phase || 'none'} aria-labelledby="today-title" style={{ '--tint': tint }}>
        <p className="card-kicker">{dateLabel}</p>
        <h1 id="today-title" style={{ marginTop: 8 }}>
          {phase ? t(`phase.${phase}.name`) : t('today.noCycleTitle')}
        </h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>
          {phase
            ? t('today.dayOf', { day, length: cycleLength })
            : t('today.noCycleBody')}
        </p>
        {phase && <p style={{ marginTop: 12, maxWidth: 560 }}>{t(`phase.${phase}.tip`)}</p>}
        {!phase && (
          <Link to="/settings" className="btn ghost" style={{ marginTop: 14 }}>
            {t('today.addDate')} <LuArrowRight aria-hidden="true" />
          </Link>
        )}
      </section>

      {prefs.reminders && (
        <section className="section-gap" aria-label={t('reminders.sectionLabel')}>
          <GentleReminder phase={phase} />
          <RotatingNote />
        </section>
      )}

      <section className="grid-2">
        <div className="card spot" style={{ display: 'grid', gap: 16 }}>
          <div className="between">
            <div>
              <p className="card-kicker">{t('today.checkInKicker')}</p>
              <h2>{entry ? t('today.checkedIn') : t('today.notCheckedIn')}</h2>
            </div>
            <LuCalendarHeart aria-hidden="true" style={{ color: 'var(--berry)' }} />
          </div>
          {entry ? (
            <>
              <Bar value={entry.mood} max={10} tint="var(--berry)" label={t('checkIn.mood')} />
              <Bar value={entry.energy} max={10} tint="var(--follicular)" label={t('checkIn.energy')} />
            </>
          ) : (
            <p className="muted">{t('today.checkInBody')}</p>
          )}
          <Link to="/check-in" className="btn block">
            {entry ? t('today.editCheckIn') : t('today.logCheckIn')}
          </Link>
        </div>

        {prefs.gamification && (
          <Link to="/journey" className="card spot" style={{ display: 'grid', gap: 12, textDecoration: 'none' }} aria-label={t('today.gardenLink')}>
            <div className="between">
              <div>
                <p className="card-kicker">{t('today.gardenKicker')}</p>
                <h2>{t(`garden.stage.${stage.id}`)}</h2>
              </div>
              <LuFlower2 aria-hidden="true" style={{ color: 'var(--follicular)' }} />
            </div>
            <Garden stage={stage.id} accent={journey.accent} title={t(`garden.stage.${stage.id}`)} />
            <p className="muted" style={{ fontSize: '0.92rem' }}>{t('today.gardenBody')}</p>
          </Link>
        )}
      </section>

      <section className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <LuLightbulb aria-hidden="true" style={{ color: 'var(--ovulatory)', flex: 'none', marginTop: 3 }} />
        <div>
          <p className="card-kicker">{t('today.tipKicker')}</p>
          <p style={{ marginTop: 4 }}>{t('today.tipBody')}</p>
        </div>
      </section>
    </div>
  )
}

const i18nLocale = () => (document.documentElement.lang === 'am' ? 'am-ET' : 'en-GB')

export default Today
