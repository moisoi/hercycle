import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiCheck, FiDroplet, FiShield } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { estimatePeriodEndDate as predictedEndDate, formatPeriodDate as formatDate, localDateString as today } from '../lib/period'

const phases = [
  { key: 'menstrual', icon: '🌙', color: '#b95073' },
  { key: 'follicular', icon: '🌱', color: '#53866b' },
  { key: 'ovulatory', icon: '☀️', color: '#c57535' },
  { key: 'luteal', icon: '🌸', color: '#7962a1' },
]

const readPendingDraft = () => {
  if (!isSupabaseConfigured) return null
  try {
    return JSON.parse(window.sessionStorage.getItem('hercycle.pendingCheckIn') || 'null')
  } catch {
    return null
  }
}

const CycleLog = ({ session }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [initialDraft] = useState(readPendingDraft)
  const [phase, setPhase] = useState(initialDraft?.phase || 'menstrual')
  const [mood, setMood] = useState(initialDraft?.mood || 5)
  const [energy, setEnergy] = useState(initialDraft?.energy || 5)
  const [libido, setLibido] = useState(initialDraft?.libido ?? null)
  const [period, setPeriod] = useState(Boolean(initialDraft?.period))
  const [date, setDate] = useState(initialDraft?.date || today())
  const [periodStartDate, setPeriodStartDate] = useState(initialDraft?.period_start_date || initialDraft?.periodStartDate || initialDraft?.date || today())
  const [periodDurationDays, setPeriodDurationDays] = useState(Number(initialDraft?.period_duration_days || initialDraft?.periodDurationDays) || 5)
  const [saveState, setSaveState] = useState('idle')
  const [saveNotice, setSaveNotice] = useState('')
  const [isLoadingExisting, setIsLoadingExisting] = useState(Boolean(session?.user?.id))
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadCheckIn = async () => {
      if (!session?.user?.id) {
        setIsLoadingExisting(false)
        return
      }
      if (initialDraft?.date === date) {
        setPhase(initialDraft.phase || 'menstrual')
        setMood(Number(initialDraft.mood) || 5)
        setEnergy(Number(initialDraft.energy) || 5)
        setLibido(initialDraft.libido ?? null)
        setPeriod(Boolean(initialDraft.period))
        setPeriodStartDate(initialDraft.period_start_date || initialDraft.periodStartDate || initialDraft.date || date)
        setPeriodDurationDays(Number(initialDraft.period_duration_days || initialDraft.periodDurationDays) || 5)
        setIsLoadingExisting(false)
        return
      }
      setIsLoadingExisting(true)
      const { data, error: queryError } = await supabase
        .from('cycles')
        .select('phase, mood, energy, libido, period, period_start_date, period_duration_days')
        .eq('user_id', session.user.id)
        .eq('date', date)
        .maybeSingle()
      if (!isMounted) return
      if (queryError) {
        console.error('Unable to load the selected check-in:', queryError)
      } else if (data) {
        setPhase(data.phase || 'menstrual')
        setMood(Number(data.mood) || 5)
        setEnergy(Number(data.energy) || 5)
        setLibido(data.libido ?? null)
        setPeriod(Boolean(data.period))
        setPeriodStartDate(data.period_start_date || date)
        setPeriodDurationDays(Number(data.period_duration_days) || 5)
      } else {
        setPhase('menstrual')
        setMood(5)
        setEnergy(5)
        setLibido(null)
        setPeriod(false)
        setPeriodStartDate(date)
        setPeriodDurationDays(5)
      }
      setIsLoadingExisting(false)
    }
    loadCheckIn().catch((queryError) => {
      console.error('Unable to load the selected check-in:', queryError)
      if (isMounted) setIsLoadingExisting(false)
    })
    return () => { isMounted = false }
  }, [session?.user?.id, date, initialDraft])

  const showPeriodDetails = period
  const estimatedPeriodEnd = showPeriodDetails ? predictedEndDate(periodStartDate, periodDurationDays) : ''

  const saveDraftAndSignIn = () => {
    if (isSupabaseConfigured) {
      try {
        window.sessionStorage.setItem('hercycle.pendingCheckIn', JSON.stringify({
          phase,
          mood,
          energy,
          libido,
          period,
          date,
          period_start_date: showPeriodDetails ? periodStartDate : null,
          period_duration_days: showPeriodDetails ? Number(periodDurationDays) : null,
        }))
      } catch {
        // The guest can still continue to sign in without a temporary draft.
      }
    }
    navigate('/auth')
  }

  const saveCheckIn = async (event) => {
    event.preventDefault()
    setError('')
    setSaveNotice('')

    const duration = Number(periodDurationDays)
    if (showPeriodDetails && (!periodStartDate || periodStartDate > today() || duration < 1 || duration > 10)) {
      setError(t('periodDetailsInvalid'))
      return
    }

    if (!session?.user?.id) {
      setSaveState('preview')
      setSaveNotice(t('guestCheckInNotSaved'))
      return
    }

    setSaveState('saving')
    try {
      const { error: saveError } = await supabase.from('cycles').upsert(
        {
          user_id: session.user.id,
          phase,
          mood,
          libido,
          energy,
          period,
          date,
          period_start_date: showPeriodDetails ? periodStartDate : null,
          period_duration_days: showPeriodDetails ? duration : null,
        },
        { onConflict: 'user_id,date' }
      )
      if (saveError) throw saveError
      setSaveState('saved')
      try {
        window.sessionStorage.removeItem('hercycle.pendingCheckIn')
      } catch {
        // The saved database record is already authoritative.
      }
      window.setTimeout(() => navigate('/'), 1100)
    } catch (saveError) {
      console.error('Unable to save check-in:', saveError)
      setError(saveError.message || t('errorGeneric'))
      setSaveState('idle')
    }
  }

  return (
    <div className="checkin-page">
      <motion.section className="checkin-intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow-label">A MOMENT FOR YOU</span>
        <h2>{t('dailyCheckIn')}</h2>
        <p>{t('checkInDescription')}</p>
      </motion.section>

      <form className="checkin-form" onSubmit={saveCheckIn}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step-number">01</span>
            <div><h3>{t('phaseQuestion')}</h3><p>Pick the phase that feels closest today.</p></div>
          </div>
          <div className="phase-choice-grid" role="radiogroup" aria-label={t('phaseQuestion')}>
            {phases.map((item) => (
              <motion.button
                key={item.key}
                type="button"
                className={`phase-choice-card${phase === item.key ? ' is-selected' : ''}`}
                style={{ '--choice-color': item.color }}
                role="radio"
                aria-checked={phase === item.key}
                onClick={() => { setPhase(item.key); setSaveState('idle') }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="phase-choice-icon">{item.icon}</span>
                <span>{t(`phase.${item.key}`)}</span>
                {phase === item.key && <FiCheck className="phase-choice-check" aria-hidden="true" />}
              </motion.button>
            ))}
          </div>

          <button
            type="button"
            className={`period-toggle${period ? ' is-on' : ''}`}
            aria-pressed={period}
            onClick={() => { setPeriod((value) => !value); setSaveState('idle') }}
          >
            <span className="period-toggle-icon"><FiDroplet aria-hidden="true" /></span>
            <span><strong>{t('periodQuestion')}</strong><small>Only share what you are comfortable sharing.</small></span>
            <span className="period-toggle-state">{period ? t('yes') : t('no')}</span>
          </button>

          {showPeriodDetails && (
            <div className="period-details-panel">
              <div className="period-details-heading">
                <span className="period-details-mark" aria-hidden="true">✿</span>
                <div><strong>{t('periodDetailsTitle')}</strong><p>{t('periodDetailsDescription')}</p></div>
              </div>
              <div className="period-details-fields">
                <label className="date-field">
                  <span>{t('periodStartDate')}</span>
                  <input
                    type="date"
                    max={today()}
                    value={periodStartDate}
                    onChange={(event) => { setPeriodStartDate(event.target.value); setSaveState('idle'); setSaveNotice('') }}
                    required
                  />
                </label>
                <label className="period-duration-field">
                  <span>{t('periodDuration')}</span>
                  <select value={periodDurationDays} onChange={(event) => { setPeriodDurationDays(Number(event.target.value)); setSaveState('idle'); setSaveNotice('') }}>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((days) => (
                      <option key={days} value={days}>{days} {days === 1 ? t('day') : t('days')}</option>
                    ))}
                  </select>
                </label>
              </div>
              {estimatedPeriodEnd && (
                <div className="period-estimate-card">
                  <span className="period-estimate-icon"><FiDroplet aria-hidden="true" /></span>
                  <div><span>{t('periodEstimatedLastDay')}</span><strong>{formatDate(estimatedPeriodEnd)}</strong><small>{t('periodEstimateDisclaimer')}</small></div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step-number">02</span>
            <div><h3>How are you arriving today?</h3><p>There is no right answer. Your check-in is just for you.</p></div>
          </div>
          <ScaleControl
            label={t('mood')}
            value={mood}
            onChange={(value) => { setMood(value); setSaveState('idle') }}
            lowLabel={t('moodLow')}
            highLabel={t('moodHigh')}
          />
          <ScaleControl
            label={t('energy')}
            value={energy}
            onChange={(value) => { setEnergy(value); setSaveState('idle') }}
            lowLabel={t('energyLow')}
            highLabel={t('energyHigh')}
          />
        </section>

        <section className="form-section form-section-optional">
          <div className="form-section-heading">
            <span className="form-step-number">03</span>
            <div><h3>{t('desireOptional')}</h3><p>{t('desireNote')}</p></div>
          </div>
          <div className="optional-scale-row" role="group" aria-label={t('desireOptional')}>
            {[['Skip', null], ['Low', 2], ['Moderate', 5], ['High', 10]].map(([label, value]) => (
              <button
                key={label}
                type="button"
                className={`scale-chip${libido === value ? ' is-selected' : ''}`}
                onClick={() => { setLibido(value); setSaveState('idle') }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="date-field">
            <span>Check-in date</span>
            <input type="date" max={today()} value={date} onChange={(event) => { setDate(event.target.value); setSaveState('idle') }} />
          </label>
        </section>

        {error && <Alert severity="error">{error}</Alert>}
        {saveNotice && <Alert severity="info">{saveNotice}</Alert>}
        {!session && (
          <div className="sign-in-nudge">
            <FiShield aria-hidden="true" />
            <span>{t('guestDataNotSaved')}</span>
            <button type="button" onClick={saveDraftAndSignIn}>{t('signInToSaveButton')}</button>
          </div>
        )}
        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={isLoadingExisting || saveState === 'saving'}
          className="form-submit-button"
        >
          {saveState === 'saving' ? 'Saving your check-in…' : saveState === 'saved' ? t('checkInSaved') : saveState === 'preview' ? t('checkInPreviewReady') : session ? t('saveCheckIn') : t('previewCheckIn')}
        </Button>
      </form>
    </div>
  )
}

const ScaleControl = ({ label, value, onChange, lowLabel, highLabel }) => (
  <div className="scale-control">
    <div className="scale-control-top"><strong>{label}</strong><span>{value}/10</span></div>
    <input
      type="range"
      min="1"
      max="10"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={label}
    />
    <div className="scale-control-ends"><span>{lowLabel}</span><span>{highLabel}</span></div>
  </div>
)

export default CycleLog
