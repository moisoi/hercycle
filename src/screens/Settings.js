import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiCheck, FiLogOut, FiMoon, FiSun, FiType } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'hercycle.preferences'
const defaults = { theme: 'light', fontSize: 'medium', hideIntimacy: false }

const readSavedPreferences = () => {
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return defaults
  }
}

const Settings = ({ session }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(readSavedPreferences)
  const [saveState, setSaveState] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.user?.id) return undefined
    let isMounted = true

    const loadPreferences = async () => {
      const { data, error: queryError } = await supabase
        .from('user_settings')
        .select('theme_preference, font_size, hide_intimacy')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (queryError || !isMounted || !data) return

      const next = {
        theme: data.theme_preference || defaults.theme,
        fontSize: data.font_size || defaults.fontSize,
        hideIntimacy: data.hide_intimacy ?? defaults.hideIntimacy,
      }
      setPreferences(next)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }

    loadPreferences().catch((queryError) => console.error('Unable to load preferences:', queryError))
    return () => { isMounted = false }
  }, [session?.user?.id])

  useEffect(() => {
    const root = document.documentElement
    if (preferences.theme === 'system') root.setAttribute('data-theme', 'system')
    else if (preferences.theme === 'dark') root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')

    root.setAttribute('data-font-size', preferences.fontSize)
    window.dispatchEvent(new CustomEvent('hercycle:preferences-changed', { detail: preferences }))
  }, [preferences])

  const updatePreference = (key, value) => {
    setSaveState('idle')
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  const savePreferences = async () => {
    setError('')
    setSaveState('saving')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    window.dispatchEvent(new CustomEvent('hercycle:preferences-changed', { detail: preferences }))

    if (session?.user?.id) {
      try {
        const { error: saveError } = await supabase.from('user_settings').upsert({
          user_id: session.user.id,
          theme_preference: preferences.theme,
          font_size: preferences.fontSize,
          hide_intimacy: preferences.hideIntimacy,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        if (saveError) throw saveError
      } catch (saveError) {
        console.error('Unable to save preferences:', saveError)
        setError(saveError.message || t('errorGeneric'))
        setSaveState('idle')
        return
      }
    }

    setSaveState('saved')
  }

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message || t('errorGeneric'))
      return
    }
    navigate('/auth')
  }

  return (
    <div className="settings-page">
      <section className="settings-intro">
        <span className="eyebrow-label">MAKE THIS SPACE YOURS</span>
        <h2>Small comforts, your way.</h2>
        <p>Choose what feels easier to see and use. Your preferences are private.</p>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading"><span className="settings-section-icon"><FiSun aria-hidden="true" /></span><div><h3>{t('appearance')}</h3><p>Set the mood for your space.</p></div></div>
        <div className="settings-option-grid" role="radiogroup" aria-label={t('appearance')}>
          {[
            { key: 'light', label: t('lightMode'), icon: FiSun },
            { key: 'dark', label: t('darkMode'), icon: FiMoon },
            { key: 'system', label: 'System', icon: FiType },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" role="radio" aria-checked={preferences.theme === key} className={`settings-choice${preferences.theme === key ? ' is-selected' : ''}`} onClick={() => updatePreference('theme', key)}>
              <Icon aria-hidden="true" /><span>{label}</span>{preferences.theme === key && <FiCheck className="settings-choice-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading"><span className="settings-section-icon settings-section-icon-lilac"><FiType aria-hidden="true" /></span><div><h3>{t('fontSize')}</h3><p>Comfortable reading is part of good care.</p></div></div>
        <div className="settings-option-grid settings-option-grid-three" role="radiogroup" aria-label={t('fontSize')}>
          {[
            { key: 'small', label: t('smallText'), sample: 'Aa' },
            { key: 'medium', label: t('mediumText'), sample: 'Aa' },
            { key: 'large', label: t('largeText'), sample: 'Aa' },
          ].map(({ key, label, sample }) => (
            <button key={key} type="button" role="radio" aria-checked={preferences.fontSize === key} className={`settings-choice settings-text-choice settings-text-${key}${preferences.fontSize === key ? ' is-selected' : ''}`} onClick={() => updatePreference('fontSize', key)}>
              <strong>{sample}</strong><span>{label}</span>{preferences.fontSize === key && <FiCheck className="settings-choice-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <motion.section className="settings-card settings-privacy-card" whileHover={{ y: -2 }}>
        <div className="settings-toggle-copy"><span className="settings-section-icon settings-section-icon-rose">♡</span><div><h3>{t('privacy')}</h3><p>{t('hideIntimacySection')}</p><small>Your private reflections stay saved; this only hides the Intimacy tab.</small></div></div>
        <button type="button" className={`settings-switch${preferences.hideIntimacy ? ' is-on' : ''}`} role="switch" aria-checked={preferences.hideIntimacy} aria-label={t('hideIntimacySection')} onClick={() => updatePreference('hideIntimacy', !preferences.hideIntimacy)}><span /></button>
      </motion.section>

      <section className="settings-about-card">
        <div><span className="eyebrow-label">MADE WITH CARE</span><h3>{t('about')}</h3><p>{t('appVersion', { version: '1.1.0' })}</p></div>
        <span className="settings-about-flower" aria-hidden="true">✿</span>
      </section>

      {!session && <p className="settings-local-note">You are using a private local space. Sign in to sync these preferences between devices.</p>}
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" onClick={savePreferences} disabled={saveState === 'saving'} className="form-submit-button settings-save-button">
        {saveState === 'saving' ? 'Saving preferences…' : saveState === 'saved' ? t('preferencesSaved') : t('saveChanges')}
      </Button>
      {session && (
        <button type="button" className="settings-signout-button" onClick={signOut}>
          <FiLogOut aria-hidden="true" /> Sign out of this device
        </button>
      )}
    </div>
  )
}

export default Settings
