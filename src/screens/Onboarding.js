import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, Button, Avatar, Typography } from '@mui/material'
import { FaMoon, FaSun, FaLeaf, FaDropOfBlood } from 'react-icons/fa'
import { AiFillSmile } from 'react-icons/ai'

import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import { colors, typography } from '../styles'
import { supabase } from '../lib/supabase'

const Onboarding = () => {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [selectedGender, setSelectedGender] = useState(null)
  const [selectedTone, setSelectedTone] = useState(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  // Initialize Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setHasHydrated(true)
      }
    })
  }, [])

  // Fetch user settings after first render
  useEffect(() => {
    if (!hasHydrated) return

    ;(async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .maybeSingle()

      if (!error && data) {
        // User has existing onboarding data
        console.log('Existing onboarding data found:', data)
      }
    })()
  }, [hasHydrated])

  // Sync onboarding data to Supabase
  const syncOnboarding = async (phase, tone) => {
    if (!session?.user?.id) return

    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        onboarding_completed: true,
        theme_preference: tone || 'balanced',
        phase_selected: phase || 'menstrual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      setStep(step + 1)
    } catch (err) {
      console.error('Error syncing onboarding:', err)
    }
  }

  const phases = [
    { key: 'menstrual', name: 'Menstrual' },
    { key: 'follicular', name: 'Follicular' },
    { key: 'ovulatory', name: 'Ovulatory' },
    { key: 'luteal', name: 'Luteal' },
  ]

  const tones = [
    { key: 'playful', label: 'Playful', description: 'Fun, expressive, colorful' },
    { key: 'serious', label: 'Serious', description: 'Minimalist, focused, clinical' },
    { key: 'balanced', label: 'Balanced', description: 'Mix of playful and serious' },
  ]

  const handleNext = () => setStep(step + 1)
  const handlePrev = () => setStep(step - 1)

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <div className="p-6 max-h-screen flex flex-col justify-center">

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 4 }, (_, i) => (
            <motion.div
              key={i}
              initial="small"
              animate={step > i ? "normal" : "small"}
              exit="small"
              transition={{ duration: 0.3 }}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: step > i ? colors.primary : colors.muted,
              }}
            />
          ))}
        </div>

        {/* Step Content */}
        <div style={{ maxWidth: '600px', marginTop: hasHydrated ? 40 : 20 }}>
          {step === 1 && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: "spring", stiffness: 150 }}
            >
              <Typography variant="h3" style={{ textAlign: 'center', marginBottom: '24px' }}>
                {t('welcome')}
              </Typography>
              <Typography style={{ textAlign: 'center', color: colors.muted, marginBottom: '40px' }}>
                {t('welcome.desc')}
              </Typography>
              <Button
                variant="contained"
                style={{
                  background: colors.primary,
                  border: 'none',
                  borderRadius: '28px',
                  color: 'white',
                  padding: '12px 24px',
                  fontWeight: typography.weight.medium,
                  width: '100%',
                  marginBottom: '24px',
                }}
                onClick={() => setStep(2)}
              >
                {t('getStarted')}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: "spring", stiffness: 150 }}
            >
              <Typography variant="h3" style={{ textAlign: 'center', marginBottom: '24px' }}>
                {t('tellUs')}
              </Typography>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {phases.map((phase) => (
                  <motion.div
                    key={phase.key}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        background: phaseIndicators[phase.key].bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: `2px solid ${phaseIndicators[phase.key].color}`,
                        cursor: 'pointer',
                        color: phaseIndicators[phase.key].color,
                        fontSize: 24,
                        borderRadius: '16px',
                        transition: colors.transitions.normal,
                      }}
                      onClick={() => setSelectedGender(phase.key)}
                    >
                      {phaseIndicators[phase.key].icon}
                    </div>
                    <Typography variant="subtitle1" style={{ textAlign: 'center', marginTop: '8px' }}>
                      {phase.label}
                    </Typography>
                  </motion.div>
                ))}
              </div>
              {selectedGender && (
                <Button
                  variant="outlined"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderColor: colors.primary,
                    color: colors.primary,
                    marginTop: '16px',
                    borderRadius: '12px',
                  }}
                  onClick={() => setStep(3)}
                >
                  {t('phaseSelected', { gender: selectedGender }) }
                </Button>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: "spring", stiffness: 150 }}
            >
              <Typography variant="h3" style={{ textAlign: 'center', marginBottom: '24px' }}>
                {t('chooseTone')}
              </Typography>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {tones.map((tone) => (
                  <motion.div
                    key={tone.key}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        background: colors.surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: '2px solid',
                        borderColor: selectedTone === tone.key ? colors.primary : colors.muted,
                        color: selectedTone === tone.key ? colors.primary : colors.muted,
                        fontSize: 24,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: colors.transitions.normal,
                      }}
                      onClick={() => setSelectedTone(tone.key)}
                    >
                      {selectedTone === tone.key ? '✓' : ''}
                    </div>
                    <Typography variant="subtitle1" style={{ textAlign: 'center', marginTop: '8px' }}>
                      {tone.label}
                    </Typography>
                  </motion.div>
                ))}
              </div>
              {selectedTone && (
                <Button
                  variant="contained"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: colors.primary,
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    marginTop: '16px',
                  }}
                  onClick={() => syncOnboarding(selectedGender, selectedTone)}
                >
                  {t('completeOnboarding')}
                </Button>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: "spring", stiffness: 150 }}
            >
              <Typography variant="h3" style={{ textAlign: 'center', marginBottom: '24px' }}>
                {t('onboardingComplete')}
              </Typography>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Avatar
                  style={{
                    width: 80,
                    height: 80,
                    background: colors.gradient1,
                    border: '4px solid #FFE8E1',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}
                >
                  <GiMascotSpirit fontSize={32} color={colors.primary} />
                </Avatar>
              </div>
              <Typography variant="body1" style={{ textAlign: 'center', color: colors.muted, marginBottom: '16px' }}>
                {t('meetMascot')}
              </Typography>
              <Button
                variant="contained"
                style={{
                  background: colors.primary,
                  border: 'none',
                  borderRadius: '28px',
                  color: 'white',
                  padding: '12px 24px',
                  fontWeight: typography.weight.medium,
                  width: '100%',
                }}
                onClick={() => setStep(1)}
              >
                {t('continue')}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Phase indicators (moved outside component for consistency)
const phaseIndicators = {
  menstrual: { color: '#C15B70', icon: '🩸', bg: '#FDE8EE' },
  follicular: { color: '#A8D5B8', icon: '🌿', bg: '#E6F7F2' },
  ovulatory: { color: '#FF8C42', icon: '❤️', bg: '#FFF4E5' },
  luteal: { color: '#6B5B9A', icon: '💜', bg: '#F0E6FF' },
}

export default Onboarding