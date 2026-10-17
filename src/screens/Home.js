import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import { FiActivity, FiArrowRight, FiCalendar, FiDroplet, FiHeart, FiMessageCircle, FiPlus, FiShield } from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { supabase } from '../lib/supabase'
import { estimatePeriodEndDate, formatPeriodDate, localDateString } from '../lib/period'

const phaseDetails = {
  menstrual: { icon: '🌙', tint: 'rose' },
  follicular: { icon: '🌱', tint: 'sage' },
  ovulatory: { icon: '☀️', tint: 'peach' },
  luteal: { icon: '🌸', tint: 'lilac' },
}

const cheerByTone = {
  playful: {
    menstrual: 'Soft pace, cozy socks, and absolutely no gold stars required.',
    follicular: 'Curiosity looks lovely on you. Follow one tiny spark today.',
    ovulatory: 'Your glow is yours. Take up the space that feels good to you.',
    luteal: 'One thing at a time, lovely. You are already doing enough.',
    empty: 'Luna saved you the coziest little corner. Start wherever you are.',
  },
  balanced: {
    menstrual: 'Rest is productive, love. You are doing beautifully.',
    follicular: 'Let curiosity bloom. You can take one little step at a time.',
    ovulatory: 'You have a glow all your own. Make space for what feels good to you.',
    luteal: 'You do not have to do it all today. Be tender with yourself.',
    empty: 'Luna is saving you a little space. Start wherever you are today.',
  },
  serious: {
    menstrual: 'A slower pace may help today. Your needs deserve attention.',
    follicular: 'Notice what feels interesting, and choose one small next step.',
    ovulatory: 'Check in with yourself. Let your own comfort guide your day.',
    luteal: 'You can lower the bar today. Rest and boundaries are valid choices.',
    empty: 'Start with one honest check-in. There is no required way to feel.',
  },
}

const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(date)

const Home = ({ session }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [settings, setSettings] = useState(null)
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(session?.user?.id))
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const [cyclesResult, settingsResult, progressResult] = await Promise.all([
        supabase
          .from('cycles')
          .select('id, phase, mood, libido, period, date, period_start_date, period_duration_days')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false })
          .limit(30),
        supabase
          .from('user_settings')
          .select('phase_selected, tone_preference')
          .eq('user_id', session.user.id)
          .maybeSingle(),
        supabase
          .from('user_progress')
          .select('current_streak, total_coins, current_level')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ])

      if (!isMounted) return

      const firstError = cyclesResult.error || settingsResult.error || progressResult.error
      if (firstError) {
        console.error('Unable to load dashboard data:', firstError)
        setLoadError('Some of your data could not be loaded. Please refresh in a moment.')
      } else {
        let resolvedSettings = settingsResult.data
        if (!resolvedSettings) {
          try {
            const onboarding = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
            const preferences = JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}')
            if (onboarding.phase_selected) {
              const { error: seedError } = await supabase.from('user_settings').upsert({
                user_id: session.user.id,
                onboarding_completed: true,
                phase_selected: onboarding.phase_selected,
                tone_preference: onboarding.tone_preference || 'balanced',
                theme_preference: preferences.theme || 'light',
                font_size: preferences.fontSize || 'medium',
                hide_intimacy: Boolean(preferences.hideIntimacy),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' })
              if (seedError) throw seedError
              resolvedSettings = {
                phase_selected: onboarding.phase_selected,
                tone_preference: onboarding.tone_preference || 'balanced',
              }
            }
          } catch (seedError) {
            console.warn('Could not sync initial account preferences:', seedError)
          }
        }
        setCycles(cyclesResult.data || [])
        setSettings(resolvedSettings)
        setProgress(progressResult.data)
      }
      setIsLoading(false)
    }

    loadDashboard().catch((error) => {
      console.error('Unable to load dashboard data:', error)
      if (isMounted) {
        setLoadError(t('errorGeneric'))
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [session?.user?.id, t])

  const latestCheckIn = cycles[0]
  const todayDate = localDateString()
  const currentPeriodPrediction = cycles.find((entry) => {
    const endDate = estimatePeriodEndDate(entry.period_start_date, entry.period_duration_days)
    return Boolean(entry.period_start_date && endDate && entry.period_start_date <= todayDate && endDate >= todayDate)
  })
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
  const cheerMessage = cheerByTone[tone]?.[activePhase || 'empty'] || cheerByTone.balanced[activePhase || 'empty']
  const averageMood = useMemo(() => {
    const values = cycles.map((entry) => Number(entry.mood)).filter(Number.isFinite)
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
  }, [cycles])

  return (
    <div className="dashboard-page">
      {loadError && <Alert severity="warning" className="dashboard-alert">{loadError}</Alert>}

      <motion.section
        className="dashboard-welcome-row"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div>
          <span className="eyebrow-label">A NOTE FROM YOUR BODY</span>
          <h2>{t('goodMorning')}</h2>
          <p>{t('dashboardDescription')}</p>
        </div>
        <div className="dashboard-date-badge"><FiCalendar aria-hidden="true" /> {dateLabel(new Date())}</div>
      </motion.section>

      <div className="dashboard-feature-grid">
        <motion.section
          className={`phase-spotlight${phaseInfo ? ` phase-spotlight-${phaseInfo.tint}` : ' phase-spotlight-quiet'}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="phase-spotlight-topline">
            <span>{t('cycleSpotlight')}</span>
            <span className="phase-spotlight-orbit" aria-hidden="true">{phaseInfo?.icon || '✧'}</span>
          </div>
          {isLoading ? (
            <div className="dashboard-skeleton-group"><Skeleton width="55%" height={46} /><Skeleton width="90%" /><Skeleton width="70%" /></div>
          ) : activePhase ? (
            <>
              <div className="phase-label-row">
                <span className="phase-symbol" aria-hidden="true">{phaseInfo?.icon}</span>
                <span className="phase-name">{t(`phase.${activePhase}`)}</span>
              </div>
              <p className="phase-description">{t(`phaseDescription.${activePhase}`)}</p>
              <p className="phase-meta">
                {latestCheckIn ? `${t('lastCheckIn')}: ${dateLabel(new Date(`${latestCheckIn.date}T12:00:00`))}` : t('noCheckIns')}
              </p>
            </>
          ) : (
            <>
              <div className="phase-label-row">
                <span className="phase-symbol phase-symbol-empty" aria-hidden="true">✧</span>
                <span className="phase-name">Your rhythm, your way</span>
              </div>
              <p className="phase-description">Your first check-in can be as simple as choosing how today feels.</p>
              <p className="phase-meta">No predictions. Just a little more self-understanding.</p>
            </>
          )}
          <Button className="phase-spotlight-button" onClick={() => navigate('/log')} endIcon={<FiArrowRight aria-hidden="true" />}>
            {activePhase ? t('logToday') : t('startFirstCheckIn')}
          </Button>
        </motion.section>

        <motion.section
          className="mascot-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <div className="mascot-card-topline"><span>YOUR LITTLE REMINDER</span><span className="mascot-card-sparkle">✦</span></div>
          <div className="mascot-illustration" aria-hidden="true">
            <span className="mascot-halo" />
            <GiLotus className="mascot-lotus" />
            <span className="mascot-orbit-dot mascot-orbit-dot-one">✦</span>
            <span className="mascot-orbit-dot mascot-orbit-dot-two">✧</span>
          </div>
          <p className="mascot-name">Luna says</p>
          <p className="mascot-message">{cheerMessage}</p>
          <span className="mascot-signoff">with a little love <span aria-hidden="true">♡</span></span>
        </motion.section>
      </div>

      {currentPeriodPrediction && (
        <section className="period-prediction-card" aria-label={t('periodEstimateTitle')}>
          <span className="period-prediction-icon"><FiDroplet aria-hidden="true" /></span>
          <div>
            <span className="eyebrow-label">{t('periodEstimateTitle')}</span>
            <strong>{t('periodEstimateEnds', { date: formatPeriodDate(estimatePeriodEndDate(currentPeriodPrediction.period_start_date, currentPeriodPrediction.period_duration_days)) })}</strong>
            <p>{t('periodEstimateDashboardNote')}</p>
          </div>
        </section>
      )}

      <section className="dashboard-stats" aria-label="Your recent activity">
        <div className="stat-card">
          <span className="stat-icon stat-icon-rose"><FiActivity aria-hidden="true" /></span>
          <div><span className="stat-label">{t('checkInCount')}</span><strong>{isLoading ? '—' : cycles.length}</strong></div>
          <small>last 30 days</small>
        </div>
        <div className="stat-card">
          <span className="stat-icon stat-icon-sage"><FiHeart aria-hidden="true" /></span>
          <div><span className="stat-label">{t('averageMood')}</span><strong>{isLoading ? '—' : averageMood ? `${averageMood}/10` : '—'}</strong></div>
          <small>{averageMood ? 'from your check-ins' : 'when you are ready'}</small>
        </div>
        <div className="stat-card stat-card-action" role="button" tabIndex={0} aria-label="Explore your personal insights" onClick={() => navigate('/insights')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate('/insights') } }}>
          <span className="stat-icon stat-icon-lilac"><FiPlus aria-hidden="true" /></span>
          <div><span className="stat-label">A small next step</span><strong>Explore patterns</strong><small>{progress?.current_streak ? `${progress.current_streak} ${t('dayStreak')}` : 'No streaks required'}</small></div>
          <FiArrowRight className="stat-arrow" aria-hidden="true" />
        </div>
      </section>

      <motion.section
        className="luna-home-invitation"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.16 }}
      >
        <span className="luna-home-invitation-icon" aria-hidden="true"><GiLotus /><i>✦</i></span>
        <div className="luna-home-invitation-copy">
          <span>{t('lunaHomeEyebrow')}</span>
          <strong>{t('lunaHomeHeading')}</strong>
          <p>{t('lunaHomeDescription')}</p>
        </div>
        <button type="button" className="luna-home-invitation-button" onClick={() => navigate('/luna')}>
          <FiMessageCircle aria-hidden="true" /> <span>{t('lunaHomeButton')}</span> <FiArrowRight aria-hidden="true" />
        </button>
      </motion.section>

      {!session && (
        <motion.section className="private-sync-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="private-sync-icon"><FiShield aria-hidden="true" /></span>
          <div><strong>Your space is ready when you are.</strong><p>Sign in to save your private check-ins and see them on your other devices.</p></div>
          <Button onClick={() => navigate('/auth')} endIcon={<FiArrowRight aria-hidden="true" />}>{t('signIn')}</Button>
        </motion.section>
      )}

      {session && !cycles.length && !isLoading && (
        <motion.button
          type="button"
          className="first-checkin-card"
          onClick={() => navigate('/log')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="first-checkin-icon"><FiPlus aria-hidden="true" /></span>
          <span><strong>Your first check-in is waiting</strong><small>It takes less than a minute, and you can skip any question.</small></span>
          <FiArrowRight className="first-checkin-arrow" aria-hidden="true" />
        </motion.button>
      )}
    </div>
  )
}

export default Home
