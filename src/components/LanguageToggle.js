import React from 'react'
import { motion } from 'framer-motion'
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded'
import { useTranslation } from 'react-i18next'

import { setAppLanguage } from '../i18n'

const LanguageToggle = ({ className = '', compact = false }) => {
  const { i18n } = useTranslation()
  const active = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const handleSelect = (lang) => {
    if (lang === active) return
    setAppLanguage(lang)
  }

  return (
    <div
      className={`hc-lang-pill ${compact ? 'is-compact' : ''} ${className}`.trim()}
      role="group"
      aria-label="Language selector · የቋንቋ ምርጫ"
      data-testid="language-toggle"
    >
      {!compact ? (
        <span className="hc-lang-pill-icon" aria-hidden="true">
          <TranslateRoundedIcon fontSize="inherit" />
        </span>
      ) : null}

      <button
        type="button"
        className={`hc-lang-pill-option ${active === 'en' ? 'is-active' : ''}`}
        aria-pressed={active === 'en'}
        onClick={() => handleSelect('en')}
      >
        {active === 'en' ? (
          <motion.span
            layoutId="hc-lang-active-thumb"
            className="hc-lang-pill-thumb"
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          />
        ) : null}
        <span className="hc-lang-pill-text">EN</span>
      </button>

      <button
        type="button"
        className={`hc-lang-pill-option ${active === 'am' ? 'is-active' : ''}`}
        aria-pressed={active === 'am'}
        onClick={() => handleSelect('am')}
      >
        {active === 'am' ? (
          <motion.span
            layoutId="hc-lang-active-thumb"
            className="hc-lang-pill-thumb"
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          />
        ) : null}
        <span className="hc-lang-pill-text">አማ</span>
      </button>
    </div>
  )
}

export default LanguageToggle
