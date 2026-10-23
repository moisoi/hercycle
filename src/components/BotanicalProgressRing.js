import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const BotanicalProgressRing = ({
  stage = 1,
  progressPercent = 18,
  percent,
  seeds = 0,
  size = 92,
  label = '',
}) => {
  const { t } = useTranslation()
  const effectivePercent =
    typeof percent === 'number' ? percent : typeof progressPercent === 'number' ? progressPercent : 18
  const strokeWidth = size < 84 ? 7.5 : 9
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(8, Math.min(100, effectivePercent))
  const dashOffset = circumference - (clamped / 100) * circumference
  const compactRing = size < 86

  return (
    <div
      className={`hc-progress-ring${compactRing ? ' is-compact' : ''}`}
      style={{ width: size, height: size }}
      aria-label={`${t('gardenStageLabel', { stage })} · ${effectivePercent}%`}
      data-testid="botanical-progress-ring"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="hc-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--journey-ring-start, #d87a98)" />
            <stop offset="52%" stopColor="#c45c82" />
            <stop offset="100%" stopColor="var(--journey-ring-end, #7c9e78)" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 5}
          fill="var(--journey-ring-center, rgba(255, 250, 252, 0.72))"
          stroke="rgba(181, 96, 127, 0.10)"
          strokeWidth="1"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--journey-ring-track, rgba(181, 96, 127, 0.15))"
          strokeWidth={strokeWidth}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#hc-ring-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="hc-progress-ring-center">
        <span className="hc-progress-ring-stage">{stage}/5</span>
        <small className="hc-progress-ring-seeds">{seeds} ✦</small>
        {!compactRing && label ? <em className="hc-progress-ring-label">{label}</em> : null}
      </div>
    </div>
  )
}

export default BotanicalProgressRing
