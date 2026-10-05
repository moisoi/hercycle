import React, { useEffect, useState } from 'react'
import { Avatar, Button, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { GiSparkSpirit } from 'react-icons/gi'

import { colors, typography } from '../styles'
import { supabase } from '../lib/supabase'

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

const phaseIndicators = {
  menstrual: { color: '#C15B70', icon: '🩸', bg: '#FDE8EE' },
  follicular: { color: '#A8D5B8', icon: '🌿', bg: '#E6F7F2' },
  ovulatory: { color: '#FF8C42', icon: '❤️', bg: '#FFF4E5' },
  luteal: { color: '#6B5B9A', icon: '💜', bg: '#F0E6FF' },
}

const Onboarding = ({ session, onComplete }) => {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [selectedTone, setSelectedTone] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(session?.user?.id))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      if (!session?.user?.id) {
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
          setSelectedTone(data.tone_preference || null)
        }
      } catch (error) {
        console.error('Error loading onboarding settings:', error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSettings()
    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const syncOnboarding = async () => {
    setSaveError('')

    if (session?.user?.id) {
      setIsSaving(true)
      try {
        const { error } = await supabase.from('user_settings').upsert(
          {
            user_id: session.user.id,
            onboarding_completed: true,
            tone_preference: selectedTone || 'balanced',
            phase_selected: selectedPhase || 'menstrual',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (error) throw error
      } catch (error) {
        console.error('Error syncing onboarding:', error)
        setSaveError('We could not save your preferences. Please try again.')
        return
      } finally {
        setIsSaving(false)
      }
    }

    setStep(4)
  }

  const phaseCardStyle = (phase) => ({
    width: 120,
    minHeight: 132,
    padding: 16,
    borderRadius: 16,
    background: selectedPhase === phase.key ? phaseIndicators[phase.key].bg : colors.surface,
    border: `2px solid ${selectedPhase === phase.key ? phaseIndicators[phase.key].color : colors.muted}`,
    color: selectedPhase === phase.key ? phaseIndicators[phase.key].color : colors.onyx,
    cursor: 'pointer',
    textAlign: 'center',
    transition: colors.transitions.normal,
  })

  return (
    <main style={{ minHeight: '100vh', background: colors.background, color: colors.onyx, padding: 24 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 48 }}>
        <div aria-label={`Step ${step} of 4`} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              style={{
                height: 6,
                flex: 1,
                borderRadius: 999,
                background: step > index ? colors.primary : colors.muted,
              }}
            />
          ))}
        </div>

        {isLoading ? (
          <Typography role="status" align="center">Loading your saved preferences…</Typography>
        ) : (
          <>
            {step === 1 && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h3" align="center" gutterBottom>
                  {t('welcome')}
                </Typography>
                <Typography align="center" style={{ color: colors.muted, marginBottom: 32 }}>
                  {t('welcome.desc')}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setStep(2)}
                  sx={{ backgroundColor: colors.primary, borderRadius: 7, py: 1.5 }}
                >
                  {t('getStarted')}
                </Button>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h3" align="center" gutterBottom>
                  {t('tellUs')}
                </Typography>
                <Typography align="center" style={{ color: colors.muted, marginBottom: 24 }}>
                  Choose the cycle phase you are currently experiencing.
                </Typography>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                  {phases.map((phase) => (
                    <motion.button
                      key={phase.key}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      onClick={() => setSelectedPhase(phase.key)}
                      aria-pressed={selectedPhase === phase.key}
                      style={phaseCardStyle(phase)}
                    >
                      <span style={{ display: 'block', fontSize: 28, marginBottom: 8 }}>
                        {phaseIndicators[phase.key].icon}
                      </span>
                      <span>{phase.name}</span>
                    </motion.button>
                  ))}
                </div>
                {selectedPhase && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setStep(3)}
                    sx={{ mt: 3, borderColor: colors.primary, color: colors.primary, borderRadius: 3, py: 1.5 }}
                  >
                    {t('phaseSelected', { phase: phases.find((phase) => phase.key === selectedPhase)?.name })}
                  </Button>
                )}
              </motion.section>
            )}

            {step === 3 && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h3" align="center" gutterBottom>
                  {t('chooseTone')}
                </Typography>
                <Typography align="center" style={{ color: colors.muted, marginBottom: 24 }}>
                  Choose the style of encouragement that feels right for you.
                </Typography>
                <div style={{ display: 'grid', gap: 12 }}>
                  {tones.map((tone) => (
                    <motion.button
                      key={tone.key}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedTone(tone.key)}
                      aria-pressed={selectedTone === tone.key}
                      style={{
                        padding: 16,
                        textAlign: 'left',
                        borderRadius: 12,
                        background: selectedTone === tone.key ? `${colors.primary}18` : colors.surface,
                        border: `2px solid ${selectedTone === tone.key ? colors.primary : colors.muted}`,
                        color: colors.onyx,
                        cursor: 'pointer',
                      }}
                    >
                      <strong>{tone.label}</strong>
                      <span style={{ display: 'block', color: colors.muted, marginTop: 4 }}>
                        {tone.description}
                      </span>
                    </motion.button>
                  ))}
                </div>
                {saveError && (
                  <Typography role="alert" color="error" style={{ marginTop: 16 }}>
                    {saveError}
                  </Typography>
                )}
                {selectedTone && (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={isSaving}
                    onClick={syncOnboarding}
                    sx={{ mt: 3, backgroundColor: colors.primary, borderRadius: 3, py: 1.5 }}
                  >
                    {isSaving ? 'Saving…' : t('completeOnboarding')}
                  </Button>
                )}
              </motion.section>
            )}

            {step === 4 && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h3" align="center" gutterBottom>
                  {t('onboardingComplete')}
                </Typography>
                <Avatar
                  sx={{
                    width: 88,
                    height: 88,
                    mx: 'auto',
                    my: 3,
                    background: colors.gradient1,
                    border: '4px solid #FFE8E1',
                  }}
                >
                  <GiSparkSpirit fontSize={36} color={colors.primary} />
                </Avatar>
                <Typography align="center" style={{ color: colors.muted, marginBottom: 24 }}>
                  {t('meetMascot')}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onComplete}
                  sx={{ backgroundColor: colors.primary, borderRadius: 7, py: 1.5 }}
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
