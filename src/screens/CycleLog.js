import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiCheck, FiDroplet } from 'react-icons/fi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import CardBurst from '../components/CardBurst'
import { PrivacyShieldEmblem } from '../components/SplashScreen'
import { loadPreferences, loadUserCycles, saveCycleEntry } from '../lib/care'
import { recordJourneyActivity } from '../lib/journey'
import {
  estimatePeriodEndDate as predictedEndDate,
  formatDisplayDate,
  localDateString as today,
} from '../lib/period'

const phases = [
  { key: 'menstrual', icon: '🌙', color: '#b95073' },
  { key: 'follicular', icon: '🌱', color: '#53866b' },
  { key: 'ovulatory', icon: '☀️', color: '#c57535' },
  { key: 'luteal', icon: '🌸', color: '#7962a1' },
]

const readPendingDraft = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem('hercycle.pendingCheckIn') || 'null')
  } catch {
    return null
  }
}

const CycleLog = ({ session }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'
  const reduceMotion = Boolean(loadPreferences().reduceMotion)

  const [initialDraft] = useState(readPendingDraft)
  const [phase, setPhase] = useState(initialDraft?.phase || 'menstrual')
  const [mood, setMood] = useState(Number(initialDraft?.mood) || 6)
  const [energy, setEnergy] = useState(Number(initialDraft?.energy) || 6)
  const [libido, setLibido] = useState(initialDraft?.libido ?? null)
  const [period, setPeriod] = useState(Boolean(initialDraft?.period))
  const [date, setDate] = useState(initialDraft?.date || today())
  const [periodStartDate, setPeriodStartDate] = useState(
    initialDraft?.period_start_date || initialDraft?.periodStartDate || initialDraft?.date || today()
  )
  const [periodDurationDays, setPeriodDurationDays] = useState(
    Number(initialDraft?.period_duration_days || initialDraft?.periodDurationDays) || 5
  )
  const [saveState, setSaveState] = useState('idle')
  const [saveNotice, setSaveNotice] = useState('')
  const [isLoadingExisting, setIsLoadingExisting] = useState(false)
  const [error, setError] = useState('')
  const [burstKey, setBurstKey] = useState(0)
  const [arrivingBurstKey, setArrivingBurstKey] = useState(0)
  const [saveBurstKey, setSaveBurstKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    const loadCheckIn = async () => {
      if (initialDraft?.date === date) {
        setPhase(initialDraft.phase || 'menstrual')
        setMood(Number(initialDraft.mood) || 6)
        setEnergy(Number(initialDraft.energy) || 6)
        setLibido(initialDraft.libido ?? null)
        setPeriod(Boolean(initialDraft.period))
        setPeriodStartDate(
          initialDraft.period_start_date || initialDraft.periodStartDate || initialDraft.date || date
        )
        setPeriodDurationDays(
          Number(initialDraft.period_duration_days || initialDraft.periodDurationDays) || 5
        )
        return
      }

      if (userId) {
        setIsLoadingExisting(true)
      }
      try {
        const entries = await loadUserCycles(userId)
        if (!isMounted) return
        const match = entries.find((item) => item.date === date)
        if (match) {
          setPhase(match.phase || 'menstrual')
          setMood(Number(match.mood) || 6)
          setEnergy(Number(match.energy) || 6)
          setLibido(match.libido ?? null)
          setPeriod(Boolean(match.period))
          setPeriodStartDate(match.period_start_date || date)
          setPeriodDurationDays(Number(match.period_duration_days) || 5)
        } else {
          setPeriodStartDate(date)
        }
      } catch (queryError) {
        console.error('Unable to load selected check-in:', queryError)
      } finally {
        if (isMounted) setIsLoadingExisting(false)
      }
    }

    loadCheckIn()
    return () => {
      isMounted = false
    }
  }, [date, initialDraft, userId])

  const showPeriodDetails = period
  const estimatedPeriodEnd = showPeriodDetails
    ? predictedEndDate(periodStartDate, periodDurationDays)
    : ''

  const moodReaction =
    mood <= 4 ? t('moodReactionLow') : mood <= 7 ? t('moodReactionMid') : t('moodReactionHigh')
  const energyReaction =
    energy <= 4
      ? t('energyReactionLow')
      : energy <= 7
      ? t('energyReactionMid')
      : t('energyReactionHigh')

  const saveDraftAndSignIn = () => {
    try {
      window.sessionStorage.setItem(
        'hercycle.pendingCheckIn',
        JSON.stringify({
          phase,
          mood,
          energy,
          libido,
          period,
          date,
          period_start_date: showPeriodDetails ? periodStartDate : null,
          period_duration_days: showPeriodDetails ? Number(periodDurationDays) : null,
        })
      )
    } catch {
      // Guest can still sign in cleanly.
    }
    navigate('/signin', { state: { from: '/log' } })
  }

  const saveCheckIn = async (event) => {
    event.preventDefault()
    setError('')
    setSaveNotice('')

    const duration = Number(periodDurationDays)
    if (
      showPeriodDetails &&
      (!periodStartDate || periodStartDate > today() || duration < 1 || duration > 10)
    ) {
      setError(t('periodDetailsInvalid'))
      return
    }

    setSaveState('saving')
    try {
      const { entries } = await saveCycleEntry(userId, {
        phase,
        mood,
        libido,
        energy,
        period,
        date,
        period_start_date: showPeriodDetails ? periodStartDate : null,
        period_duration_days: showPeriodDetails ? duration : null,
      })

      recordJourneyActivity(
        userId,
        'check_in',
        {
          labelEn: `Logged check-in (${i18n.getFixedT('en')(`phase.${phase}`)})`,
          labelAm: `የዕለት ምዝገባ (${i18n.getFixedT('am')(`phase.${phase}`)})`,
        },
        { cycleCount: entries.length }
      )

      setBurstKey((prev) => prev + 1)
      setSaveBurstKey((prev) => prev + 1)
      setSaveState('saved')

      if (!userId) {
        setSaveNotice(t('savedOnDeviceToast'))
      } else {
        try {
          window.sessionStorage.removeItem('hercycle.pendingCheckIn')
        } catch {
          // Ignore session cleanup errors.
        }
        window.setTimeout(() => navigate('/'), 900)
      }
    } catch (saveError) {
      console.error('Unable to save check-in:', saveError)
      setError(saveError.message || t('errorGeneric'))
      setSaveState('idle')
    }
  }

  return (
    <div className="checkin-page">
      <motion.section
        className="checkin-intro"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="eyebrow-label">{t('aMomentForYou')}</span>
        <h2>{t('dailyCheckIn')}</h2>
        <p>{t('checkInDescription')}</p>
      </motion.section>

      <section className="hc-live-compass-banner hc-spotlight-card" data-testid="live-checkin-compass">
        <span className="eyebrow-label">
          <AutoAwesomeRoundedIcon sx={{ fontSize: 13, mr: 0.6 }} />
          {t('liveCheckInImpactEyebrow')} · {t(`phase.${phase}`)}
        </span>
        <strong>{moodReaction}</strong>
        <p>{energyReaction}</p>
      </section>

      <form className="checkin-form" onSubmit={saveCheckIn}>
        <section className="form-section hc-spotlight-card" style={{ position: 'relative' }}>
          <CardBurst burstKey={burstKey} disabled={reduceMotion} />
          <div className="form-section-heading">
            <span className="form-step-number">01</span>
            <div>
              <h3>{t('phaseQuestion')}</h3>
              <p>{t('phaseQuestionSub')}</p>
            </div>
          </div>

          <div className="phase-choice-grid" role="radiogroup" aria-label={t('phaseQuestion')}>
            {phases.map((item) => {
              const isSelected = phase === item.key
              return (
                <motion.button
                  key={item.key}
                  type="button"
                  className={`phase-choice-card phase-choice-${item.key} hc-spotlight-btn${
                    isSelected ? ' is-selected' : ''
                  }`}
                  style={{ '--choice-color': item.color }}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setPhase(item.key)
                    setBurstKey((prev) => prev + 1)
                    setSaveState('idle')
                  }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="phase-choice-top">
                    <span className="phase-choice-orb" aria-hidden="true">
                      <span className="phase-choice-icon">{item.icon}</span>
                    </span>
                    <span className="phase-choice-check" aria-hidden="true">
                      <FiCheck />
                    </span>
                  </div>
                  <strong className="phase-choice-title">{t(`phase.${item.key}`)}</strong>
                  <small className="phase-choice-tagline">
                    {t(`phaseTagline.${item.key}`)}
                  </small>
                </motion.button>
              )
            })}
          </div>

          <button
            type="button"
            className={`period-toggle hc-spotlight-btn${period ? ' is-on' : ''}`}
            aria-pressed={period}
            onClick={() => {
              setPeriod((value) => !value)
              setBurstKey((prev) => prev + 1)
              setSaveState('idle')
            }}
          >
            <span className="period-toggle-icon">
              <FiDroplet aria-hidden="true" />
            </span>
            <span>
              <strong>{t('periodQuestion')}</strong>
              <small>{t('periodQuestionSub')}</small>
            </span>
            <span className="period-toggle-state">{period ? t('yes') : t('no')}</span>
          </button>

          {showPeriodDetails && (
            <div className="period-details-panel">
              <div className="period-details-heading">
                <span className="period-details-mark" aria-hidden="true">
                  ✿
                </span>
                <div>
                  <strong>{t('periodDetailsTitle')}</strong>
                  <p>{t('periodDetailsDescription')}</p>
                </div>
              </div>
              <div className="period-details-fields">
                <label className="date-field" htmlFor="period-start-date">
                  <span>{t('periodStartDate')}</span>
                  <input
                    id="period-start-date"
                    type="date"
                    value={periodStartDate}
                    max={today()}
                    onChange={(event) => {
                      setPeriodStartDate(event.target.value)
                      setSaveState('idle')
                    }}
                  />
                </label>

                <label className="period-duration-field" htmlFor="period-duration-days">
                  <span>{t('periodDuration')}</span>
                  <select
                    id="period-duration-days"
                    value={periodDurationDays}
                    onChange={(event) => {
                      setPeriodDurationDays(Number(event.target.value))
                      setSaveState('idle')
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? t('day') : t('days')}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {estimatedPeriodEnd && (
                <div className="period-estimate-card">
                  <div className="period-estimate-icon" aria-hidden="true">
                    <FiDroplet />
                  </div>
                  <div>
                    <span>{t('periodEstimatedLastDay')}</span>
                    <strong>{formatDisplayDate(estimatedPeriodEnd, locale)}</strong>
                    <small>{t('periodEstimateDisclaimer')}</small>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section
          className="form-section hc-arriving-card hc-spotlight-card"
          style={{ position: 'relative' }}
        >
          <CardBurst burstKey={arrivingBurstKey} disabled={reduceMotion} />
          <div className="form-section-heading">
            <span className="form-step-number">02</span>
            <div>
              <h3>{t('howArrivingTitle')}</h3>
              <p>{t('howArrivingSub')}</p>
            </div>
          </div>

          <ScaleInput
            id="mood-scale"
            label={t('mood')}
            value={mood}
            lowLabel={t('moodLow')}
            midLabel={t('moodOkay')}
            highLabel={t('moodHigh')}
            onChange={(value) => {
              setMood(value)
              setArrivingBurstKey((prev) => prev + 1)
              setSaveState('idle')
            }}
          />

          <ScaleInput
            id="energy-scale"
            label={t('energy')}
            value={energy}
            lowLabel={t('energyLow')}
            midLabel={t('energyMedium')}
            highLabel={t('energyHigh')}
            onChange={(value) => {
              setEnergy(value)
              setArrivingBurstKey((prev) => prev + 1)
              setSaveState('idle')
            }}
          />

          <div className="optional-scale">
            <div className="scale-control-top">
              <label htmlFor="desire-skip">{t('desireOptional')}</label>
              <span className="hc-scale-value-pill">{libido ? `${libido}/10` : t('skip')}</span>
            </div>
            <p className="field-note">{t('desireNote')}</p>
            <div className="optional-scale-row">
              <button
                id="desire-skip"
                type="button"
                className={`scale-chip${libido === null ? ' is-selected' : ''}`}
                onClick={() => {
                  setLibido(null)
                  setArrivingBurstKey((prev) => prev + 1)
                  setSaveState('idle')
                }}
              >
                {t('skip')}
              </button>
              {[2, 4, 6, 8, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`scale-chip${libido === value ? ' is-selected' : ''}`}
                  onClick={() => {
                    setLibido(value)
                    setArrivingBurstKey((prev) => prev + 1)
                    setSaveState('idle')
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="date-field-group">
            <label className="date-field" htmlFor="checkin-date">
              <span>{t('checkInDateLabel')}</span>
              <input
                id="checkin-date"
                type="date"
                value={date}
                max={today()}
                onChange={(event) => {
                  setDate(event.target.value)
                  setSaveState('idle')
                }}
              />
            </label>
            <div
              className="hc-quick-date-row"
              role="group"
              aria-label={t('quickDateSelection')}
            >
              {[0, 1, 2].map((daysAgo) => {
                const d = new Date()
                d.setDate(d.getDate() - daysAgo)
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                  d.getDate()
                ).padStart(2, '0')}`
                const label =
                  daysAgo === 0
                    ? t('todayShort')
                    : daysAgo === 1
                    ? t('yesterdayShort')
                    : formatDisplayDate(iso, locale)
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`hc-quick-date-chip${date === iso ? ' is-selected' : ''}`}
                    onClick={() => {
                      setDate(iso)
                      setSaveState('idle')
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {error && <Alert severity="error">{error}</Alert>}
        {saveNotice && <Alert severity="success">{saveNotice}</Alert>}

        {!session && (
          <div className="guest-save-note hc-spotlight-card">
            <PrivacyShieldEmblem compact />
            <span className="guest-save-copy">{t('guestDataNotSaved')}</span>
            <button
              type="button"
              className="hc-guest-signin-pill hc-spotlight-btn"
              onClick={saveDraftAndSignIn}
            >
              {t('signInToSaveButton')}
            </button>
          </div>
        )}

        <div className="hc-page-bottom-cta" style={{ position: 'relative' }}>
          <CardBurst burstKey={saveBurstKey} disabled={reduceMotion} />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoadingExisting || saveState === 'saving'}
            className="form-submit-button hc-spotlight-btn"
          >
            {saveState === 'saving'
              ? t('savingCheckIn')
              : saveState === 'saved'
              ? t('checkInSaved')
              : session
              ? t('saveAndContinue')
              : t('saveOnDevice')}
          </Button>
        </div>
      </form>
    </div>
  )
}

const ScaleInput = ({ id, label, value, lowLabel, midLabel, highLabel, onChange }) => {
  const fillPct = `${Math.round(((value - 1) / 9) * 100)}%`
  return (
    <div className="scale-control hc-scale-card" style={{ '--fill-pct': fillPct }}>
      <div className="scale-control-top">
        <label htmlFor={id}>{label}</label>
        <span className="hc-scale-value-pill">{value} / 10</span>
      </div>
      <input
        id={id}
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="scale-control-ends">
        <span>{lowLabel}</span>
        <span>{midLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

export default CycleLog
