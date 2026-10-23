import React, { useState } from 'react'
import { Button } from '@mui/material'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import SpaRoundedIcon from '@mui/icons-material/SpaRounded'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { getEntranceMotionProps } from '../lib/entrance'
import LanguageToggle from './LanguageToggle'
import { HerCycleBrandLockup } from './SplashScreen'

export const AGE_VERIFIED_STORAGE_KEY = 'hercycle.age_verified.v1'

export const hasVerifiedAge = () => {
  try {
    return window.localStorage.getItem(AGE_VERIFIED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const saveVerifiedAge = () => {
  try {
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
  } catch {
    // Ignore storage quota errors in private browsing.
  }
}

const AgeGate = ({ onVerified, isFirstVisit = false, reducedMotion = false }) => {
  const { t } = useTranslation()
  const [underAge, setUnderAge] = useState(false)

  const handleConfirm = () => {
    saveVerifiedAge()
    if (typeof onVerified === 'function') {
      onVerified()
    }
  }

  const surfaceEntrance = getEntranceMotionProps('surface', { isFirstVisit, reducedMotion })
  const brandEntrance = getEntranceMotionProps('brand', { isFirstVisit, reducedMotion })
  const contentEntrance = getEntranceMotionProps('content', { isFirstVisit, reducedMotion })
  const controlsEntrance = getEntranceMotionProps('controls', { isFirstVisit, reducedMotion })

  return (
    <motion.div
      className="hc-age-gate-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hc-age-gate-title"
      data-entrance-mode={isFirstVisit ? 'first-visit' : 'returning'}
      {...surfaceEntrance}
    >
      <motion.div className="hc-age-gate-top-lang" {...controlsEntrance}>
        <LanguageToggle />
      </motion.div>

      <section className="hc-age-gate-card hc-spotlight-card">
        <motion.div className="hc-age-gate-header" {...brandEntrance}>
          <HerCycleBrandLockup size={62} pulse showTagline />
          <span className="eyebrow-label">
            <SpaRoundedIcon sx={{ fontSize: 13, mr: 0.6 }} />
            {t('ageGateEyebrow')}
          </span>
        </motion.div>

        {!underAge ? (
          <>
            <motion.div className="hc-age-gate-body" {...contentEntrance}>
              <h1 id="hc-age-gate-title">{t('ageGateTitle')}</h1>
              <p className="hc-age-gate-copy">{t('ageGateDescription')}</p>
            </motion.div>

            <motion.div className="hc-age-gate-actions" {...controlsEntrance}>
              <Button
                type="button"
                variant="contained"
                disableElevation
                className="onboarding-cta hc-spotlight-btn"
                onClick={handleConfirm}
                data-testid="age-gate-confirm"
              >
                {t('ageGateConfirm')}
              </Button>
              <button
                type="button"
                className="hc-age-gate-secondary"
                onClick={() => setUnderAge(true)}
                data-testid="age-gate-under"
              >
                {t('ageGateUnder')}
              </button>
            </motion.div>
          </>
        ) : (
          <>
            <div className="hc-age-gate-body">
              <h1 id="hc-age-gate-title">{t('ageGateUnderTitle')}</h1>
              <p className="hc-age-gate-copy">{t('ageGateUnderBody')}</p>
            </div>
            <div className="hc-age-gate-actions">
              <button
                type="button"
                className="hc-age-gate-secondary"
                onClick={() => setUnderAge(false)}
              >
                {t('ageGateGoBack')}
              </button>
            </div>
          </>
        )}

        <p className="hc-age-gate-footnote">
          <VerifiedUserRoundedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
          <span>{t('ageGatePrivacy')}</span>
        </p>
      </section>
    </motion.div>
  )
}

export default AgeGate
