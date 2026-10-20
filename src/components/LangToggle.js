import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { setLanguage } from '../i18n'

const OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
]

/** Language switch shown on every page except the splash. The thumb glides between options. */
const LangToggle = () => {
  const { t, i18n } = useTranslation()
  const current = i18n.language?.startsWith('am') ? 'am' : 'en'

  return (
    <div className="lang-pill" role="group" aria-label={t('language')}>
      {OPTIONS.map((option) => {
        const active = option.code === current
        return (
          <button
            key={option.code}
            type="button"
            lang={option.code}
            aria-pressed={active}
            onClick={() => setLanguage(option.code)}
          >
            {active && (
              <motion.span
                layoutId="lang-thumb"
                className="pill-thumb"
                transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, zIndex: 0 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default LangToggle
