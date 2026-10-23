import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiDroplet,
  FiHeart,
  FiMessageCircle,
} from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import BotanicalProgressRing from '../components/BotanicalProgressRing'
import CardBurst from '../components/CardBurst'
import Dashboard from '../components/Dashboard'
import RotatingReminderText from '../components/RotatingReminderText'
import { PrivacyShieldEmblem } from '../components/SplashScreen'
import {
  importGuestDataToAccount,
  inspectLocalGuestData,
  isGuestImportDismissed,
  markGuestImportDismissed,
} from '../lib/account'
import { loadPreferences, loadUserCycles } from '../lib/care'
import {
  computeGardenProgress,
  computeGardenResources,
  loadJourneyState,
} from '../lib/journey'
import {
  cycleDayFor,
  estimatePeriodEndDate,
  formatDisplayDate,
  localDateString,
} from '../lib/period'
import { buildLittleReminderPool } from '../lib/reminders'
import { supabase } from '../lib/supabase'

const phaseDetails = {
  menstrual: { icon: '🌙', tint: 'rose' },
  follicular: { icon: '🌱', tint: 'sage' },
  ovulatory: { icon: '☀️', tint: 'peach' },
  luteal: { icon: '🌸', tint: 'lilac' },
}

const Home = ({ session }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const [cycles, setCycles] = useState([])
  const [settings, setSettings] = useState(null)
  const [prefs, setPrefs] = useState(() => loadPreferences())
  const [journeyState, setJourneyState] = useState(() => loadJourneyState(userId))
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [guestSummary, setGuestSummary] = useState(null)
  const [importNotice, setImportNotice] = useState('')
  const [gardenBurstKey, setGardenBurstKey] = useState(0)
  const [statBursts, setStatBursts] = useState({ days: 0, mood: 0, insights: 0 })

  const gardenResources = useMemo(
    () => computeGardenResources(journeyState, cycles.length),
    [cycles.length, journeyState]
  )

  const refreshHome = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const loadedCycles = await loadUserCycles(userId)
      setCycles(loadedCycles)
      setJourneyState(loadJourneyState(userId))

      if (userId && supabase) {
        const { data: settingsRow } = await supabase
          .from('user_settings')
          .select('phase_selected, tone_preference')
          .eq('user_id', userId)
          .maybeSingle()
        setSettings(settingsRow || null)

        const localSummary = inspectLocalGuestData()
        if (localSummary.hasGuestData && !isGuestImportDismissed(userId)) {
          setGuestSummary(localSummary)
        } else {
          setGuestSummary(null)
        }
      } else {
        setGuestSummary(null)
      }
    } catch (error) {
      console.error('Unable to load dashboard data:', error)
      setLoadError(t('errorGeneric'))
    } finally {
      setIsLoading(false)
    }
  }, [t, userId])

  useEffect(() => {
    refreshHome()
    const onDataChanged = () => refreshHome()
    const onPrefsChanged = () => setPrefs(loadPreferences())
    window.addEventListener('hercycle:data-changed', onDataChanged)
    window.addEventListener('hercycle:preferences-changed', onPrefsChanged)
    return () => {
      window.removeEventListener('hercycle:data-changed', onDataChanged)
      window.removeEventListener('hercycle:preferences-changed', onPrefsChanged)
    }
  }, [refreshHome])

  const handleGuestImport = async (conflictStrategy) => {
    if (!userId) return
    try {
      const result = await importGuestDataToAccount(supabase, userId, { conflictStrategy })
      markGuestImportDismissed(userId)
      setGuestSummary(null)
      setImportNotice(
        t('guestImportDone', { count: result.importedCycles + result.importedIntimacy })
      )
      await refreshHome()
    } catch (error) {
      setLoadError(error.message || t('errorGeneric'))
    }
  }

  const dismissGuestImport = () => {
    if (userId) markGuestImportDismissed(userId)
    setGuestSummary(null)
  }

  const latestCheckIn = cycles[0] || null
  const todayDate = localDateString()
  const activeCycleDay = useMemo(() => cycleDayFor(cycles, todayDate), [cycles, todayDate])

  const currentPeriodPrediction = useMemo(
    () =>
      cycles.find((entry) => {
        const endDate = estimatePeriodEndDate(entry.period_start_date, entry.period_duration_days)
        return Boolean(
          entry.period_start_date &&
            endDate &&
            entry.period_start_date <= todayDate &&
            endDate >= todayDate
        )
      }),
    [cycles, todayDate]
  )

  let localOnboarding = {}
  try {
    localOnboarding = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
  } catch {
    localOnboarding = {}
  }

  const onboardingPhase = localOnboarding.phase_selected || null
  const activePhase = latestCheckIn?.phase || settings?.phase_selected || onboardingPhase
  const phaseInfo = activePhase ? phaseDetails[activePhase] : null
  const tone = settings?.tone_preference || localOnboarding.tone_preference || 'balanced'

  const littleReminderPool = useMemo(
    () =>
      buildLittleReminderPool({
        tone,
        phase: activePhase || '',
        locale,
      }),
    [activePhase, locale, tone]
  )

  const averageMood = useMemo(() => {
    const values = cycles
      .map((entry) => Number(entry.mood))
      .filter((v) => Number.isFinite(v) && v > 0)
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
  }, [cycles])

  const garden = useMemo(
    () => computeGardenProgress(journeyState, cycles.length),
    [cycles.length, journeyState]
  )

  const reduceMotion = Boolean(prefs.reduceMotion)

  return (
    <div className="dashboard-page">
      {loadError && (
        <Alert severity="warning" className="dashboard-alert">
          {loadError}
        </Alert>
      )}
      {importNotice && (
        <Alert severity="success" className="dashboard-alert" onClose={() => setImportNotice('')}>
          {importNotice}
        </Alert>
      )}

      {guestSummary && (
        <section className="hc-guest-import-banner hc-spotlight-card" data-testid="guest-import-banner">
          <div>
            <strong>{t('guestImportTitle')}</strong>
            <p>
              {t('guestImportBody', {
                cycleCount: guestSummary.cycleCount,
                intimacyCount: guestSummary.intimacyCount,
              })}
            </p>
          </div>
          <div className="hc-guest-import-actions">
            <Button
              type="button"
              size="small"
              variant="contained"
              disableElevation
              className="form-submit-button hc-spotlight-btn"
              onClick={() => handleGuestImport('keep_account')}
            >
              {t('guestImportKeepAccount')}
            </Button>
            <button
              type="button"
              className="partner-copy-button hc-spotlight-btn"
              onClick={() => handleGuestImport('prefer_device')}
            >
              {t('guestImportPreferDevice')}
            </button>
            <button
              type="button"
              className="hc-link-muted"
              onClick={dismissGuestImport}
            >
              {t('guestImportDismiss')}
            </button>
          </div>
        </section>
      )}

      <motion.section
        className="dashboard-welcome-row"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div>
          <span className="eyebrow-label">{t('noteFromBody')}</span>
          <h2>{t('goodMorning')}</h2>
          <p>{t('dashboardDescription')}</p>
        </div>
        <div className="dashboard-date-badge">
          <FiCalendar aria-hidden="true" /> {formatDisplayDate(todayDate, locale)}
        </div>
      </motion.section>

      <div className="dashboard-feature-grid">
        <motion.section
          className={`phase-spotlight hc-spotlight-card${
            phaseInfo ? ` phase-spotlight-${phaseInfo.tint}` : ' phase-spotlight-quiet'
          }`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="phase-spotlight-topline">
            <span>{t('cycleSpotlight')}</span>
            <span className="phase-spotlight-orbit" aria-hidden="true">
              {phaseInfo?.icon || '✧'}
            </span>
          </div>
          {isLoading ? (
            <div className="dashboard-skeleton-group">
              <Skeleton width="55%" height={46} />
              <Skeleton width="90%" />
              <Skeleton width="70%" />
            </div>
          ) : activePhase ? (
            <>
              <div className="phase-label-row">
                <span className="phase-symbol" aria-hidden="true">
                  {phaseInfo?.icon}
                </span>
                <span className="phase-name">{t(`phase.${activePhase}`)}</span>
                {activeCycleDay ? (
                  <span className="hc-cycle-day-pill">
                    {t('cycleDayBadge', { day: activeCycleDay })}
                  </span>
                ) : null}
              </div>
              <p className="phase-description">{t(`phaseDescription.${activePhase}`)}</p>
              <p className="phase-meta">
                {latestCheckIn
                  ? `${t('lastCheckIn')}: ${formatDisplayDate(latestCheckIn.date, locale)}`
                  : t('noCheckIns')}
              </p>
            </>
          ) : (
            <>
              <div className="phase-label-row">
                <span className="phase-symbol phase-symbol-empty" aria-hidden="true">
                  ✧
                </span>
                <span className="phase-name">{t('rhythmYourWay')}</span>
              </div>
              <p className="phase-description">{t('rhythmEmptyDesc')}</p>
              <p className="phase-meta">{t('rhythmEmptyMeta')}</p>
            </>
          )}
          <Button
            variant="outlined"
            className="phase-spotlight-button hc-spotlight-btn"
            onClick={() => navigate('/log')}
            endIcon={<FiArrowRight aria-hidden="true" />}
          >
            {cycles.length ? t('logToday') : t('startFirstCheckIn')}
          </Button>
        </motion.section>

        <motion.section
          className="mascot-card hc-spotlight-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          data-testid="home-little-reminder"
        >
          <div className="mascot-card-topline">
            <span className="mascot-card-kicker">{t('littleReminderLabel')}</span>
            <span className="mascot-card-pulse" aria-hidden="true">
              <i />
              <span>✦</span>
            </span>
          </div>

          <div className="mascot-card-center">
            <motion.div
              className="mascot-illustration"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              <div className="mascot-halo" />
              <div className="mascot-halo-inner" />
              <GiLotus className="mascot-lotus" />
              <span className="mascot-spark mascot-spark-left">✦</span>
              <span className="mascot-spark mascot-spark-right">✧</span>
            </motion.div>

            <div className="hc-mascot-rotating-wrap">
              <RotatingReminderText
                as="p"
                className="mascot-message"
                messages={littleReminderPool}
                intervalMs={5000}
              />
            </div>
          </div>

          <span className="mascot-signature">
            <span className="mascot-signature-star" aria-hidden="true">
              ✦
            </span>
            <span className="mascot-signature-lead">{t('lunaSays')}</span>
            <span className="mascot-signature-dot" aria-hidden="true">
              ·
            </span>
            <em>{t('withLove')}</em>
          </span>
        </motion.section>
      </div>

      {currentPeriodPrediction && (
        <section className="period-prediction-card hc-spotlight-card">
          <div className="period-prediction-icon" aria-hidden="true">
            <FiDroplet />
          </div>
          <div>
            <span className="eyebrow-label">{t('periodEstimateTitle')}</span>
            <strong>
              {t('periodEstimateEnds', {
                date: formatDisplayDate(
                  estimatePeriodEndDate(
                    currentPeriodPrediction.period_start_date,
                    currentPeriodPrediction.period_duration_days
                  ),
                  locale
                ),
              })}
            </strong>
            <p>{t('periodEstimateDashboardNote')}</p>
          </div>
        </section>
      )}

      {prefs.journeyEnabled !== false && (
        <motion.section
          className="hc-garden-home-card hc-spotlight-card"
          style={{ position: 'relative' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="home-garden-card"
        >
          <CardBurst burstKey={gardenBurstKey} disabled={reduceMotion} />

          <div className="hc-garden-home-copy">
            <div className="hc-garden-home-pills">
              <span className="eyebrow-label hc-garden-eyebrow">
                <LocalFloristRoundedIcon sx={{ fontSize: 13 }} />
                {t('gardenHomeEyebrow')}
              </span>
              <span className="hc-garden-pill">
                {t('gardenSeedsResource', { count: gardenResources.availableSeeds })}
              </span>
              <span className="hc-garden-pill hc-water-pill">
                <FiDroplet aria-hidden="true" />
                {t('gardenWaterResource', { count: gardenResources.availableWater })}
              </span>
            </div>

            <h3>{t('gardenHomeTitle')}</h3>
            <p className="hc-garden-home-desc">{t('gardenHomeBody')}</p>

            <div className="hc-garden-home-meta">
              <BotanicalProgressRing
                stage={garden.stage}
                progressPercent={garden.progressPercent}
                seeds={garden.points}
                size={80}
              />
              <div className="hc-garden-home-stage-info">
                <div className="hc-garden-stage-head">
                  <strong>
                    {locale === 'am'
                      ? garden.currentStage.amTitle || garden.currentStage.nameAm
                      : garden.currentStage.enTitle || garden.currentStage.nameEn}
                  </strong>
                  <em>{garden.progressPercent}%</em>
                </div>
                <div className="hc-garden-progress-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(10, garden.progressPercent)}%` }} />
                </div>
                <span className="hc-garden-next-caption">
                  {garden.nextStage
                    ? t('gardenNextStage', {
                        name:
                          locale === 'am'
                            ? garden.nextStage.amTitle || garden.nextStage.nameAm
                            : garden.nextStage.enTitle || garden.nextStage.nameEn,
                        percent: garden.progressPercent,
                      })
                    : t('gardenFullBloom')}
                </span>
              </div>
            </div>

            <div className="hc-garden-home-actions">
              <Button
                type="button"
                size="small"
                variant="outlined"
                className="phase-spotlight-button hc-spotlight-btn"
                endIcon={<FiArrowRight aria-hidden="true" />}
                onClick={() => {
                  setGardenBurstKey((prev) => prev + 1)
                  window.setTimeout(() => navigate('/journey'), 240)
                }}
              >
                {t('gardenOpenCta')}
              </Button>
            </div>
          </div>

          {/* Luxury Conservatory Hold Card: only the garden illustration is scheduled for the next update */}
          <div
            className="hc-garden-upcoming-card is-compact"
            data-testid="home-garden-upcoming-card"
            role="button"
            tabIndex={0}
            aria-label={t('gardenOpenCta')}
            onClick={() => {
              setGardenBurstKey((prev) => prev + 1)
              window.setTimeout(() => navigate('/journey'), 240)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate('/journey')
              }
            }}
          >
            <span className="hc-garden-upcoming-badge">
              <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
              <span>{t('gardenUpcomingBadge')}</span>
            </span>
            <div className="hc-garden-upcoming-emblem" aria-hidden="true">
              <GiLotus />
            </div>
            <strong>{t('gardenUpcomingTitle')}</strong>
            <p>{t('gardenUpcomingShortBody')}</p>
          </div>
        </motion.section>
      )}

      <Dashboard
        latestEntry={latestCheckIn}
        cycleDay={activeCycleDay}
        seeds={garden.points}
        stage={garden.stage}
        onQuickLog={() => navigate('/log')}
      />

      <motion.section
        className="luna-home-invitation hc-spotlight-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
      >
        <div className="luna-home-invitation-icon" aria-hidden="true">
          <GiLotus />
          <i>✦</i>
        </div>
        <div className="luna-home-invitation-copy">
          <span>{t('lunaHomeEyebrow')}</span>
          <strong>{t('lunaHomeHeading')}</strong>
          <p>{t('lunaHomeDescription')}</p>
        </div>
        <button
          type="button"
          className="luna-home-invitation-button hc-spotlight-btn"
          onClick={() => navigate('/luna')}
        >
          <FiMessageCircle aria-hidden="true" />
          <span>{t('lunaHomeButton')}</span>
        </button>
      </motion.section>

      <section className="dashboard-stats" aria-label={t('yourPatterns')}>
        <motion.button
          type="button"
          className="stat-card stat-card-action hc-spotlight-card"
          style={{ position: 'relative' }}
          onClick={() => {
            setStatBursts((prev) => ({ ...prev, days: prev.days + 1 }))
            window.setTimeout(() => navigate('/log'), 220)
          }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
        >
          <CardBurst burstKey={statBursts.days} disabled={reduceMotion} />
          <span className="stat-icon stat-icon-rose">
            <FiDroplet aria-hidden="true" />
          </span>
          <div className="hc-stat-card-body">
            <span className="stat-label">{t('daysTracked')}</span>
            <strong>{isLoading ? '—' : cycles.length}</strong>
            <div className="hc-metric-bar hc-metric-bar-rose" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(12, cycles.length * 10))}%` }} />
            </div>
            <small>{t('last30Days')}</small>
          </div>
          <FiArrowRight className="stat-arrow" aria-hidden="true" />
        </motion.button>

        <motion.button
          type="button"
          className="stat-card stat-card-action hc-spotlight-card"
          style={{ position: 'relative' }}
          onClick={() => {
            setStatBursts((prev) => ({ ...prev, mood: prev.mood + 1 }))
            window.setTimeout(() => navigate('/log'), 220)
          }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
        >
          <CardBurst burstKey={statBursts.mood} disabled={reduceMotion} />
          <span className="stat-icon stat-icon-sage">
            <FiHeart aria-hidden="true" />
          </span>
          <div className="hc-stat-card-body">
            <span className="stat-label">{t('mood')}</span>
            <strong>{isLoading ? '—' : averageMood ? `${averageMood}/10` : '—'}</strong>
            <div className="hc-metric-bar hc-metric-bar-sage" aria-hidden="true">
              <span style={{ width: `${averageMood ? Math.min(100, averageMood * 10) : 14}%` }} />
            </div>
            <small>{averageMood ? t('fromYourCheckIns') : t('whenYouAreReady')}</small>
          </div>
          <FiArrowRight className="stat-arrow" aria-hidden="true" />
        </motion.button>

        <motion.button
          type="button"
          className="stat-card stat-card-action hc-spotlight-card"
          style={{ position: 'relative' }}
          onClick={() => {
            setStatBursts((prev) => ({ ...prev, insights: prev.insights + 1 }))
            window.setTimeout(() => navigate('/insights'), 220)
          }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
        >
          <CardBurst burstKey={statBursts.insights} disabled={reduceMotion} />
          <span className="stat-icon stat-icon-lilac">
            <FiActivity aria-hidden="true" />
          </span>
          <div className="hc-stat-card-body">
            <span className="stat-label">{t('insights')}</span>
            <strong>{t('explorePatterns')}</strong>
            <div className="hc-metric-bar hc-metric-bar-lilac" aria-hidden="true">
              <span style={{ width: '68%' }} />
            </div>
            <small>{t('noStreaksRequired')}</small>
          </div>
          <FiArrowRight className="stat-arrow" aria-hidden="true" />
        </motion.button>
      </section>

      {!session && (
        <section className="private-sync-banner hc-spotlight-card">
          <PrivacyShieldEmblem />
          <div className="hc-banner-body">
            <div className="hc-privacy-kicker-row">
              <span className="hc-privacy-status-dot" aria-hidden="true" />
              <span className="eyebrow-label">{t('privateSpace')}</span>{' '}
              <span className="hc-privacy-chip">{t('savedOnDevice')}</span>
            </div>
            <strong>{t('spaceReadyTitle')}</strong> <p>{t('spaceReadyBody')}</p>
          </div>
          <Button
            variant="outlined"
            onClick={() => navigate('/signin', { state: { from: '/' } })}
            className="hc-privacy-signin-btn hc-spotlight-btn"
          >
            {t('signIn')}
          </Button>
        </section>
      )}

      {!isLoading && cycles.length === 0 && (
        <section className="first-checkin-card hc-spotlight-card">
          <div className="hc-first-checkin-badge" aria-hidden="true">
            <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
          </div>
          <div className="hc-banner-body">
            <span className="eyebrow-label">{t('noStreaksRequired')}</span>
            <h3>{t('firstCheckInWaiting')}</h3>
            <p>{t('firstCheckInSub')}</p>
          </div>
          <Button
            variant="contained"
            disableElevation
            className="form-submit-button hc-spotlight-btn"
            endIcon={<FiArrowRight aria-hidden="true" />}
            onClick={() => navigate('/log')}
          >
            {t('logToday')}
          </Button>
        </section>
      )}
    </div>
  )
}

export default Home
