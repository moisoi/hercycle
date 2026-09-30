import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Button, Typography, Select, MenuItem } from '@mui/material'
import { FaDropOfBlood, FaLeaf, FaHeart, FaMoon, FaSun } from 'react-icons/fa'
import { AiFillSmile, AiOutlineCalendar } from 'react-icons/ai'
import { GiMascotSpirit } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import { colors, typography } from '../styles'
import { supabase } from '../lib/supabase'

const CycleLog = () => {
  const [currentPhase, setCurrentPhase] = useState('menstrual')
  const [libido, setLibido] = useState(5)
  const [mood, setMood] = useState(5)
  const [intimacyLevel, setIntimacyLevel] = useState(0)
  const [showIntimacy, setShowIntimacy] = useState(false)
  const [session, setSession] = useState(null)

  const { t } = useTranslation()

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  // Save cycle log to Supabase
  const handleSave = async () => {
    if (!session?.user?.id) {
      // Show onboarding or login required
      console.log('User not logged in')
      return
    }

    try {
      const { error } = await supabase.from('cycles').insert({
        user_id: session.user.id,
        phase: currentPhase,
        mood: mood,
        libido: libido,
        intimacy_level: intimacyLevel,
        period: false,
        date: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      // Show success feedback
      console.log('Cycle logged successfully!')
      
      // Award coins - could call a function here
      // awardCoins(session.user.id, 10, 'cycle_log')
      
      // Check quest progress
      // checkQuestProgress(session.user.id, 'log_cycle')

      // Reset form or navigate
      // setMood(5)
      // setLibido(5)
      // setIntimacyLevel(0)
    } catch (err) {
      console.error('Error logging cycle:', err)
    }
  }

  // Get intimacy tips for phase
  const getIntimacyTips = async (phase) => {
    try {
      const { data, error } = await supabase
        .from('intimacy_logs')
        .select('*')
        .eq('user_id', session?.user?.id || '')
        .maybeSingle()

      if (error) throw error

      const tips = {
        menstrual: {
          title: 'Menstrual Phase',
          color: '#C15B70',
          body: 'Period sex can ease cramps for some. If you are not into penetration, focus on external touch or non-sexual intimacy.',
          suggestions: ['External touch only', 'Use a menstrual cup', 'Focus on cuddling', 'Try shower sex']
        },
        follicular: {
          title: 'Follicular Phase',
          color: '#A8D5B8',
          body: 'Energy is rising. Good time to try something new or bring up a desire you have been curious about.',
          suggestions: ['Try new positions', 'Initiate earlier in the day', 'Experiment with touch', 'Plan a romantic date']
        },
        ovulatory: {
          title: 'Ovulatory Phase',
          color: '#FF8C42',
          body: 'Confidence and attraction often peak. If you are into it, this is a great time to initiate or plan a date.',
          suggestions: ['Use protection if needed', 'High confidence - try something adventurous', 'Initiate intimacy', 'Plan a special date or getaway']
        },
        luteal: {
          title: 'Luteal Phase',
          color: '#6B5B9A',
          body: 'You might prefer emotional closeness over intensity. Think cuddles, massage, deep talks.',
          suggestions: ['Emotional connection and deep talks', 'Sensual massage with oil', 'Cuddling and non-goal-oriented touch', 'Be gentle with yourself if PMS appears']
        }
      }

      return tips[phase] || tips.menstrual
    } catch (err) {
      console.error('Error fetching intimacy tips:', err)
      return null
    }
  }

  // Phase change handler
  const handlePhaseChange = (phase) => {
    setCurrentPhase(phase)
  }

  // Libido change handler
  const handleLibidoChange = (value) => {
    setLibido(value)
  }

  // Intimacy level change
  const handleIntimacyChange = (value) => {
    setIntimacyLevel(value)
  }

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
              {t('logCheckIn')}
            </Typography>
          </CardHeader>
          <CardContent>

            {/* Phase Selection */}
            <div style={{ mb: '20px' }}>
              <Typography variant="subtitle1" style={{ color: colors.muted, marginBottom: '8px' }}>
                {t('currentPhase')}
              </Typography>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px'
              }}>
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

            {/* Mood & Libio */}
            <div style={{ mb: '20px', gap: '16px' }}>
              <div>
                <Typography variant="subtitle1" style={{ color: colors.muted, fontSize: typography.size.sm }}>
                  {t('mood')}
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
                  value={mood}
                  onChange={(e) => handleMoodChange(parseInt(e.target.value))}
                >
                  <option value={1}>{t('low')}</option>
                  <option value={5}>{t('moderate')}</option>
                  <option value={10}>{t('high')}</option>
                </select>
              </div>

              <div>
                <Typography variant="subtitle1" style={{ color: colors.muted, fontSize: typography.size.sm }}>
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
                onChange={(e) => handleIntimacyChange(parseInt(e.target.value))}
              >
                <option value={0}>{t('notInMood')}</option>
                <option value={1}>{t('low')}</option>
                <option value={2}>{t('medium')}</option>
                <option value={3}>{t('high')}</option>
              </select>
            </div>

            {/* Save Button */}
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
                onClick={() => handleSave}
              >
                {t('saveAndContinue')}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Phase labels
const phaseLabels = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
}

// Intimacy indicators (moved outside)
const phaseIndicators = {
  menstrual: { color: '#C15B70', icon: FaDropOfBlood, bg: '#FDE8EE' },
  follicular: { color: '#A8D5B8', icon: FaLeaf, bg: '#E6F7F2' },
  ovulatory: { color: '#FF8C42', icon: FaHeart, bg: '#FFF4E5' },
  luteal: { color: '#6B5B9A', icon: FaPregnant, bg: '#F0E6FF' },
}

export default CycleLog