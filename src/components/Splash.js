import React from 'react'
import { useTranslation } from 'react-i18next'

import Logo from './Logo'

// Splash shows on first load and on every page change. It never shows a blank screen.
const Splash = ({ overlay = false }) => {
  const { t } = useTranslation()
  return (
    <div className={`splash${overlay ? ' splash-overlay' : ''}`} role={overlay ? undefined : 'status'} aria-hidden={overlay ? 'true' : undefined}>
      <div className="splash-logo spot glow-radial">
        <Logo size={88} />
      </div>
      <p className="splash-name">hercycle</p>
      {!overlay && <span className="sr-only">{t('loading')}</span>}
    </div>
  )
}

export default Splash
