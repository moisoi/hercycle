import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Button, Typography } from '@mui/material'
import { FaHeart, FaLeaf, FaMoon, FaSun } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { colors, typography } from '../styles'
import { supabase } from '../lib/supabase'
import { readinessFor } from '../lib/intimacyReadiness'

// Phase content. The tips shown depend on the phase, and the number of ideas depends on the readiness rules.
const TIPS = {
  menstrual: {
    title: 'Menstrual Phase',
    color: '#C15B70',
    body: 'Period sex can ease cramps for some. If you are not into penetration, focus on external touch or non-sexual intimacy.',
    suggestions: ['External touch only', 'Use a menstrual cup for mess-free period sex', 'Focus on cuddling and emotional connection', 'Try shower sex for easier cleanup'],
  },
  follicular: {
    title: 'Follicular Phase',
    color: '#A8D5B8',
    body: 'Energy rising. Good time to try something new or bring up a desire you have been curious about.',
    suggestions: ['Try new positions or activities', 'Initiate intimacy earlier in the day when energy is higher', 'Experiment with different types of touch', 'Plan a romantic date'],
  },
  ovulatory: {
    title: 'Ovulatory Phase',
    color: '#FF8C42',
    body: 'Confidence and attraction often peak. If you are into it, this is a great time to initiate or plan a date.',
    suggestions: ['This is peak fertility - use protection if needed', 'High confidence - great time to try something adventurous', 'Initiate intimacy - your desire may be peak', 'Plan a special date or getaway'],
  },
  luteal: {
    title: 'Luteal Phase',
    color: '#6B5B9A',
    body: 'You might prefer emotional closeness over intensity. Think cuddles, massage, deep talks.',
    suggestions: ['Focus on emotional connection and deep talks', 'Sensual massage with oil', 'Cuddling and non-goal-oriented touch', 'Be gentle with yourself if PMS symptoms appear'],
  },
}

const PHASE_LABELS = { menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulatory', luteal: 'Luteal' }

const PHASE_INDICATORS = {
  menstrual: { color: '#C15B70', icon: <FaMoon />, bg: '#FDE8EE' },
  follicular: { color: '#A8D5B8', icon: <FaLeaf />, bg: '#E6F7F2' },
  ovulatory: { color: '#FF8C42', icon: <FaSun />, bg: '#FFF4E5' },
  luteal: { color: '#6B5B9A', icon: <FaHeart />, bg: '#F0E6FF' },
}

const LIGHTS = [
  { key: 'green', emoji: '🟢', label: 'Open' },
  { key: 'yellow', emoji: '🟡', label: 'Maybe, with gentleness' },
  { key: 'red', emoji: '🔴', label: 'Not tonight' },
]

const TONE_COLORS = { green: '#22C55E', yellow: '#F59E0B', red: '#EF4444', neutral: colors.muted }

const Intimacy = () => {
  const { t } = useTranslation()
  const [currentPhase, setCurrentPhase] = useState('menstrual')
  const [libido, setLibido] = useState(5)
  const [intimacyLevel, setIntimacyLevel] = useState(3)
  const [preferredTerms, setPreferredTerms] = useState(['romantic', 'sensual'])
  const [partnerMode, setPartnerMode] = useState(false)
  const [trafficLight, setTrafficLight] = useState(null)
  const [session, setSession] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  // The inputs above decide tonight's readiness. Everything on the screen reads from this one result.
  const readiness = readinessFor({ trafficLight, comfort: intimacyLevel, libido })

  // If the readiness rules close the partner composer, it turns itself off rather than staying open.
  useEffect(() => {
    if (!readiness.partnerAllowed && partnerMode) setPartnerMode(false)
  }, [readiness.partnerAllowed, partnerMode])

  const tips = TIPS[currentPhase] || TIPS.menstrual
  const shownSuggestions = tips.suggestions.slice(0, readiness.suggestionCount)
  const phaseColor = PHASE_INDICATORS[currentPhase].color
  const tone = TONE_COLORS[readiness.tone]

  // Log intimacy data to Supabase
  const handleLogIntimacy = async () => {
    if (saving) return
    if (!session?.user?.id) {
      setSaveMessage(t('intimacySaveSignIn', { defaultValue: 'Sign in to save this to your account. Nothing has been sent.' }))
      return
    }

    setSaving(true)
    setSaveMessage('')
    try {
      const { error } = await supabase.from('intimacy_logs').insert({
        user_id: session.user.id,
        libido: libido,
        intimacy_level: intimacyLevel,
        preferred_terms: preferredTerms,
        traffic_light: trafficLight,
        date: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
      setSaveMessage(t('intimacySaved', { defaultValue: 'Your private reflection has been saved.' }))
    } catch (err) {
      console.error('Error logging intimacy:', err)
      setSaveMessage(t('intimacySaveError', { defaultValue: 'Could not save. Your choices are still here, so try again.' }))
    } finally {
      setSaving(false)
    }
  }

  const handleTrafficLight = (color) => {
    // Tapping the selected light again clears it, so "no answer yet" is always possible.
    setTrafficLight((current) => (current === color ? null : color))
    setSaveMessage('')
  }

  const handlePartnerMode = (enabled) => {
    if (enabled && !readiness.partnerAllowed) return
    setPartnerMode(enabled)
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <motion.div initial="hidden" animate="visible" exit="hidden" transition={{ type: 'spring', stiffness: 150 }}>
        <Card style={{ margin: '24px', borderRadius: '20px', ...colors.shadows.soft }}>
          <CardHeader>
            <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '16px' }}>
              {t('intimacyCenter', { defaultValue: 'Intimacy' })}
            </Typography>
          </CardHeader>
          <CardContent>
            {/* Phase */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="h6" style={{ color: colors.muted, marginBottom: '12px' }}>
                {t('cyclePhase', { defaultValue: 'Cycle phase' })}
              </Typography>
              <div role="radiogroup" aria-label={t('cyclePhase', { defaultValue: 'Cycle phase' })} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {Object.keys(TIPS).map((phaseKey) => {
                  const selected = currentPhase === phaseKey
                  return (
                    <button
                      key={phaseKey}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCurrentPhase(phaseKey)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '16px',
                        background: selected ? colors.primary + '20' : colors.surface,
                        border: `2px solid ${selected ? colors.primary : colors.muted}`,
                        color: selected ? colors.primary : colors.muted,
                        fontWeight: selected ? typography.weight.medium : typography.weight.normal,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {PHASE_INDICATORS[phaseKey].icon}
                      <span style={{ fontSize: typography.size.xs, marginLeft: '4px' }}>{PHASE_LABELS[phaseKey]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Libido */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }} component="label" htmlFor="intimacy-libido">
                {t('libido', { defaultValue: 'Desire today' })}
              </Typography>
              <select
                id="intimacy-libido"
                style={{ width: '100%', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '8px 12px', fontSize: typography.size.sm, background: colors.cream }}
                value={libido}
                onChange={(e) => setLibido(parseInt(e.target.value, 10))}
              >
                <option value={1}>{t('low', { defaultValue: 'Low' })}</option>
                <option value={5}>{t('moderate', { defaultValue: 'Moderate' })}</option>
                <option value={10}>{t('high', { defaultValue: 'High' })}</option>
              </select>
            </div>

            {/* Openness light: "How open do you feel today?" */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('consentSignal', { defaultValue: 'How open do you feel today?' })}
              </Typography>
              <div role="group" aria-label={t('consentSignal', { defaultValue: 'How open do you feel today?' })} style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                {LIGHTS.map((light) => {
                  const selected = trafficLight === light.key
                  return (
                    <motion.button
                      key={light.key}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${light.label}${selected ? ' (selected)' : ''}`}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      onClick={() => handleTrafficLight(light.key)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: selected ? `3px solid ${TONE_COLORS[light.key]}` : '2px solid transparent',
                        background: selected ? TONE_COLORS[light.key] + '33' : colors.surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: colors.transitions.fast,
                      }}
                    >
                      <span aria-hidden="true">{light.emoji}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Comfort level */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }} component="label" htmlFor="intimacy-comfort">
                {t('intimacyLevel', { defaultValue: 'Comfort level' })}
              </Typography>
              <select
                id="intimacy-comfort"
                style={{ width: '100%', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '8px 12px', fontSize: typography.size.sm, background: colors.cream }}
                value={intimacyLevel}
                onChange={(e) => setIntimacyLevel(parseInt(e.target.value, 10))}
              >
                <option value={1}>{t('low', { defaultValue: 'Low' })}</option>
                <option value={3}>{t('moderate', { defaultValue: 'Moderate' })}</option>
                <option value={5}>{t('high', { defaultValue: 'High' })}</option>
              </select>
            </div>

            {/* Live readiness: changes with every input above */}
            <div
              role="status"
              aria-live="polite"
              data-readiness={readiness.id}
              style={{
                borderLeft: `4px solid ${tone}`,
                background: tone + '14',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px',
                color: colors.onyx,
              }}
            >
              <Typography variant="body2" style={{ lineHeight: 1.6 }}>
                {t(readiness.messageKey, { defaultValue: readiness.message })}
              </Typography>
              {readiness.libidoNote && (
                <Typography variant="caption" style={{ color: colors.muted, display: 'block', marginTop: '6px' }}>
                  {t(readiness.libidoNote.key, { defaultValue: readiness.libidoNote.text })}
                </Typography>
              )}
            </div>

            {/* Preferred terms */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('preferredTerms', { defaultValue: 'Words you like' })}
              </Typography>
              <div role="group" aria-label={t('preferredTerms', { defaultValue: 'Words you like' })} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['romantic', 'sensual', 'sexual', 'spontaneous'].map((term) => {
                  const selected = preferredTerms.includes(term)
                  return (
                    <button
                      key={term}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPreferredTerms((current) => (selected ? current.filter((item) => item !== term) : [...current, term]))}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${selected ? colors.primary : '#E2E8F0'}`,
                        background: selected ? colors.primary + '20' : colors.surface,
                        color: selected ? colors.primary : colors.muted,
                        cursor: 'pointer',
                        fontSize: typography.size.sm,
                      }}
                    >
                      {t(term, { defaultValue: term.charAt(0).toUpperCase() + term.slice(1) })}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Partner mode: only available when the readiness rules allow it */}
            <div style={{ marginBottom: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('partnerMode', { defaultValue: 'Partner note' })}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                disabled={!readiness.partnerAllowed && !partnerMode}
                aria-pressed={partnerMode}
                style={{ padding: '12px', border: `2px solid ${colors.primary}`, borderRadius: '12px', color: colors.primary, fontWeight: typography.weight.medium }}
                onClick={() => handlePartnerMode(!partnerMode)}
              >
                {partnerMode ? t('disablePartner', { defaultValue: 'Turn off partner note' }) : t('enablePartner', { defaultValue: 'Write a partner note' })}
              </Button>
              <Typography variant="caption" style={{ color: colors.muted, marginTop: '8px', display: 'block' }}>
                {readiness.partnerAllowed
                  ? t('partnerModeDesc', { defaultValue: 'Nothing is sent automatically. You choose what to share.' })
                  : t('partnerModeLocked', { defaultValue: 'Closed for today by your openness choice. Change the light above to reopen it.' })}
              </Typography>
            </div>

            {/* Phase tips, with as many ideas as the readiness rules allow */}
            <motion.div style={{ background: `${PHASE_INDICATORS[currentPhase].bg}20`, borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
              <Typography variant="subtitle1" style={{ color: phaseColor, marginBottom: '12px' }}>
                {t(`intimacyTip.${currentPhase}`, { defaultValue: `${tips.title}`, phase: PHASE_LABELS[currentPhase] })}
              </Typography>
              <Typography variant="body2" style={{ lineHeight: 1.6, color: colors.muted, marginBottom: '12px' }}>
                {tips.body}
              </Typography>
              <Typography variant="caption" style={{ color: colors.muted, display: 'block', marginBottom: '6px' }}>
                {t('intimacyIdeasToday', { defaultValue: 'Ideas for today' })}
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '18px', color: colors.onyx }}>
                {shownSuggestions.map((idea) => (
                  <li key={idea} style={{ marginBottom: '4px' }}>{idea}</li>
                ))}
              </ul>
            </motion.div>

            {/* Save */}
            <motion.div whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 200 }}>
              <Button
                fullWidth
                variant="contained"
                disabled={saving}
                aria-busy={saving}
                style={{ background: colors.primary, border: 'none', borderRadius: '12px', color: 'white', padding: '16px', fontWeight: typography.weight.medium, marginTop: '20px' }}
                onClick={handleLogIntimacy}
              >
                {saving ? t('savingPrivateReflection', { defaultValue: 'Saving privately…' }) : t('saveIntimacy', { defaultValue: 'Save' })}
              </Button>
            </motion.div>
            <Typography role="status" aria-live="polite" variant="caption" style={{ display: 'block', minHeight: '1.4em', marginTop: '8px', color: colors.muted }}>
              {saveMessage}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Intimacy
