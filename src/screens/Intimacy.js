import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Button, Typography, Select, MenuItem } from '@mui/material'
import { FaHeart, FaLeaf, FaMoon, FaSun } from 'react-icons/fa'
import { motion } from 'framer-motion'

import { colors, typography } from '../styles'
import { supabase } from '../lib/supabase'

const Intimacy = () => {
  const [currentPhase, setCurrentPhase] = useState('menstrual')
  const [libido, setLibido] = useState(5)
  const [intimacyLevel, setIntimacyLevel] = useState(3)
  const [preferredTerms, setPreferredTerms] = useState(['romantic', 'sensual'])
  const [partnerMode, setPartnerMode] = useState(false)
  const [trafficLight, setTrafficLight] = useState(null)
  const [session, setSession] = useState(null)

  const { t } = useTranslation()

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  // Log intimacy data to Supabase
  const handleLogIntimacy = async () => {
    if (!session?.user?.id) return

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
      console.log('Intimacy logged successfully!')
      // Could award coins, check quests, etc.
    } catch (err) {
      console.error('Error logging intimacy:', err)
    }
  }

  // Get intimacy tips for phase
  const getIntimacyTips = async () => {
    const tips = {
      menstrual: {
        title: 'Menstrual Phase',
        color: '#C15B70',
        body: 'Period sex can ease cramps for some. If you are not into penetration, focus on external touch or non-sexual intimacy.',
        suggestions: ['External touch only', 'Use a menstrual cup for mess-free period sex', 'Focus on cuddling and emotional connection', 'Try shower sex for easier cleanup']
      },
      follicular: {
        title: 'Follicular Phase',
        color: '#A8D5B8',
        body: 'Energy rising. Good time to try something new or bring up a desire you have been curious about.',
        suggestions: ['Try new positions or activities', 'Initiate intimacy earlier in the day when energy is higher', 'Experiment with different types of touch', 'Plan a romantic date']
      },
      ovulatory: {
        title: 'Ovulatory Phase',
        color: '#FF8C42',
        body: 'Confidence and attraction often peak. If you are into it, this is a great time to initiate or plan a date.',
        suggestions: ['This is peak fertility - use protection if needed', 'High confidence - great time to try something adventurous', 'Initiate intimacy - your desire may be peak', 'Plan a special date or getaway']
      },
      luteal: {
        title: 'Luteal Phase',
        color: '#6B5B9A',
        body: 'You might prefer emotional closeness over intensity. Think cuddles, massage, deep talks.',
        suggestions: ['Focus on emotional connection and deep talks', 'Sensual massage with oil', 'Cuddling and non-goal-oriented touch', 'Be gentle with yourself if PMS symptoms appear']
      }
    }

    return tips[currentPhase] || tips.menstrual
  }

  // Phase change handler
  const handlePhaseChange = (phase) => {
    setCurrentPhase(phase)
  }

  // Libido change
  const handleLibidoChange = (value) => {
    setLibido(value)
  }

  // Intimacy level change
  const handleIntimacyLevelChange = (value) => {
    setIntimacyLevel(value)
  }

  // Terms change
  const handleTermsChange = (terms) => {
    setPreferredTerms(terms)
  }

  // Partner mode toggle
  const handlePartnerMode = (enabled) => {
    setPartnerMode(enabled)
  }

  // Traffic light change
  const handleTrafficLight = (color) => {
    setTrafficLight(color)
  }

  // Get current tips
  const tips = getIntimacyTips()

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", stiffness: 150 }}
      >
        <Card style={{
          margin: '24px',
          borderRadius: '20px',
          ...colors.shadows.soft,
        }}>
          <CardHeader>
            <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '16px' }}>
              {t('intimacyCenter')}
            </Typography>
          </CardHeader>
          <CardContent>

            {/* Phase & Libido */}
            <div style={{ mb: '20px' }}>
              <Typography variant="h6" style={{ color: colors.muted, marginBottom: '12px' }}>
                {t('cyclePhase')}
              </Typography>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {['menstrual', 'follicular', 'ovulatory', 'luteal'].map((phaseKey) => (
                  <motion.div
                    key={phaseKey}
                    whileHover={{ scale: 1.1 }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '16px',
                      background: currentPhase === phaseKey ? colors.primary + '20' : colors.surface,
                      border: `2px solid ${currentPhase === phaseKey ? colors.primary : colors.muted}`,
                      color: currentPhase === phaseKey ? colors.primary : colors.muted,
                      fontWeight: currentPhase === phaseKey ? typography.weight.medium : typography.weight.normal,
                      cursor: 'pointer',
                      transition: colors.transitions.fast,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => handlePhaseChange(phaseKey)}
                  >
                    {phaseIndicators[phaseKey].icon}
                    <span style={{ fontSize: typography.size.xs, marginLeft: '4px' }}>
                      {phaseLabels[phaseKey]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Libido */}
            <div style={{ mb: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('libido')}
              </Typography>
              <select
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '8px 12px',
                  fontSize: typography.size.sm,
                  background: colors.cream,
                }}
                value={libido}
                onChange={(e) => handleLibidoChange(parseInt(e.target.value))}
              >
                <option value={1}>{t('low')}</option>
                <option value={5}>{t('moderate')}</option>
                <option value={10}>{t('high')}</option>
              </select>
            </div>

            {/* Intimacy Level */}
            <div style={{ mb: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('intimacyLevel')}
              </Typography>
              <select
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '8px 12px',
                  fontSize: typography.size.sm,
                  background: colors.cream,
                }}
                value={intimacyLevel}
                onChange={(e) => handleIntimacyLevelChange(parseInt(e.target.value))}
              >
                <option value={1}>{t('low')}</option>
                <option value={3}>{t('moderate')}</option>
                <option value={5}>{t('high')}</option>
              </select>
            </div>

            {/* Preferred Terms */}
            <div style={{ mb: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('preferredTerms')}
              </Typography>
              <select
                multiple
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '8px 12px',
                  fontSize: typography.size.sm,
                  background: colors.cream,
                  height: 'auto',
                  minHeight: '100px',
                }}
                value={preferredTerms}
                onChange={(e) => handleTermsChange(e.target.value)}
              >
                <option value="romantic">{t('romantic')}</option>
                <option value="sensual">{t('sensual')}</option>
                <option value="sexual">{t('sexual')}</option>
                <option value="spontaneous">{t('spontaneous')}</option>
              </select>
            </div>

            {/* Partner Mode */}
            <div style={{ mb: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('partnerMode')}
              </Typography>
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Button
                  variant="outlined"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${colors.primary}`,
                    borderRadius: '12px',
                    color: colors.primary,
                    fontWeight: typography.weight.medium,
                  }}
                  onClick={() => handlePartnerMode(!partnerMode)}
                >
                  {partnerMode ? t('disablePartner') : t('enablePartner')}
                </Button>
              </motion.div>
              <Typography variant="caption" style={{ color: colors.muted, marginTop: '8px' }}>
                {t('partnerModeDesc')}
              </Typography>
            </div>

            {/* Traffic Light System */}
            <div style={{ mb: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('consentSignal')}
              </Typography>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', background: trafficLight === 'green' ? '#22C55E' : trafficLight === 'yellow' ? '#F59E0B' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', cursor: trafficLight ? 'pointer' : 'default', transition: colors.transitions.fast,
                  }}
                  onClick={() => handleTrafficLight('green')}
                >
                  '🟢'
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', background: trafficLight === 'yellow' ? '#F59E0B' : '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', cursor: trafficLight ? 'pointer' : 'default', transition: colors.transitions.fast,
                  }}
                  onClick={() => handleTrafficLight('yellow')}
                >
                  '🟡'
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', background: trafficLight === 'red' ? '#EF4444' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontWeight: 'bold', cursor: trafficLight ? 'pointer' : 'default', transition: colors.transitions.fast,
                  }}
                  onClick={() => handleTrafficLight('red')}
                >
                  '🔴'
                </motion.div>
              </div>
              <Typography variant="caption" style={{ color: colors.muted, marginTop: '8px' }}>
                {t('trafficLightDesc')}
              </Typography>
            </div>

            {/* Phase-Specific Intimacy Tips */}
            <motion.div
              style={{
                background: `${phaseIndicators[currentPhase].bg}20`,
                borderRadius: '16px',
                padding: '20px',
                marginTop: '20px',
              }}
            >
              <Typography variant="subtitle1" style={{ color: phaseIndicators[currentPhase].color, marginBottom: '12px' }}>
                {t(`intimacyTip.${currentPhase}`, { phase: phaseLabels[currentPhase] })}
              </Typography>
              <Typography variant="body2" style={{ lineHeight: 1.6, color: colors.muted, marginBottom: '0px' }}>
                {tips?.body || ''}
              </Typography>
            </motion.div>

            {/* Save Intimacy Button */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Button
                fullWidth
                variant="contained"
                style={{
                  background: colors.primary,
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  padding: '16px',
                  fontWeight: typography.weight.medium,
                  marginTop: '20px',
                  ...colors.transitions.fast,
                }}
                onClick={() => handleLogIntimacy}
              >
                {t('saveIntimacy')}
              </Button>
            </motion.div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Phase labels (moved outside)
const phaseLabels = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
}

// Phase indicators (moved outside)
const phaseIndicators = {
  menstrual: { color: '#C15B70', icon: '🩸', bg: '#FDE8EE' },
  follicular: { color: '#A8D5B8', icon: '🌿', bg: '#E6F7F2' },
  ovulatory: { color: '#FF8C42', icon: '❤️', bg: '#FFF4E5' },
  luteal: { color: '#6B5B9A', icon: '💜', bg: '#F0E6FF' },
}

export default Intimacy