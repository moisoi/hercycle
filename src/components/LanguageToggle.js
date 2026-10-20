import React from 'react'
import { useTranslation } from 'react-i18next'

import { setLang } from '../lib/i18n'

// Pill toggle for English and Amharic. Shown on every page except the splash screen.
const LanguageToggle = () => {
  const { t, i18n } = useTranslation()
  const current = i18n.language?.startsWith('am') ? 'am' : 'en'

  return (
    <div className="lang-pill" role="group" aria-label={t('language')}>
      {[
        { code: 'en', label: 'English' },
        { code: 'am', label: 'አማርኛ' },
      ].map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`lang-pill-option${current === code ? ' is-active' : ''}`}
          aria-pressed={current === code}
          lang={code}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default LanguageToggle
