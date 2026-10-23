import React from 'react'
import { motion } from 'framer-motion'
import { GiLotus } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'

export const SPLASH_DURATION_MS = 0

/**
 * Refined HerCycle Botanical Medallion — double hairline champagne-rose bezel,
 * warm porcelain inner disc, dual concentric breathing radial glow layers
 * visible across ALL viewport sizes, and optically centered GiLotus mark.
 */
export function HerCycleLogoMark({ size = 56, pulse = true, className = '' }) {
  const iconPx = Math.max(15, Math.round(size * 0.52))

  return (
    <span
      className={`hc-real-logo-mark${pulse ? ' is-pulsing' : ''} ${className}`.trim()}
      data-testid="hercycle-real-logo"
      style={{ '--logo-box': `${size}px`, '--logo-icon': `${iconPx}px` }}
      aria-hidden="true"
    >
      <span className="hc-real-logo-aura" />
      <span className="hc-real-logo-pulse-ring" />
      <span className="hc-real-logo-disc">
        <GiLotus className="hc-real-logo-lotus" />
      </span>
    </span>
  )
}

/**
 * Editorial Brand Lockup pairing the refined porcelain lotus medallion with
 * responsive Fraunces typography (logo + radial glow remain visible across all
 * screen sizes while text labels step down cleanly on narrow screens).
 */
export function HerCycleBrandLockup({ size = 58, pulse = true, showTagline = true }) {
  const { t } = useTranslation()

  return (
    <span className="hc-brand-lockup">
      <HerCycleLogoMark size={size} pulse={pulse} />
      <span className="hc-brand-lockup-copy app-brand-copy">
        <strong className="hc-brand-lockup-title">{t('hercycle')}</strong>
        {showTagline && <small className="hc-brand-lockup-sub">{t('brandTagline')}</small>}
      </span>
    </span>
  )
}

/**
 * Precision Architectural Privacy Crest Shield — locked 1:1 round double-bezel seal with
 * emerald-sage & warm champagne rim, crisp vector shield crest, and checkmark assurance core.
 */
export function PrivacyShieldEmblem({ compact = false }) {
  return (
    <span
      className={`hc-shield-medallion${compact ? ' is-compact' : ''}`}
      data-testid="privacy-shield-crest"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        width={compact ? 24 : 30}
        height={compact ? 24 : 30}
        fill="none"
        className="hc-shield-crest-svg"
      >
        <defs>
          <linearGradient id="hc-crest-fill" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5C8A67" />
            <stop offset="50%" stopColor="#416D4D" />
            <stop offset="100%" stopColor="#2F543A" />
          </linearGradient>
          <linearGradient id="hc-crest-rim" x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5DFB5" />
            <stop offset="50%" stopColor="#D7B47A" />
            <stop offset="100%" stopColor="#9D8355" />
          </linearGradient>
        </defs>
        <path
          d="M24 5.5 L38.5 11.2 V22.6 C38.5 32.1 32.2 39.6 24 43 C15.8 39.6 9.5 32.1 9.5 22.6 V11.2 L24 5.5 Z"
          fill="url(#hc-crest-fill)"
          stroke="url(#hc-crest-rim)"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path
          d="M24 9.2 L35 13.5 V22.3 C35 29.8 30.1 35.8 24 38.7 C17.9 35.8 13 29.8 13 22.3 V13.5 L24 9.2 Z"
          stroke="#FFFFFF"
          strokeOpacity="0.32"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M18.2 24.1 L22.1 28 L30.2 19.6"
          stroke="#FFFDF7"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/**
 * Legacy-compatible non-blocking brand header mark if directly rendered in isolated tests.
 */
export default function SplashScreen({ visible = false }) {
  if (!visible) return null
  return (
    <motion.div
      className="hc-inline-brand-reveal"
      data-testid="hercycle-splash"
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <HerCycleBrandLockup size={60} pulse />
    </motion.div>
  )
}
