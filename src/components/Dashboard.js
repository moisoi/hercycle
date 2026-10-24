import React from 'react'
import { Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiArrowRight, FiDroplet, FiHeart, FiSun } from 'react-icons/fi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { useTranslation } from 'react-i18next'

import { formatDisplayDate } from '../lib/period'

const Dashboard = ({
  latestEntry = null,
  cycleDay = null,
  seeds = 0,
  stage = 1,
  onQuickLog,
}) => {
  const { t, i18n } = useTranslation()
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const phaseLabel = latestEntry?.phase ? t(`phase.${latestEntry.phase}`) : '—'
  const moodValue =
    latestEntry && latestEntry.mood !== null && latestEntry.mood !== undefined
      ? `${latestEntry.mood}/10`
      : '—'
  const energyValue =
    latestEntry && latestEntry.energy !== null && latestEntry.energy !== undefined
      ? `${latestEntry.energy}/10`
      : '—'

  return (
    <motion.section
      className="hc-dashboard-widget hc-spotlight-card"
      aria-label={t('dashboardTitle')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="hc-dashboard-header">
        <div>
          <span className="eyebrow-label">
            <AutoAwesomeRoundedIcon sx={{ fontSize: 13, mr: 0.6 }} />
            {t('dashboardTitle')}
          </span>
          <h3>
            {latestEntry?.start_date
              ? `${formatDisplayDate(latestEntry.start_date, locale)}${
                  cycleDay ? ` · ${t('cycleDayBadge', { day: cycleDay })}` : ''
                }`
              : t('dashboardNoEntry')}
          </h3>
        </div>

        {onQuickLog && (
          <Button
            type="button"
            variant="outlined"
            size="small"
            className="phase-spotlight-button hc-spotlight-btn"
            endIcon={<FiArrowRight aria-hidden="true" />}
            onClick={onQuickLog}
          >
            {t('logToday')}
          </Button>
        )}
      </div>

      <div className="hc-dashboard-grid">
        <div className="hc-dashboard-item">
          <div className="hc-dashboard-item-top">
            <span className="hc-dashboard-icon hc-dashboard-icon-rose" aria-hidden="true">
              <FiDroplet />
            </span>
            <span className="hc-dashboard-kicker">{t('cyclePhase')}</span>
          </div>
          <strong>{phaseLabel}</strong>
        </div>

        <div className="hc-dashboard-item">
          <div className="hc-dashboard-item-top">
            <span className="hc-dashboard-icon hc-dashboard-icon-sage" aria-hidden="true">
              <FiHeart />
            </span>
            <span className="hc-dashboard-kicker">{t('mood')}</span>
          </div>
          <strong>{moodValue}</strong>
        </div>

        <div className="hc-dashboard-item">
          <div className="hc-dashboard-item-top">
            <span className="hc-dashboard-icon hc-dashboard-icon-amber" aria-hidden="true">
              <FiSun />
            </span>
            <span className="hc-dashboard-kicker">{t('energy')}</span>
          </div>
          <strong>{energyValue}</strong>
        </div>

        <div className="hc-dashboard-item">
          <div className="hc-dashboard-item-top">
            <span className="hc-dashboard-icon hc-dashboard-icon-plum" aria-hidden="true">
              ✦
            </span>
            <span className="hc-dashboard-kicker">
              {t('gardenSeedsLabel', { points: seeds })}
            </span>
          </div>
          <strong>
            {t('gardenSeedsValue', { seeds })} · {t('gardenStageShort', { stage })}
          </strong>
        </div>
      </div>
    </motion.section>
  )
}

export default Dashboard
