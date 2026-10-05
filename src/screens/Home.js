import React, { useCallback, useEffect, useState } from 'react'
import { Card, Button, Typography } from '@mui/material'
import { GiSparkSpirit } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import { colors } from '../styles'
import { supabase } from '../lib/supabase'

const Home = () => {
  const currentPhase = 'menstrual'
  const dayCount = 5
  const [cycleStreak, setCycleStreak] = useState(0)
  const [coins, setCoins] = useState(0)
  const [level, setLevel] = useState(1)
  const [session, setSession] = useState(null)
  const moodScore = 5
  const libidoScore = 5

  const { t } = useTranslation()

  const fetchUserProgress = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (!error && data) {
        setCycleStreak(data.current_streak || 0)
        setCoins(data.total_coins || 0)
        setLevel(data.current_level || 1)
      }
    } catch (err) {
      console.error('Error fetching progress:', err)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        fetchUserProgress(session.user.id)
      }
    })
  }, [fetchUserProgress])



  const phaseColors = {
    menstrual: { bg: '#FDE8EE', border: '#C15B70', icon: '🩸' },
    follicular: { bg: '#E6F7F2', border: '#A8D5B8', icon: '🌿' },
    ovulatory: { bg: '#FFF4E5', border: '#FF8C42', icon: '❤️' },
    luteal: { bg: '#F0E6FF', border: '#6B5B9A', icon: '💜' },
  }

  const quests = [
    { id: 1, title: 'Log mood 4 days this week', description: 'Unlock PMS pattern card', progress: 2, target: 4, reward: 50 },
    { id: 2, title: 'Self-care activity', description: 'Sorcerer badge', progress: 1, target: 1, reward: 100 },
  ]

  const addCoins = async (amount) => {
    if (!session?.user?.id) return
    try {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (progress) {
        const newCoins = (progress.total_coins || 0) + amount
        const newLevel = determineLevel(newCoins)
        await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          total_coins: newCoins,
          current_level: newLevel,
        })
        setCoins(newCoins)
        setLevel(newLevel)
      }
    } catch (err) {
      console.error(err)
    }
  }
  const determineLevel = (coins) => {
    if (coins >= 1000) return 5
    if (coins >= 500) return 4
    if (coins >= 250) return 3
    if (coins >= 100) return 2
    return 1
  }
  const completeQuest = (q) => addCoins(q.reward)

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <header style={{ padding: '20px', background: '#FFFDFD', borderBottom: '1px solid #E4E4E7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3" style={{ fontWeight: 600 }}>
            {t('dashboard')}
          </Typography>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {session?.user?.id && (
              <>
                <span>{coins} {t('cycleCoins')}</span>
                <Typography variant="body2" style={{ color: colors.muted, fontSize: 12 }}>
                  Level {level}
                </Typography>
              </>
            )}
            {!session?.user?.id && (
              <Button variant="text" style={{ fontSize: 12, color: colors.primary }}>
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </header>
      <div style={{ padding: '20px' }}>
          {/* Phase Banner */}
          <motion.div
            initial="in"
            animate="in"
            exit="out"
            transition={{ duration: 0.5 }}
            style={{ background: phaseColors[currentPhase].bg, borderRadius: '20px', padding: '20px', marginBottom: '20px', border: `2px solid ${phaseColors[currentPhase].border}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: phaseColors[currentPhase].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {phaseColors[currentPhase].icon}
              </div>
              <div>
                <Typography style={{ fontWeight: 600, color: phaseColors[currentPhase].border }}>
                  {t(`phase.${currentPhase}`)}
                </Typography>
                <Typography variant="body2" style={{ color: colors.muted, fontSize: 12 }}>
                  {t(`phase.${currentPhase}.desc`, { day: dayCount })}
                </Typography>
              </div>
            </div>
          </motion.div>

          {/* Daily Check-in Card */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card style={{ background: colors.surface, borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '12px' }}>{t('dailyCheckIn')}</Typography>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <Typography variant="subtitle1" style={{ color: colors.muted, fontSize: 12 }}>{t('mood')}</Typography>
                  <div style={{ height: 6, borderRadius: '3px', background: colors.muted, marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${(moodScore / 10) * 100}%`, background: colors.primary, transition: colors.transitions.fast }} />
                  </div>
                  <span style={{ fontSize: 10, color: colors.muted, marginLeft: '4px' }}>{moodScore}/10</span>
                </div>
                <div>
                  <Typography variant="subtitle1" style={{ color: colors.muted, fontSize: 12 }}>{t('libido')}</Typography>
                  <div style={{ height: 6, borderRadius: '3px', background: colors.muted, marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${(libidoScore / 10) * 100}%`, background: colors.ovulatory.goldenPeach, transition: colors.transitions.fast }} />
                  </div>
                  <span style={{ fontSize: 10, color: colors.muted, marginLeft: '4px' }}>{libidoScore}/10</span>
                </div>
              </div>
              <Button
                style={{ width: '100%', background: colors.primary, border: 'none', borderRadius: '10px', color: 'white', padding: '8px', fontWeight: 500, marginTop: '8px', ...colors.transitions.fast }}
                onClick={() => console.log('Log')}
              >
                {t('logCheckIn')}
              </Button>
            </Card>
          </motion.div>

          {/* Quests Section */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ marginTop: '20px' }}
          >
            <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '12px' }}>{t('cycleQuests')}</Typography>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {quests.map((q) => (
                <motion.div
                  key={q.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 150 }}
                  style={{ background: colors.surface, borderRadius: '12px', padding: '15px', border: `1px solid ${colors.muted}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Typography variant="subtitle2" style={{ fontWeight: 500 }}>{q.title}</Typography>
                    <Typography variant="caption" style={{ color: colors.muted, fontSize: 10 }}>{q.progress}/{q.target}</Typography>
                  </div>
                  <div style={{ height: 6, borderRadius: '4px', background: colors.muted, marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: `${(q.progress / q.target) * 100}%`, background: colors.primary, transition: colors.transitions.fast }} />
                  </div>
                  <Typography variant="caption" style={{ color: colors.muted, fontSize: 10 }}>{t('reward', { amount: q.reward })} {t('cycleCoins')}</Typography>
                  <Button size="small" variant="text" style={{ width: '100%', padding: '6px', textAlign: 'left', color: colors.primary, border: 'none' }} onClick={() => completeQuest(q)}>
                    {t('completeQuest')}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Energy Map */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ marginTop: '20px' }}
          >
            <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '12px' }}>{t('energyMap')}</Typography>
            <div style={{ background: colors.surface, borderRadius: '12px', padding: '15px' }}>
              <div style={{ height: '60px', background: 'transparent' }} />
            </div>
          </motion.div>

          {/* Mascot Area */}
          <motion.div style={{ marginTop: '24px', textAlign: 'center' }}>
            <GiSparkSpirit style={{ width: 60, height: 60, color: colors.primary, margin: '0 auto', display: 'block' }} />
            <Typography variant="body2" style={{ marginTop: '12px', color: colors.muted }}>{t('mascotCheer', { streak: cycleStreak })}</Typography>
          </motion.div>
        </div>
    </div>
  )
}


export default Home
