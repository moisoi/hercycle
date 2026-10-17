import React, { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiShield } from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { supabase } from '../lib/supabase'

const phases = [
  { key: 'menstrual', icon: '🌙' },
  { key: 'follicular', icon: '🌱' },
  { key: 'ovulatory', icon: '☀️' },
  { key: 'luteal', icon: '🌸' },
]

const tones = [
  { key: 'playful', title: 'Warm and playful', description: 'Color, softness, and a little sparkle.' },
  { key: 'balanced', title: 'A little of both', description: 'Gentle encouragement with clear information.' },
  { key: 'serious', title: 'Quiet and straightforward', description: 'Keep things simple, grounded, and focused.' },
]

const Onboarding = ({ session, onComplete }) => {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [selectedTone, setSelectedTone] = useState('balanced')
  const [isLoading, setIsLoading] = useState(Boolean(session?.user?.id))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadSettings = async () => {
      if (!session?.user?.id) {
        try {
          const saved = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
          setSelectedPhase(saved.phase_selected || null)
          setSelectedTone(saved.tone_preference || 'balanced')
        } catch {
          // Start gently with the defaults if browser storage is unavailable.
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
          setSelectedTone(data.tone_preference || 'balanced')
        }
      } catch (error) {
        console.error('Could not load onboarding preferences:', error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadSettings()
    return () => { isMounted = false }
  }, [session?.user?.id])

  const finishSetup = async () => {
    setSaveError('')
    setIsSaving(true)
    const preferences = {
      phase_selected: selectedPhase || 'menstrual',
      tone_preference: selectedTone || 'balanced',
    }

    try {
      window.localStorage.setItem('hercycle.onboarding', JSON.stringify(preferences))
      if (session?.user?.id) {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: session.user.id,
          ...preferences,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
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
      // The current session can still continue when storage is unavailable.
    }
    onComplete?.()
  }

  return (
    <main className="onboarding-shell">
      <div className="onboarding-background-orb onboarding-background-orb-one" />
      <div className="onboarding-background-orb onboarding-background-orb-two" />
      <div className="onboarding-container">
        <header className="onboarding-topbar">
          <Link to="/onboarding" className="onboarding-brand" aria-label="HerCycle welcome">
            <span className="app-brand-mark"><GiLotus aria-hidden="true" /></span>
            <span>hercycle</span>
          </Link>
          <div className="onboarding-steps-copy">A gentler kind of cycle care</div>
        </header>

        <div className="onboarding-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Step ${step} of 4`}>
          {Array.from({ length: 4 }, (_, index) => <span key={index} className={`onboarding-progress-segment${step > index ? ' is-complete' : ''}`} />)}
        </div>

        {isLoading ? (
          <div className="onboarding-loading" role="status">Loading your saved preferences…</div>
        ) : (
          <>
            {step === 1 && (
              <motion.section className="onboarding-welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <div className="onboarding-welcome-copy">
                  <div className="onboarding-eyebrow"><span aria-hidden="true">✦</span> YOUR CYCLE, YOUR WAY</div>
                  <h1 className="onboarding-title">{t('welcome')}</h1>
                  <p className="onboarding-description">{t('welcomeDescription')}</p>
                  <div className="onboarding-benefits">
                    <div><span>01</span><p>Gentle daily check-ins</p></div>
                    <div><span>02</span><p>Patterns without pressure</p></div>
                    <div><span>03</span><p>Your data stays yours</p></div>
                  </div>
                  <Button variant="contained" onClick={() => setStep(2)} className="onboarding-cta" endIcon={<FiArrowRight aria-hidden="true" />}>
                    {t('getStarted')}
                  </Button>
                  <div className="onboarding-privacy-note"><FiShield aria-hidden="true" /> Private by design. Here for you, never to judge.</div>
                </div>
                <div className="onboarding-art" aria-label="Luna, your gentle lotus companion">
                  <div className="onboarding-art-glow" />
                  <div className="onboarding-art-orbit onboarding-art-orbit-one" />
                  <div className="onboarding-art-orbit onboarding-art-orbit-two" />
                  <div className="onboarding-art-center">
                    <span className="onboarding-mascot-face" aria-hidden="true">☺</span>
                    <GiLotus className="onboarding-mascot-lotus" aria-hidden="true" />
                  </div>
                  <div className="onboarding-art-chip onboarding-art-chip-top">Hi, I’m Luna</div>
                  <div className="onboarding-art-chip onboarding-art-chip-bottom">A little care, every day</div>
                  <span className="onboarding-art-star onboarding-art-star-one">✦</span>
                  <span className="onboarding-art-star onboarding-art-star-two">✧</span>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section className="onboarding-step-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="eyebrow-label">FIRST, A LITTLE CONTEXT</span>
                <h1>{t('tellUs')}</h1>
                <p>Choose the phase that feels closest today. You can change it any time.</p>
                <div className="onboarding-phase-grid">
                  {phases.map((phase) => (
                    <motion.button
                      key={phase.key}
                      type="button"
                      className={`onboarding-phase-card${selectedPhase === phase.key ? ' is-selected' : ''}`}
                      aria-pressed={selectedPhase === phase.key}
                      onClick={() => setSelectedPhase(phase.key)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>{phase.icon}</span><strong>{t(`phase.${phase.key}`)}</strong>
                      {selectedPhase === phase.key && <FiCheck aria-hidden="true" />}
                    </motion.button>
                  ))}
                </div>
                <div className="onboarding-step-actions">
                  <button type="button" className="onboarding-back-button" onClick={() => setStep(1)}><FiArrowLeft /> Back</button>
                  <Button variant="contained" disabled={!selectedPhase} onClick={() => setStep(3)} className="onboarding-cta">Continue <FiArrowRight /></Button>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section className="onboarding-step-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="eyebrow-label">A VOICE THAT FEELS RIGHT</span>
                <h1>{t('chooseTone')}</h1>
                <p>Pick the kind of encouragement you would like from Luna.</p>
                <div className="onboarding-tone-grid">
                  {tones.map((tone) => (
                    <button key={tone.key} type="button" className={`onboarding-tone-card${selectedTone === tone.key ? ' is-selected' : ''}`} aria-pressed={selectedTone === tone.key} onClick={() => setSelectedTone(tone.key)}>
                      <span className="onboarding-tone-mark">{selectedTone === tone.key ? <FiCheck /> : '✧'}</span>
                      <strong>{tone.title}</strong><span>{tone.description}</span>
                    </button>
                  ))}
                </div>
                {saveError && <p className="onboarding-error" role="alert">{saveError}</p>}
                <div className="onboarding-step-actions">
                  <button type="button" className="onboarding-back-button" onClick={() => setStep(2)}><FiArrowLeft /> Back</button>
                  <Button variant="contained" disabled={isSaving} onClick={finishSetup} className="onboarding-cta">{isSaving ? 'Saving…' : t('completeOnboarding')} <FiArrowRight /></Button>
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section className="onboarding-complete-panel" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="onboarding-complete-mascot"><GiLotus aria-hidden="true" /><span>☺</span></div>
                <span className="eyebrow-label">THIS SPACE IS YOURS</span>
                <h1>{t('onboardingComplete')}</h1>
                <p>{t('meetMascot')}</p>
                <Button fullWidth variant="contained" onClick={completeWelcome} className="onboarding-cta">{t('continue')} <FiArrowRight /></Button>
                <p className="onboarding-complete-note">No perfect streaks. No pressure. Just you, in your own rhythm.</p>
              </motion.section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default Onboarding
