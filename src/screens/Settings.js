import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiCheck, FiLogOut } from 'react-icons/fi'

import Slider from '../components/Slider'
import { getLang, setLang, LANGUAGES } from '../lib/i18n'
import { normalizeCycleLength, normalizePeriodLength } from '../lib/cycle'
import { pushSettings } from '../lib/sync'
import { KEYS, getMotionOn, getPrefs, getProfile, savePrefs, saveProfile, setMotionOn, usePrefs, useProfile, writeRaw } from '../lib/store'
import { supabase } from '../lib/supabase'

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}

const applyFont = (size) => {
  document.documentElement.setAttribute('data-font-size', size)
}

const Switch = ({ label, checked, onChange, description, id }) => (
  <div className="toggle-row">
    <div>
      <span className="toggle-label" id={`${id}-label`}>{label}</span>
      {description && <p className="card-copy">{description}</p>}
    </div>
    <button type="button" id={id} role="switch" aria-checked={checked} aria-labelledby={`${id}-label`} className={`switch${checked ? ' is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  </div>
)

const Settings = ({ session, client }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const saved = usePrefs()
  const savedProfile = useProfile()
  const [draft, setDraft] = useState(() => ({ ...getPrefs() }))
  const [profileDraft, setProfileDraft] = useState(() => ({ ...getProfile() }))
  const [motionOn, setMotionState] = useState(() => getMotionOn())
  const [lang, setLangState] = useState(() => getLang())
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const [confirmClear, setConfirmClear] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify({ ...saved }) || JSON.stringify(profileDraft) !== JSON.stringify({ ...savedProfile })

  const change = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setStatus({ state: 'idle', message: '' })
    if (key === 'theme') applyTheme(value)
    if (key === 'fontSize') applyFont(value)
  }

  const changeProfile = (key, value) => {
    setProfileDraft((current) => ({ ...current, [key]: value }))
    setStatus({ state: 'idle', message: '' })
  }

  // Motion and language act at once and are stored on this device. They are not held for Save.
  const toggleMotion = (on) => {
    setMotionOn(on)
    setMotionState(on)
  }

  const chooseLanguage = (next) => {
    setLang(next)
    setLangState(next)
  }

  const save = async () => {
    setStatus({ state: 'saving', message: '' })
    const nextPrefs = savePrefs(draft)
    const nextProfile = saveProfile({
      ...profileDraft,
      cycleLength: normalizeCycleLength(profileDraft.cycleLength),
      periodLength: normalizePeriodLength(profileDraft.periodLength),
    })
    if (!nextPrefs || !nextProfile) {
      setStatus({ state: 'error', message: t('settings.saveFailedDevice') })
      return
    }
    if (session?.user?.id && client) {
      const result = await pushSettings(client, session.user.id, { profile: nextProfile, prefs: nextPrefs, lang })
      if (!result.ok) {
        setStatus({ state: 'error', message: t('settings.saveFailedAccount', { error: result.error }) })
        return
      }
      setStatus({ state: 'saved', message: t('settings.savedAccount') })
      return
    }
    setStatus({ state: 'saved', message: t('settings.savedDevice') })
  }

  const clearDevice = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    Object.values(KEYS).filter((key) => key !== KEYS.lang).forEach((key) => {
      try { window.localStorage.removeItem(key) } catch { /* storage unavailable */ }
    })
    writeRaw(KEYS.motion, motionOn ? 'on' : 'off')
    window.sessionStorage.clear()
    window.location.assign('/onboarding')
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    navigate('/auth')
  }

  const sizes = [
    { key: 'small', label: t('settings.fontSmall'), sample: 'Aa' },
    { key: 'medium', label: t('settings.fontMedium'), sample: 'Aa' },
    { key: 'large', label: t('settings.fontLarge'), sample: 'Aa' },
  ]
  const themes = [
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
    { key: 'system', label: t('settings.themeSystem') },
  ]

  return (
    <form className="page settings-page" onSubmit={(event) => { event.preventDefault(); save() }} noValidate>
      <section className="card">
        <h2 className="card-title">{t('settings.motionHeading')}</h2>
        <Switch
          id="motion-switch"
          label={t('settings.motionLabel')}
          description={t('settings.motionCopy')}
          checked={motionOn}
          onChange={toggleMotion}
        />
        <p className="card-footnote" role="status">{t('settings.motionNote')}</p>
      </section>

      <section className="card" aria-labelledby="look-heading">
        <h2 id="look-heading" className="card-title">{t('settings.lookHeading')}</h2>
        <p className="field-label" id="font-label">{t('settings.fontSize')}</p>
        <div className="segmented segmented-three" role="radiogroup" aria-labelledby="font-label">
          {sizes.map(({ key, label, sample }) => (
            <button key={key} type="button" role="radio" aria-checked={draft.fontSize === key} className={`segment size-${key}${draft.fontSize === key ? ' is-selected' : ''} spot`} onClick={() => change('fontSize', key)}>
              <strong aria-hidden="true">{sample}</strong>
              <span>{label}</span>
              {draft.fontSize === key && <FiCheck aria-hidden="true" />}
            </button>
          ))}
        </div>
        <p className="field-label" id="theme-label">{t('settings.theme')}</p>
        <div className="segmented segmented-three" role="radiogroup" aria-labelledby="theme-label">
          {themes.map(({ key, label }) => (
            <button key={key} type="button" role="radio" aria-checked={draft.theme === key} className={`segment${draft.theme === key ? ' is-selected' : ''} spot`} onClick={() => change('theme', key)}>
              {label}
            </button>
          ))}
        </div>
        <p className="field-label" id="lang-label">{t('settings.language')}</p>
        <div className="lang-choice" role="radiogroup" aria-labelledby="lang-label">
          {LANGUAGES.map((code) => (
            <button key={code} type="button" role="radio" lang={code} aria-checked={lang === code} className={`segment${lang === code ? ' is-selected' : ''} spot`} onClick={() => chooseLanguage(code)}>
              {code === 'en' ? 'English' : 'አማርኛ'}
            </button>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="cycle-settings-heading">
        <h2 id="cycle-settings-heading" className="card-title">{t('settings.cycleHeading')}</h2>
        <label className="field" htmlFor="settings-last-period">
          <span className="field-label">{t('settings.lastPeriod')}</span>
          <input id="settings-last-period" type="date" max={new Date().toISOString().slice(0, 10)} value={profileDraft.lastPeriodStart || ''} onChange={(event) => changeProfile('lastPeriodStart', event.target.value || null)} />
        </label>
        <Slider id="settings-cycle-length" label={t('settings.cycleLength')} min={21} max={40} value={normalizeCycleLength(profileDraft.cycleLength)} tone="sage" format={(value) => t('checkIn.days', { count: value })} onChange={(value) => changeProfile('cycleLength', value)} />
        <Slider id="settings-period-length" label={t('settings.periodLength')} min={2} max={10} value={normalizePeriodLength(profileDraft.periodLength)} tone="rose" format={(value) => t('checkIn.days', { count: value })} onChange={(value) => changeProfile('periodLength', value)} />
      </section>

      <section className="card" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="card-title">{t('settings.privacyHeading')}</h2>
        <Switch id="hide-intimacy" label={t('settings.hideIntimacy')} description={t('settings.hideIntimacyCopy')} checked={draft.hideIntimacy} onChange={(value) => change('hideIntimacy', value)} />
        <div className="danger-zone">
          <p className="card-copy">{t('settings.clearCopy')}</p>
          <button type="button" className="ghost-button danger spot" onClick={clearDevice}>
            {confirmClear ? t('settings.clearConfirm') : t('settings.clearDevice')}
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="rewards-heading">
        <h2 id="rewards-heading" className="card-title">{t('settings.rewardsHeading')}</h2>
        <Switch id="gamification" label={t('settings.gamification')} description={t('settings.gamificationCopy')} checked={draft.gamification} onChange={(value) => change('gamification', value)} />
        <Switch id="show-rewards" label={t('settings.showRewards')} description={t('settings.showRewardsCopy')} checked={draft.showRewards} onChange={(value) => change('showRewards', value)} />
        <Switch id="celebrate" label={t('settings.celebrate')} description={t('settings.celebrateCopy')} checked={draft.celebrate} onChange={(value) => change('celebrate', value)} />
        <Switch id="notifications" label={t('settings.notifications')} description={t('settings.notificationsCopy')} checked={draft.notifications} onChange={(value) => change('notifications', value)} />
      </section>

      <section className="save-card card" aria-live="polite">
        <button type="submit" className="primary-button spot" disabled={status.state === 'saving' || !dirty}>
          {status.state === 'saving' ? t('settings.saving') : dirty ? t('settings.savePreferences') : t('settings.allSaved')}
        </button>
        {status.state === 'saved' && <p className="save-state is-saved" role="status">{status.message}</p>}
        {status.state === 'error' && <p className="save-state is-error" role="alert">{status.message}</p>}
        {!session && <p className="card-footnote">{t('settings.guestNote')}</p>}
      </section>

      {session && (
        <button type="button" className="settings-signout" onClick={signOut}>
          <FiLogOut aria-hidden="true" /> {t('signOut')}
        </button>
      )}
    </form>
  )
}

export default Settings
