import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, Button, Typography } from '@mui/material'
import { FaDropOfBlood, FaLeaf, FaHeart, FaMoon, FaSun } from 'react-icons/fa'
import { AiFillSmile, AiOutlineCalendar } from 'react-icons/ai'
import { GiMascotSpirit } from 'react-icons/gi'

import { colors, typography } from '../styles'

const Dashboard = () => {
  const [currentPhase, setCurrentPhase] = useState('menstrual')
  const [dayCount, setDayCount] = useState(1)
  const [cycleStreak, setCycleStreak] = useState(0)
  const [coins, setCoins] = useState(0)
  const [level, setLevel] = useState(1)

  const phaseColors = {
    menstrual: { bg: '#FDE8EE', border: '#C15B70', icon: FaDropOfBlood },
    follicular: { bg: '#E6F7F2', border: '#A8D5B8', icon: FaLeaf },
    ovulatory: { bg: '#FFF4E5', border: '#FF8C42', icon: FaHeart },
    luteal: { bg: '#F0E6FF', border: '#6B5B9A', icon: FaPregnant },
  }

  const phaseLabels = {
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulatory: 'Ovulatory',
    luteal: 'Luteal',
  }

  // Quest data
  const quests = [
    { id: 1, title: 'Log mood 4 days this week', description: 'Unlock your PMS pattern card', progress: 2, target: 4, reward: 50 },
    { id: 2, title: 'Try one new self-care activity', description: 'Earn the Self-Care Sorcerer badge', progress: 1, target: 1, reward: 100 },
  ]

  // Level up info
  const levelData = {
    1: { coinsNeeded: 0, title: 'Beginner' },
    2: { coinsNeeded: 100, title: 'Cycle Novice' },
    3: { coinsNeeded: 250, title: 'Cycle Enthusiast' },
    4: { coinsNeeded: 500, title: 'Cycle Veteran' },
    5: { coinsNeeded: 1000, title: 'Cycle Master' },
  }

  const handlePhaseChange = (phase) => {
    setCurrentPhase(phase)
  }

  const addCoins = (amount) => {
    setCoins(coins + amount)
    checkLevelUp()
  }

  const checkLevelUp = () => {
    const currentLevelData = levelData[level]
    if (currentLevelData && coins >= currentLevelData.coinsNeeded && level < 5) {
      setLevel(level + 1)
      // Trigger celebration animation
      console.log('Level up!', level)
    }
  }

  const completeQuest = (quest) => {
    addCoins(quest.reward)
    // Update quest progress
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", stiffness: 150 }}
      >
        {/* Header with Stats */}
        <header style={{ padding: '24px', background: 'linear-gradient(135deg, #FFFDFD 0%, #F7F5F3 100%)', borderBottom: '1px solid #E4E4E7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h3" style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold }}>
              {t('dashboard')}
            </Typography>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <motion.span
                initial="0"
                animate={coins}
                style={{ ...colors.transitions.fast }}
              >
                {coins} {t('cycleCoins')}
              </motion.span>
              <Typography variant="body2" style={{ color: colors.muted, fontSize: typography.size.sm }}>
                Level {level}
              </Typography>
            </div>
          </div>
        </header>

        {/* Phase Overview */}
        <main className="p-6 max-w-3xl mx-auto">
          {/* Current Phase Banner */}
          <motion.div
            style={{
              background: phaseColors[currentPhase].bg,
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '24px',
              border: `2px solid ${phaseColors[currentPhase].border}`,
              ...colors.transitions.normal,
            }}
          >
            <div className="flex items-start gap-4">
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '14px',
                  background: phaseColors[currentPhase].bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {phaseColors[currentPhase].icon}
              </div>
              <div className="flex-1">
                <Typography variant="h5" style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: phaseColors[currentPhase].border }}>
                  {t(`phase.${currentPhase}`)}
                </Typography>
                <Typography variant="body2" style={{ color: colors.muted, fontSize: typography.size.sm }}>
                  {t(`phase.${currentPhase}.desc`, { day: dayCount })}
                </Typography>
              </div>
            </div>
          </motion.div>

          {/* Daily Check-in */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card style={{
              background: colors.surface,
              borderRadius: '20px',
              padding: '24px',
              ...colors.shadows.soft,
            }}>
              <CardHeader>
                <Typography variant="h5" style={headerStyle}>
                  {t('dailyCheckIn')}
                </Typography>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Mood */}
                  <div>
                    <Typography variant="subtitle1" style={{ color: colors.muted, fontSize: typography.size.sm }}>
                      {t('mood')}
                    </Typography>
                    <div style={{ height: 8, borderRadius: '4px', background: colors.muted, overflow: 'hidden', marginTop: '4px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(moodScore / 10) * 100}%`,
                          background: colors.primary,
                          transition: colors.transitions.fast,
                        }}
                      />
                    </div>
                  </div>

                  {/* Libido */}
                  <div>
                    <Typography variant="subtitle1" style={{ color: colors.muted, fontSize: typography.size.sm }}>
                      {t('libido')}
                    </Typography>
                    <div style={{ height: 8, borderRadius: '4px', background: colors.muted, overflow: 'hidden', marginTop: '4px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(libidoScore / 10) * 100}%`,
                          background: colors.ovulatory.goldenPeach,
                          transition: colors.transitions.fast,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  fullWidth
                  variant="contained"
                  style={{
                    background: colors.primary,
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    width: '100%',
                    padding: '12px',
                    fontWeight: typography.weight.medium,
                    marginTop: '16px',
                    ...colors.transitions.fast,
                  }}
                >
                  {t('logCheckIn')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quests Section */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ marginTop: '24px' }}
          >
            <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '16px' }}>
              {t('cycleQuests')}
            </Typography>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {quests.map((quest) => (
                <motion.div
                  key={quest.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 150 }}
                  style={{
                    background: colors.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${colors.muted}`,
                    transition: colors.transitions.normal,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Typography variant="subtitle2" style={{ fontWeight: typography.weight.m }}>
                      {quest.title}
                    </Typography>
                    <Typography variant="caption" style={{ color: colors.muted, fontSize: typography.size.xs }}>
                      {quest.progress}/{quest.target}
                    </Typography>
                  </div>
                  <div style={{ height: 8, borderRadius: '4px', background: colors.muted, overflow: 'hidden', marginBottom: '12px' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(quest.progress / quest.target) * 100}%`,
                        background: colors.primary,
                        transition: colors.transitions.fast,
                      }}
                    />
                  </div>
                  <Typography variant="caption" style={{ color: colors.muted, fontSize: typography.size.sm }}>
                    {t('reward', { amount: quest.reward })} {t('cycleCoins')}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    style={{ width: '100%', padding: '8px', textAlign: 'left', color: colors.primary, border: 'none' }}
                    onClick={() => completeQuest(quest)}
                  >
                    {t('completeQuest')}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Progress Visuals */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ marginTop: '24px' }}
          >
            <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '16px' }}>
              {t('energyMap')}
            </Typography>
            <div style={{ background: colors.surface, borderRadius: '16px', padding: '20px' }}>
              {/* Simple placeholder for energy map */}
              <div style={{ height: '80px', background: 'transparent' }}>
                {/* Contribution-style heatmap would go here */}
              </div>
            </div>
          </motion.div>

          {/* Mascot Area */}
          <motion.div
            style={{
              marginTop: '32px',
              textAlign: 'center',
            }}
          >
            <GiMascotSpirit
              style={{
                width: 80,
                height: 80,
                color: colors.primary,
                margin: '0 auto',
                display: 'block',
              }}
            />
            <Typography variant="body2" style={{ marginTop: '12px', color: colors.muted }}>
              {t('mascotCheer', { streak: cycleStreak })}
            </Typography>
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}

// Helper translations
const t = (key, replacements = {}) => {
  const translations = {
    dashboard: 'Dashboard',
    dailyCheckIn: 'Daily Check-In',
    mood: 'Mood',
    libido: 'Libido',
    logCheckIn: 'Log & Continue',
    cycleQuests: 'Cycle Quests',
    reward: 'Reward',
    cycleCoins: 'Cycle Coins',
    completeQuest: 'Complete',
    energyMap: 'Energy Map',
    mascotCheer: 'Keep going! You have {streak} day streak.',
    phase: {
      menstrual: 'Menstrual',
      follicular: 'Follicular',
      ovulatory: 'Ovulatory',
      luteal: 'Luteal',
    },
    phase: {
      menstrual: 'Menstrual phase - focus on rest and self-care',
      follicular: 'Follicular phase - energy is rising, great for new projects',
      ovulatory: 'Ovulatory phase - confidence and attraction peak',
      luteal: 'Luteal phase - PMS symptoms may appear, prioritize emotional connection',
    },
  }
  return translations[key] || key
}

const headerStyle = {
  fontSize: typography.size.md,
  fontWeight: typography.weight.medium,
  color: colors.onyx,
}