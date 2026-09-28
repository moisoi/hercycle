import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, Typography, Button } from '@mui/material'
import { FaChartBar, FaLeaf, FaHeart } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

import { colors, typography } from '../styles'

const Insights = () => {
  const { t } = useTranslation()

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.onyx }}>
      <div style={{ padding: '20px', background: '#FFFDFD', borderBottom: '1px solid #E4E4E7' }}>
        <Typography variant="h3" style={{ fontWeight: 600 }}>
          {t('cycleInsights')}
        </Typography>
      </div>
      <div style={{ padding: '20px' }}>
        <Typography variant="h5" style={{ color: colors.onyx, marginBottom: '12px' }}>
          {t('moodLibidoTrend')}
        </Typography>
        <Typography variant="body2" style={{ lineHeight: 1.6, color: colors.muted }}>
          Tracking your mood and libido over time helps identify patterns.
        </Typography>
        <Typography variant="h5" style={{ color: colors.onyx, marginTop: '20px', marginBottom: '8px' }}>
          {t('keyInsights')}
        </Typography>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ color: colors.muted, marginBottom: '6px' }}>
            📈 {t('insight1')}
          </li>
          <li style={{ color: colors.muted, marginBottom: '6px' }}>
            🌸 {t('insight2')}
          </li>
          <li style={{ color: colors.muted, marginBottom: '6px' }}>
            💫 {t('insight3')}
          </li>
          <li style={{ color: colors.muted, marginBottom: '6px' }}>
            🌿 {t('insight4')}
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Insights