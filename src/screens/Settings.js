import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import {
  FiCheck,
  FiDownload,
  FiLogOut,
  FiMoon,
  FiSun,
  FiTrash2,
  FiType,
} from 'react-icons/fi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageToggle from '../components/LanguageToggle'
import { signOutLocalAccount } from '../lib/account'
import {
  clearLocalDeviceEntries,
  exportUserDataSnapshot,
  loadPreferences,
  savePreferences as persistPreferences,
} from '../lib/care'
import { supabase } from '../lib/supabase'

const ACCENT_PALETTES = [
  { key: 'rosewood', labelKey: 'accentRosewood', swatch: '#8f526f' },
  { key: 'addis', labelKey: 'accentAddis', swatch: '#b8833c' },
  { key: 'plum', labelKey: 'accentPlum', swatch: '#6d4578' },
  { key: 'linen', labelKey: 'accentLinen', swatch: '#6f7e6d' },
]

const Settings = ({ session }) => {
  const { t, i18n } = useTranslation()
  const isAmharic = (i18n.resolvedLanguage || i18n.language || 'en')
    .toLowerCase()
    .startsWith('am')
  const navigate = useNavigate()
  const userId = session?.user?.id || null

  const [preferences, setPreferences] = useState(() => loadPreferences())
  const [saveState, setSaveState] = useState('idle')
  const [dataNotice, setDataNotice] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !supabase) return undefined
    let isMounted = true

    supabase
      .from('user_settings')
      .select('theme_preference, font_size, hide_intimacy')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError || !isMounted || !data) return
        setPreferences((prev) => ({
          ...prev,
          theme: data.theme_preference || prev.theme,
          fontSize: data.font_size || prev.fontSize,
          hideIntimacy: data.hide_intimacy ?? prev.hideIntimacy,
        }))
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [userId])

  // Apply and persist immediately on every toggle/choice so Settings never drops changes if navigating away.
  const updatePreference = async (key, value) => {
    setError('')
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    setSaveState('saved')
    try {
      await persistPreferences(userId, next)
    } catch (saveError) {
      setError(saveError.message || t('errorGeneric'))
      setSaveState('idle')
    }
  }

  const saveAllPreferences = async () => {
    setError('')
    setSaveState('saving')
    try {
      await persistPreferences(userId, preferences)
      setSaveState('saved')
    } catch (saveError) {
      setError(saveError.message || t('errorGeneric'))
      setSaveState('idle')
    }
  }

  const handleExport = () => {
    const payload = exportUserDataSnapshot(userId)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hercycle-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setDataNotice(t('exportDataDone'))
  }

  const handleClearDeviceData = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearLocalDeviceEntries(userId)
    setConfirmClear(false)
    setDataNotice(t('clearLocalDone'))
  }

  const signOut = async () => {
    signOutLocalAccount()
    if (supabase) {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        setError(signOutError.message || t('errorGeneric'))
        return
      }
    }
    navigate('/signin')
  }

  return (
    <div className="settings-page">
      <section className="settings-intro">
        <span className="eyebrow-label">{t('settingsIntroEyebrow')}</span>
        <h2>{t('settingsIntroTitle')}</h2>
        <p>{t('settingsIntroSub')}</p>
      </section>

      {/* Language Section */}
      <section className="settings-card hc-spotlight-card">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <TranslateRoundedIcon sx={{ fontSize: 18 }} />
          </span>
          <div>
            <h3>{t('languageSectionTitle')}</h3>
            <p>{t('languageSectionSub')}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <LanguageToggle />
          </div>
        </div>
      </section>

      {/* Appearance + Sanctuary Accent Palette */}
      <section className="settings-card hc-spotlight-card">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <FiSun aria-hidden="true" />
          </span>
          <div>
            <h3>{t('appearance')}</h3>
            <p>{t('appearanceSub')}</p>
          </div>
        </div>

        <div className="settings-option-grid" role="radiogroup" aria-label={t('appearance')}>
          {[
            { key: 'light', label: t('lightMode'), icon: FiSun },
            { key: 'dark', label: t('darkMode'), icon: FiMoon },
            { key: 'system', label: t('systemMode'), icon: FiType },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={preferences.theme === key}
              className={`settings-choice hc-spotlight-btn${
                preferences.theme === key ? ' is-selected' : ''
              }`}
              onClick={() => updatePreference('theme', key)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {preferences.theme === key && (
                <FiCheck className="settings-choice-check" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <div className="hc-accent-palette-block">
          <span className="eyebrow-label">{t('accentPaletteLabel')}</span>
          <div className="hc-accent-palette-grid" role="radiogroup" aria-label={t('accentPaletteLabel')}>
            {ACCENT_PALETTES.map((pal) => (
              <button
                key={pal.key}
                type="button"
                role="radio"
                aria-checked={preferences.accentPalette === pal.key}
                className={`settings-choice hc-spotlight-btn${
                  preferences.accentPalette === pal.key ? ' is-selected' : ''
                }`}
                onClick={() => updatePreference('accentPalette', pal.key)}
              >
                <span
                  className="hc-palette-swatch"
                  style={{ background: pal.swatch }}
                  aria-hidden="true"
                />
                <span>{t(pal.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Font Size */}
      <section className="settings-card hc-spotlight-card">
        <div className="settings-section-heading">
          <span className="settings-section-icon settings-section-icon-lilac">
            <FiType aria-hidden="true" />
          </span>
          <div>
            <h3>{t('fontSize')}</h3>
            <p>{t('fontSizeSub')}</p>
          </div>
        </div>
        <div
          className="settings-option-grid settings-option-grid-three"
          role="radiogroup"
          aria-label={t('fontSize')}
        >
          {[
            { key: 'small', label: t('smallText'), sample: isAmharic ? 'ሀለ' : 'Aa' },
            { key: 'medium', label: t('mediumText'), sample: isAmharic ? 'ሀለ' : 'Aa' },
            { key: 'large', label: t('largeText'), sample: isAmharic ? 'ሀለ' : 'Aa' },
          ].map(({ key, label, sample }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={preferences.fontSize === key}
              className={`settings-choice settings-text-choice settings-text-${key} hc-spotlight-btn${
                preferences.fontSize === key ? ' is-selected' : ''
              }`}
              onClick={() => updatePreference('fontSize', key)}
            >
              <strong>{sample}</strong>
              <span>{label}</span>
              {preferences.fontSize === key && (
                <FiCheck className="settings-choice-check" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Motion Control (User-controlled, NEVER overridden silently by OS!) */}
      <motion.section
        className="settings-card settings-privacy-card hc-spotlight-card"
        whileHover={{ y: -2 }}
      >
        <div className="settings-toggle-copy">
          <span className="settings-section-icon settings-section-icon-lilac">
            <SpeedRoundedIcon sx={{ fontSize: 18 }} />
          </span>
          <div>
            <h3>{t('motionSectionTitle')}</h3>
            <p>{t('motionReduceTitle')}</p>
            <small>{t('motionReduceSub')}</small>
          </div>
        </div>
        <button
          type="button"
          className={`settings-switch${preferences.reduceMotion ? ' is-on' : ''}`}
          role="switch"
          aria-checked={Boolean(preferences.reduceMotion)}
          aria-label={t('motionReduceTitle')}
          onClick={() => updatePreference('reduceMotion', !preferences.reduceMotion)}
          data-testid="reduce-motion-switch"
        >
          <span />
        </button>
      </motion.section>

      {/* Your Journey & Celebrations Controls */}
      <section className="settings-card hc-spotlight-card">
        <div className="settings-section-heading">
          <span className="settings-section-icon settings-section-icon-rose">
            <LocalFloristRoundedIcon sx={{ fontSize: 18 }} />
          </span>
          <div>
            <h3>{t('journeyControlsTitle')}</h3>
            <p>{t('journeyEnableSub')}</p>
          </div>
        </div>

        <div className="hc-settings-switch-stack">
          <div className="hc-settings-switch-row">
            <div>
              <strong>{t('journeyEnableLabel')}</strong>
              <small>{t('journeyEnableSub')}</small>
            </div>
            <button
              type="button"
              className={`settings-switch${preferences.journeyEnabled !== false ? ' is-on' : ''}`}
              role="switch"
              aria-checked={preferences.journeyEnabled !== false}
              aria-label={t('journeyEnableLabel')}
              onClick={() =>
                updatePreference('journeyEnabled', preferences.journeyEnabled === false)
              }
              data-testid="journey-enable-switch"
            >
              <span />
            </button>
          </div>

          <div className="hc-settings-switch-row">
            <div>
              <strong>{t('journeyRewardsLabel')}</strong>
              <small>{t('journeyRewardsSub')}</small>
            </div>
            <button
              type="button"
              className={`settings-switch${preferences.journeyRewards !== false ? ' is-on' : ''}`}
              role="switch"
              aria-checked={preferences.journeyRewards !== false}
              aria-label={t('journeyRewardsLabel')}
              onClick={() =>
                updatePreference('journeyRewards', preferences.journeyRewards === false)
              }
            >
              <span />
            </button>
          </div>

          <div className="hc-settings-switch-row">
            <div>
              <strong>{t('gentleRemindersToggleLabel')}</strong>
              <small>{t('gentleRemindersToggleSub')}</small>
            </div>
            <button
              type="button"
              className={`settings-switch${preferences.remindersEnabled !== false ? ' is-on' : ''}`}
              role="switch"
              aria-checked={preferences.remindersEnabled !== false}
              aria-label={t('gentleRemindersToggleLabel')}
              onClick={() =>
                updatePreference('remindersEnabled', preferences.remindersEnabled === false)
              }
            >
              <span />
            </button>
          </div>
        </div>

        <div className="hc-accent-palette-block">
          <span className="eyebrow-label">
            <AutoAwesomeRoundedIcon sx={{ fontSize: 13, mr: 0.5 }} />
            {t('rhythmPreferenceTitle')}
          </span>
          <div className="settings-option-grid settings-option-grid-three">
            {[
              { key: 'flexible', label: t('rhythmFlexible') },
              { key: 'few_times', label: t('rhythmFewTimes') },
              { key: 'weekly', label: t('rhythmWeekly') },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`settings-choice hc-spotlight-btn${
                  (preferences.checkinCadence || 'flexible') === item.key ? ' is-selected' : ''
                }`}
                onClick={() => updatePreference('checkinCadence', item.key)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Data Portability */}
      <motion.section
        className="settings-card hc-spotlight-card"
        whileHover={{ y: -2 }}
      >
        <div className="hc-settings-switch-row">
          <div className="settings-toggle-copy">
            <span className="settings-section-icon settings-section-icon-rose">♡</span>
            <div>
              <h3>{t('privacy')}</h3>
              <p>{t('hideIntimacySection')}</p>
              <small>{t('hideIntimacySub')}</small>
            </div>
          </div>
          <button
            type="button"
            className={`settings-switch${preferences.hideIntimacy ? ' is-on' : ''}`}
            role="switch"
            aria-checked={Boolean(preferences.hideIntimacy)}
            aria-label={t('hideIntimacySection')}
            onClick={() => updatePreference('hideIntimacy', !preferences.hideIntimacy)}
          >
            <span />
          </button>
        </div>

        <div className="hc-ritual-actions" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="partner-copy-button hc-spotlight-btn"
            onClick={handleExport}
          >
            <FiDownload aria-hidden="true" />
            <span>{t('exportDataButton')}</span>
          </button>

          <button
            type="button"
            className="partner-copy-button hc-spotlight-btn"
            onClick={handleClearDeviceData}
          >
            <FiTrash2 aria-hidden="true" />
            <span>{confirmClear ? t('clearLocalConfirm') : t('clearLocalButton')}</span>
          </button>
        </div>
      </motion.section>

      <section className="settings-about-card hc-spotlight-card">
        <div>
          <span className="eyebrow-label">{t('madeWithCare')}</span>
          <h3>{t('about')}</h3>
          <p>{t('appVersion', { version: '2.0.0' })}</p>
        </div>
        <span className="settings-about-flower" aria-hidden="true">
          ✿
        </span>
      </section>

      <p className="settings-local-note">{t('settingsLocalNote')}</p>
      {dataNotice && <Alert severity="success">{dataNotice}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <div className="hc-page-bottom-cta">
        <Button
          variant="contained"
          onClick={saveAllPreferences}
          disabled={saveState === 'saving'}
          className="form-submit-button settings-save-button hc-spotlight-btn"
        >
          {saveState === 'saving'
            ? t('saving')
            : saveState === 'saved'
            ? t('preferencesSaved')
            : t('saveChanges')}
        </Button>

        {session && (
          <button type="button" className="settings-signout-button" onClick={signOut}>
            <FiLogOut aria-hidden="true" /> {t('signOutDevice')}
          </button>
        )}
      </div>
    </div>
  )
}

export default Settings
