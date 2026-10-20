import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheck } from 'react-icons/fi'

import CardBurst from '../components/CardBurst'
import Slider from '../components/Slider'
import { useBurst } from '../lib/celebrate'
import { cycleDayFor, phaseFor, toDateKey, parseDateKey } from '../lib/cycle'
import { formatDate } from '../lib/i18n'
import { runAwards } from '../lib/awards'
import { pushCheckin } from '../lib/sync'
import { getCheckins, saveCheckin, saveProfile, useCheckins, useProfile } from '../lib/store'

const PHASES = [
  { key: 'menstrual', icon: '🌙' },
  { key: 'follicular', icon: '🌱' },
  { key: 'ovulatory', icon: '☀️' },
  { key: 'luteal', icon: '🌸' },
]

const moodWordKey = (value) => (value <= 3 ? 'low' : value >= 8 ? 'high' : 'steady')

const CycleLog = ({ session, client }) => {
  const { t } = useTranslation()
  const profile = useProfile()
  const checkins = useCheckins()
  const today = toDateKey(new Date())
  const profileRef = useRef(profile)
  profileRef.current = profile
  const [date, setDate] = useState(today)
  const [phase, setPhase] = useState(null)
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [period, setPeriod] = useState(false)
  const [periodStart, setPeriodStart] = useState(today)
  const [periodDuration, setPeriodDuration] = useState(profile.periodLength || 5)
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [dirty, setDirty] = useState(false)
  const [burstKey, fireBurst] = useBurst()
  const [phaseBurst, firePhaseBurst] = useBurst()

  // Load the chosen day from the device cache. Runs when the day changes only, so saving the
  // profile does not reset the form or the saved message. The profile is read through a ref.
  useEffect(() => {
    const current = profileRef.current
    const entry = getCheckins()[date]
    const derived = phaseFor(cycleDayFor(parseDateKey(date), current.lastPeriodStart, current.cycleLength), {
      cycleLength: current.cycleLength,
      periodLength: current.periodLength,
    })
    setPhase(entry?.phase || derived || null)
    setMood(entry?.mood ?? 5)
    setEnergy(entry?.energy ?? 5)
    setPeriod(Boolean(entry?.period))
    setPeriodStart(entry?.periodStart || date)
    setPeriodDuration(entry?.periodDuration || current.periodLength || 5)
    setDirty(false)
    setStatus({ state: 'idle', message: '' })
  }, [date])

  // When today's entry arrives from the account, refresh the form once if nothing was edited yet.
  useEffect(() => {
    if (dirty) return
    const entry = checkins[date]
    if (!entry) return
    setPhase(entry.phase || null)
    setMood(entry.mood ?? 5)
    setEnergy(entry.energy ?? 5)
    setPeriod(Boolean(entry.period))
  }, [checkins, date, dirty])

  const edit = (apply) => {
    apply()
    setDirty(true)
    setStatus((current) => (current.state === 'saved' ? { state: 'idle', message: '' } : current))
  }

  const choosePhase = (key) => {
    edit(() => setPhase(key))
    firePhaseBurst('vibe')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!phase) {
      setStatus({ state: 'error', message: t('checkIn.pickPhase') })
      return
    }
    if (period) {
      const startKey = parseDateKey(periodStart)
      if (!startKey || periodStart > today || periodDuration < 1 || periodDuration > 10) {
        setStatus({ state: 'error', message: t('checkIn.periodInvalid') })
        return
      }
    }

    setStatus({ state: 'saving', message: '' })
    const entry = {
      phase,
      mood,
      energy,
      period,
      periodStart: period ? periodStart : null,
      periodDuration: period ? Number(periodDuration) : null,
    }
    saveCheckin(date, entry)

    if (period && (!profile.lastPeriodStart || periodStart > profile.lastPeriodStart)) {
      saveProfile({ lastPeriodStart: periodStart })
    }

    setDirty(false)
    fireBurst('progress')
    runAwards(t)

    if (session?.user?.id && client) {
      const result = await pushCheckin(client, session.user.id, date, entry)
      if (!result.ok) {
        setStatus({ state: 'error', message: t('checkIn.savedDeviceOnly', { error: result.error }) })
        return
      }
      setStatus({ state: 'saved', message: t('checkIn.savedAccount') })
      return
    }
    setStatus({ state: 'saved', message: t('checkIn.savedDevice') })
  }

  const dateLabel = formatDate(parseDateKey(date), { weekday: 'long', month: 'long', day: 'numeric' })
  const isToday = date === today
  const selectedPhaseLabel = phase ? t(`phase.${phase}`) : t('checkIn.notChosen')

  return (
    <form className="page checkin-page" onSubmit={submit} noValidate>
      <section className="card date-card">
        <label htmlFor="checkin-date" className="field-label">{t('checkIn.dateLabel')}</label>
        <div className="date-row">
          <input
            id="checkin-date"
            type="date"
            max={today}
            value={date}
            onChange={(event) => event.target.value && setDate(event.target.value)}
          />
          <span className="date-caption">{isToday ? t('checkIn.today') : dateLabel}</span>
        </div>
      </section>

      <section className="card" aria-labelledby="phase-heading">
        <h2 id="phase-heading" className="card-title">{t('checkIn.phaseHeading')}</h2>
        <p className="card-copy">{t('checkIn.phaseCopy')}</p>
        <div className="phase-choice-grid" role="radiogroup" aria-label={t('checkIn.phaseHeading')}>
          {PHASES.map(({ key, icon }) => {
            const selected = phase === key
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`phase-choice phase-${key}${selected ? ' is-selected' : ''} spot`}
                onClick={() => choosePhase(key)}
              >
                <span className="phase-choice-icon" aria-hidden="true">{icon}</span>
                <strong>{t(`phase.${key}`)}</strong>
                {selected && <FiCheck className="phase-choice-check" aria-hidden="true" />}
                {selected && <CardBurst burstKey={phaseBurst} context={key} />}
              </button>
            )
          })}
        </div>
        <p className="card-footnote">{t('checkIn.selectedPhase', { phase: selectedPhaseLabel })}</p>
      </section>

      <section className="card" aria-labelledby="feel-heading">
        <h2 id="feel-heading" className="card-title">{t('checkIn.feelHeading')}</h2>
        <Slider
          id="checkin-mood"
          label={t('checkIn.mood')}
          value={mood}
          min={1}
          max={10}
          tone="berry"
          format={(value) => `${value} · ${t(`moodWord.${moodWordKey(value)}`)}`}
          onChange={(value) => edit(() => setMood(value))}
          hint={t('checkIn.moodHint')}
        />
        <Slider
          id="checkin-energy"
          label={t('checkIn.energy')}
          value={energy}
          min={1}
          max={10}
          tone="sage"
          format={(value) => `${value} · ${t(`energyWord.${moodWordKey(value)}`)}`}
          onChange={(value) => edit(() => setEnergy(value))}
          hint={t('checkIn.energyHint')}
        />
      </section>

      <section className="card" aria-labelledby="period-heading">
        <div className="toggle-row">
          <div>
            <h2 id="period-heading" className="card-title">{t('checkIn.periodHeading')}</h2>
            <p className="card-copy">{t('checkIn.periodCopy')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={period}
            aria-label={t('checkIn.periodHeading')}
            className={`switch${period ? ' is-on' : ''}`}
            onClick={() => edit(() => setPeriod((value) => !value))}
          >
            <span />
          </button>
        </div>
        {period && (
          <div className="period-details">
            <label className="field">
              <span className="field-label">{t('checkIn.periodStart')}</span>
              <input type="date" max={today} value={periodStart} onChange={(event) => edit(() => setPeriodStart(event.target.value))} />
            </label>
            <Slider
              id="checkin-period-duration"
              label={t('checkIn.periodDuration')}
              min={1}
              max={10}
              value={periodDuration}
              tone="rose"
              format={(value) => t('checkIn.days', { count: value })}
              onChange={(value) => edit(() => setPeriodDuration(value))}
            />
          </div>
        )}
      </section>

      <div className="save-row" aria-live="polite">
        <button type="submit" className="primary-button spot" disabled={status.state === 'saving'}>
          {status.state === 'saving' ? t('checkIn.saving') : t('checkIn.save')}
        </button>
        <CardBurst burstKey={burstKey} context="progress" />
        {status.state === 'saved' && <p className="save-state is-saved" role="status">{status.message}</p>}
        {status.state === 'error' && <p className="save-state is-error" role="alert">{status.message}</p>}
        {status.state === 'idle' && dirty && <p className="save-state">{t('checkIn.unsaved')}</p>}
      </div>
    </form>
  )
}

export default CycleLog
