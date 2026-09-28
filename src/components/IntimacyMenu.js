import React, { useState } from 'react'
import { Card, CardContent, CardHeader, Button, Typography } from '@mui/material'
import { FaHeart, FaLeaf, FaMoon, FaSun } from 'react-icons/fa'
import { motion } from 'framer-motion'

import { colors, typography } from '../styles'

const IntimacyMenu = () => {
  const [menuItems, setMenuItems] = useState([
    { id: 1, title: '10-minute guided body scan together', tried: false },
    { id: 2, title: 'Dance to one song in the kitchen, no phones', tried: false },
    { id: 3, title: 'Share one fantasy or boundary you've been thinking about', tried: false },
    { id: 4, title: 'Sensual massage with oil—focus on shoulders and back only', tried: false },
  ])

  const [currentIndex, setCurrentIndex] = useState(0)

  const rotateMenu = () => {
    const newIndex = (currentIndex + 1) % menuItems.length
    setCurrentIndex(newIndex)
  }

  const markTried = (id) => {
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, tried: true } : item
    )
    setMenuItems(updated)
  }

  const item = menuItems[currentIndex]

  return (
    <motion.div
      style={{
        background: colors.surface,
        borderRadius: '20px',
        padding: '24px',
        ...colors.shadows.soft,
        marginBottom: '24px',
      }}
    >
      <CardHeader>
        <Typography variant="h5" style={headerStyle}>
          {t('intimacyMenu')}
        </Typography>
      </CardHeader>
      <CardContent>
        {item ? (
          <>
            <Typography variant="h6" style={{ color: colors.onyx, marginBottom: '16px' }}>
              {t(`intimacyPhase.${currentPhase}`, { phase: currentPhaseName }) }
            </Typography>
            <Typography variant="body2" style={{ lineHeight: 1.6, color: colors.muted, marginBottom: '24px' }}>
              {item.title}
            </Typography>
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Button
                variant="contained"
                style={{
                  background: colors.primary,
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  width: '100%',
                  padding: '12px',
                  fontWeight: typography.weight.medium,
                  ...colors.transitions.fast,
                }}
                onClick={() => markTried(item.id)}
              >
                {item.tried ? t('markTried') : t('tryIt')}
              </Button>
            </motion.div>
          </>
        ) : (
          <Typography variant="body1" style={{ color: colors.muted }}>
            {t('noItemsAvailable')}
          </Typography>
        )}
      </CardContent>
    </motion.div>
  )
}

// Helper translations
const t = (key, replacements = {}) => {
  const translations = {
    intimacyMenu: 'Intimacy Menu',
    tryIt: 'Try It',
    markTried: 'Mark as Tried',
    noItemsAvailable: 'No new suggestions at this time',
    phase: {
      menstrual: 'Menstrual',
      follicular: 'Follicular',
      ovulatory: 'Ovulatory',
      luteal: 'Luteal',
    },
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulatory: 'Ovulatory',
    luteal: 'Luteal',
  }
  return translations[key] || key
}

const headerStyle = {
  fontSize: typography.size.md,
  fontWeight: typography.weight.medium,
  color: colors.onyx,
}