import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiShield } from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageToggle from '../components/LanguageToggle'
import { HerCycleBrandLockup, HerCycleLogoMark } from '../components/SplashScreen'
import { getEntranceMotionProps, prefersCalmMotion } from '../lib/entrance'
import { supabase } from '../lib/supabase'

const phases = [
  { key: 'menstrual', icon: '🌙' },
  { key: 'follicular', icon: '🌱' },
  { key: 'ovulatory', icon: '☀️' },
  { key: 'luteal', icon: '🌸' },
]

const Onboarding = ({ session, onComplete, isFirstVisit = true }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const calmMotion = prefersCalmMotion()
  const [step, setStep] = useState(1)
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [selectedTone, setSelectedTone] = useState('playful')
  const [isLoading, setIsLoading] = useState(Boolean(session?.user?.id))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const tones = [
    { key: 'playful', title: t('tonePlayfulTitle'), description: t('tonePlayfulDesc') },
    { key: 'balanced', title: t('toneBalancedTitle'), description: t('toneBalancedDesc') },
    { key: 'serious', title: t('toneSeriousTitle'), description: t('toneSeriousDesc') },
  ]

  useEffect(() => {
    let isMounted = true
    const loadSettings = async () => {
      if (!session?.user?.id || !supabase) {
        try {
          const saved = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
          setSelectedPhase(saved.phase_selected || null)
          setSelectedTone(saved.tone_preference || 'playful')
        } catch {
          // Use defaults gracefully.
        }
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('phase_selected, tone_preference')
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (error) throw error
        if (!isMounted) return
        if (data) {
          setSelectedPhase(data.phase_selected || null)
          setSelectedTone(data.tone_preference || 'playful')
        }
      } catch (error) {
        console.error('Could not load onboarding preferences:', error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadSettings()
    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const finishSetup = async () => {
    setSaveError('')
    setIsSaving(true)
    const preferences = {
      phase_selected: selectedPhase || 'menstrual',
      tone_preference: selectedTone || 'playful',
    }

    try {
      window.localStorage.setItem('hercycle.onboarding', JSON.stringify(preferences))
      if (session?.user?.id && supabase) {
        const { error } = await supabase.from('user_settings').upsert(
          {
            user_id: session.user.id,
            ...preferences,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (error) throw error
      }
      setStep(4)
    } catch (error) {
      console.error('Could not save setup preferences:', error)
      setSaveError(error.message || t('errorGeneric'))
    } finally {
      setIsSaving(false)
    }
  }

  const completeWelcome = () => {
    try {
      window.localStorage.setItem('hercycle.onboarding.complete', 'true')
    } catch {
      // Allow immediate entry even when storage is restricted.
    }
    onComplete?.()
    navigate('/', { replace: true })
  }

  return (
    <main className="onboarding-shell">
      <div className="onboarding-background-orb onboarding-background-orb-one" aria-hidden="true" />
      <div className="onboarding-background-orb onboarding-background-orb-two" aria-hidden="true" />
      <div className="onboarding-container">
        <motion.header
          className="onboarding-topbar"
          {...getEntranceMotionProps('brand', { isFirstVisit, reducedMotion: calmMotion })}
        >
          <Link to="/onboarding" className="onboarding-brand" aria-label="HerCycle welcome">
            <HerCycleBrandLockup size={38} pulse showTagline={false} />
          </Link>
          <div className="onboarding-topbar-right">
            <span className="onboarding-steps-copy">{t('onboardingTopCopy')}</span>
            <LanguageToggle compact />
          </div>
        </motion.header>

        <div
          className="onboarding-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={step}
          aria-label={t('onboardingStepLabel', { step })}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={`onboarding-progress-segment${step > index ? ' is-complete' : ''}`}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="onboarding-loading" role="status">
            {t('loadingPreferences')}
          </div>
        ) : (
          <>
            {step === 1 && (
              <motion.section
                className="onboarding-welcome hc-spotlight-card"
                initial={{ opacity: 0.92, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                <div className="onboarding-welcome-copy">
                  <div className="onboarding-eyebrow">
                    <span aria-hidden="true">✦</span> {t('onboardingEyebrow1')}
                  </div>
                  <h1 className="onboarding-title">{t('welcome')}</h1>
                  <p className="onboarding-description">{t('welcomeDescription')}</p>
                  <div className="onboarding-benefits">
                    <div>
                      <span>01</span>
                      <p>{t('onboardingBenefit1')}</p>
                    </div>
                    <div>
                      <span>02</span>
                      <p>{t('onboardingBenefit2')}</p>
                    </div>
                    <div>
                      <span>03</span>
                      <p>{t('onboardingBenefit3')}</p>
                    </div>
                  </div>
                  <div className="onboarding-welcome-actions">
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={() => setStep(2)}
                      className="onboarding-cta hc-spotlight-btn"
                      endIcon={<FiArrowRight aria-hidden="true" />}
                    >
                      {t('getStarted')}
                    </Button>
                    <Link to="/auth" className="partner-copy-button hc-spotlight-btn">
                      {t('signIn')}
                    </Link>
                  </div>
                  <div className="onboarding-privacy-note">
                    <FiShield aria-hidden="true" /> {t('onboardingPrivacyNote')}
                  </div>
                </div>
                <div className="onboarding-art" aria-label={t('meetMascot')}>
                  <div className="onboarding-art-glow" />
                  <div className="onboarding-art-orbit onboarding-art-orbit-one" />
                  <div className="onboarding-art-orbit onboarding-art-orbit-two" />
                  <div className="onboarding-art-center">
                    <span className="onboarding-mascot-face" aria-hidden="true">
                      ☺
                    </span>
                    <GiLotus className="onboarding-mascot-lotus" aria-hidden="true" />
                  </div>
                  <div className="onboarding-art-chip onboarding-art-chip-top">
                    {t('onboardingChipTop')}
                  </div>
                  <div className="onboarding-art-chip onboarding-art-chip-bottom">
                    {t('onboardingChipBottom')}
                  </div>
                  <span className="onboarding-art-star onboarding-art-star-one">✦</span>
                  <span className="onboarding-art-star onboarding-art-star-two">✧</span>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                className="onboarding-step-panel hc-spotlight-card"
                initial={{ opacity: 0.92, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <span className="eyebrow-label">{t('onboardingStep2Eyebrow')}</span>
                <h1>{t('tellUs')}</h1>
                <p>{t('onboardingStep2Desc')}</p>
                <div className="onboarding-phase-grid">
                  {phases.map((phase) => (
                    <motion.button
                      key={phase.key}
                      type="button"
                      className={`onboarding-phase-card phase-choice-${phase.key} hc-spotlight-btn${
                        selectedPhase === phase.key ? ' is-selected' : ''
                      }`}
                      aria-pressed={selectedPhase === phase.key}
                      onClick={() => setSelectedPhase(phase.key)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="phase-choice-orb" aria-hidden="true">
                        <span className="phase-choice-icon">{phase.icon}</span>
                      </span>
                      <strong>{t(`phase.${phase.key}`)}</strong>
                      <small className="phase-choice-tagline">
                        {t(`phaseTagline.${phase.key}`)}
                      </small>
                      {selectedPhase === phase.key && <FiCheck aria-hidden="true" />}
                    </motion.button>
                  ))}
                </div>
                <div className="onboarding-step-actions">
                  <button
                    type="button"
                    className="onboarding-back-button"
                    onClick={() => setStep(1)}
                  >
                    <FiArrowLeft /> {t('back')}
                  </button>
                  <Button
                    variant="contained"
                    disabled={!selectedPhase}
                    onClick={() => setStep(3)}
                    className="onboarding-cta hc-spotlight-btn"
                  >
                    {t('nextContinue')} <FiArrowRight />
                  </Button>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                className="onboarding-step-panel hc-spotlight-card"
                initial={{ opacity: 0.92, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <span className="eyebrow-label">{t('onboardingStep3Eyebrow')}</span>
                <h1>{t('chooseTone')}</h1>
                <p>{t('onboardingStep3Desc')}</p>
                <div className="onboarding-tone-grid">
                  {tones.map((tone) => (
                    <button
                      key={tone.key}
                      type="button"
                      className={`onboarding-tone-card hc-spotlight-btn${
                        selectedTone === tone.key ? ' is-selected' : ''
                      }`}
                      aria-pressed={selectedTone === tone.key}
                      onClick={() => setSelectedTone(tone.key)}
                    >
                      <span className="onboarding-tone-mark">
                        {selectedTone === tone.key ? <FiCheck /> : '✧'}
                      </span>
                      <strong>{tone.title}</strong>
                      <span>{tone.description}</span>
                    </button>
                  ))}
                </div>
                {saveError && (
                  <Alert severity="error" style={{ marginTop: 12 }}>
                    {saveError}
                  </Alert>
                )}
                <div className="onboarding-step-actions">
                  <button
                    type="button"
                    className="onboarding-back-button"
                    onClick={() => setStep(2)}
                  >
                    <FiArrowLeft /> {t('back')}
                  </button>
                  <Button
                    variant="contained"
                    disabled={isSaving}
                    onClick={finishSetup}
                    className="onboarding-cta hc-spotlight-btn"
                  >
                    {isSaving ? t('saving') : t('completeOnboarding')}
                  </Button>
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section
                className="onboarding-complete-panel hc-spotlight-card"
                data-testid="onboarding-complete-step"
                initial={{ opacity: 0.94, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24 }}
              >
                <div className="hc-logo-halo-wrap" style={{ margin: '0 auto 12px' }}>
                  <HerCycleLogoMark size={68} pulse />
                </div>
                <span className="eyebrow-label">{t('onboardingFinalEyebrow')}</span>
                <h1>{t('onboardingComplete')}</h1>
                <p>{t('meetMascot')}</p>
                <p className="onboarding-final-note">{t('onboardingFinalNote')}</p>
                <Button
                  variant="contained"
                  onClick={completeWelcome}
                  className="onboarding-cta hc-spotlight-btn"
                  endIcon={<FiArrowRight aria-hidden="true" />}
                >
                  {t('continue')}
                </Button>
              </motion.section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default Onboarding
