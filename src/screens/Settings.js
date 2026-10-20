import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LuDownload, LuTrash2, LuShieldCheck, LuBellRing } from 'react-icons/lu'

import AuthPanel from '../components/AuthPanel'
import { SaveButton, Slider, Switch } from '../components/Controls'
import { celebrate } from '../lib/celebrate'
import { normalizeCycleLength, normalizePeriodLength, toDateKey } from '../lib/cycle'
import { DEFAULT_PREFS, getProfile, savePrefs, saveProfile, setMotion } from '../lib/repo'
import { KEYS, writeRaw, readRaw, useRaw, useStoredJson } from '../lib/store'
import { useSession } from '../lib/session'
import { pushProfile } from '../lib/sync'

const EMPTY = Object.freeze({})
const SIZES = ['small', 'medium', 'large']
const TONES = ['playful', 'balanced', 'serious']

const exportData = () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    note: 'Your HerCycle data. Keep this file private.',
    profile: JSON.parse(readRaw(KEYS.profile) || 'null'),
    checkins: JSON.parse(readRaw(KEYS.checkins) || '{}'),
    intimacy: JSON.parse(readRaw(KEYS.intimacy) || '{}'),
    journey: JSON.parse(readRaw(KEYS.journey) || 'null'),
    preferences: JSON.parse(readRaw(KEYS.prefs) || 'null'),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hercycle-export-${toDateKey(new Date())}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Settings. Every control is wired: toggles apply at once, and cycle details are saved with the button. */
const Settings = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, sync } = useSession()
  const stored = useStoredJson(KEYS.profile, EMPTY)
  const profile = { ...getProfile(), ...stored }
  const prefs = { ...DEFAULT_PREFS, ...useStoredJson(KEYS.prefs, EMPTY) }
  const motionOn = useRaw(KEYS.motion) !== 'off'
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [lastPeriodStart, setLastPeriodStart] = useState(profile.lastPeriodStart || '')
  const [cycleLength, setCycleLength] = useState(normalizeCycleLength(profile.cycleLength))
  const [periodLength, setPeriodLength] = useState(normalizePeriodLength(profile.periodLength))
  const [tone, setTone] = useState(profile.tone || 'balanced')
  const [fontSize, setFontSize] = useState(profile.fontSize || 'medium')

  const today = toDateKey(new Date())
  const dateInvalid = lastPeriodStart > today

  const savePreferences = async () => {
    if (dateInvalid) throw new Error(t('settings.dateFuture'))
    const next = saveProfile({
      lastPeriodStart: lastPeriodStart || null,
      cycleLength,
      periodLength,
      tone,
      fontSize,
    })
    if (session?.user?.id) {
      try {
        await pushProfile(session.user.id, next)
      } catch (failure) {
        throw new Error(t('settings.syncFailed', { message: failure.message }))
      }
    }
    celebrate('burst', { x: window.innerWidth / 2, y: window.innerHeight / 3, pattern: 'sparkle', count: 14 })
  }

  const setMotionSwitch = (on) => {
    setMotion(on)
    // Confirm the change when the user turns motion back on.
    if (on) celebrate('burst', { x: window.innerWidth / 2, y: window.innerHeight / 3, pattern: 'sparkle', count: 14 })
  }

  const deleteEverything = () => {
    ;[KEYS.profile, KEYS.checkins, KEYS.intimacy, KEYS.journey, KEYS.prefs].forEach((key) => writeRaw(key, null))
    navigate('/onboarding', { replace: true })
  }

  const syncNote =
    sync.status === 'syncing'
      ? t('settings.syncing')
      : sync.status === 'done'
        ? t('settings.syncDone', { imported: (sync.importedCheckins || 0) + (sync.importedIntimacy || 0) })
        : sync.status === 'error'
          ? t('settings.syncFailed', { message: sync.message })
          : ''

  return (
    <div className="section-gap">
      <header>
        <p className="card-kicker">{t('settings.kicker')}</p>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.9rem, 5vw, 2.5rem)', marginTop: 6 }}>{t('settings.title')}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{t('settings.intro')}</p>
      </header>

      <section className="card stack" aria-labelledby="account-title">
        <h2 id="account-title" style={{ fontSize: '1.2rem' }}>{t('settings.accountTitle')}</h2>
        <AuthPanel session={session} />
        {syncNote && (
          <div className={`notice ${sync.status === 'error' ? 'warn' : 'info'}`} role="status">
            {syncNote}
          </div>
        )}
        {!session?.user && <p className="muted" style={{ fontSize: '0.9rem' }}>{t('settings.guestNote')}</p>}
      </section>

      <section className="card stack" aria-labelledby="cycle-title">
        <h2 id="cycle-title" style={{ fontSize: '1.2rem' }}>{t('settings.cycleTitle')}</h2>
        <label className="field">
          <span>{t('onboarding.lastPeriod')}</span>
          <input className="input" type="date" max={today} value={lastPeriodStart} onChange={(event) => setLastPeriodStart(event.target.value)} aria-invalid={dateInvalid} />
          <small className={dateInvalid ? 'field-error' : ''}>{dateInvalid ? t('settings.dateFuture') : t('settings.dateHelp')}</small>
        </label>
        <Slider id="set-cycle" label={t('onboarding.cycleLength')} value={cycleLength} min={21} max={40} unit={t('units.days')} onChange={setCycleLength} tint="var(--berry)" lowLabel="21" highLabel="40" pattern="sparkle" />
        <Slider id="set-period" label={t('onboarding.periodLength')} value={periodLength} min={2} max={10} unit={t('units.days')} onChange={setPeriodLength} tint="#c15b70" lowLabel="2" highLabel="10" pattern="drop" />

        <div className="stack" style={{ gap: 8 }}>
          <span className="field-label" style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{t('settings.toneLabel')}</span>
          <div className="seg" role="group" aria-label={t('settings.toneLabel')}>
            {TONES.map((item) => (
              <button key={item} type="button" aria-pressed={tone === item} onClick={() => setTone(item)}>{t(`tones.${item}.title`)}</button>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <span className="field-label" style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{t('settings.fontLabel')}</span>
          <div className="seg" role="group" aria-label={t('settings.fontLabel')}>
            {SIZES.map((item) => (
              <button key={item} type="button" aria-pressed={fontSize === item} onClick={() => setFontSize(item)}>{t(`settings.font.${item}`)}</button>
            ))}
          </div>
        </div>

        <SaveButton
          onSave={savePreferences}
          idleLabel={t('settings.savePreferences')}
          savingLabel={t('settings.saving')}
          savedLabel={t('settings.saved')}
          savedText={session?.user ? t('settings.savedAccount') : t('settings.savedDevice')}
          statusText={session?.user ? '' : t('settings.deviceHint')}
          disabled={dateInvalid}
        />
      </section>

      <section className="card stack" aria-labelledby="experience-title">
        <h2 id="experience-title" style={{ fontSize: '1.2rem' }}>{t('settings.experienceTitle')}</h2>
        <Switch id="motion" checked={motionOn} onChange={setMotionSwitch} label={t('settings.motion')} hint={t('settings.motionHint')} />
        <Switch id="reminders" checked={prefs.reminders} onChange={(value) => savePrefs({ reminders: value })} label={t('settings.reminders')} hint={t('settings.remindersHint')} />
        <div className="notice info" role="note" style={{ alignItems: 'center' }}>
          <LuBellRing aria-hidden="true" style={{ flex: 'none' }} />
          <span>{t('settings.notificationsNote')}</span>
        </div>
      </section>

      <section className="card stack" aria-labelledby="journey-settings-title">
        <h2 id="journey-settings-title" style={{ fontSize: '1.2rem' }}>{t('settings.journeyTitle')}</h2>
        <Switch id="gamification" checked={prefs.gamification} onChange={(value) => savePrefs({ gamification: value })} label={t('settings.gamification')} hint={t('settings.gamificationHint')} />
        <Switch id="show-rewards" checked={prefs.showRewards} onChange={(value) => savePrefs({ showRewards: value })} label={t('settings.showRewards')} hint={t('settings.showRewardsHint')} />
        <Switch id="celebrate" checked={prefs.celebrate} onChange={(value) => savePrefs({ celebrate: value })} label={t('settings.celebrate')} hint={t('settings.celebrateHint')} />
      </section>

      <section className="card stack" aria-labelledby="privacy-title">
        <h2 id="privacy-title" style={{ fontSize: '1.2rem' }}>
          <LuShieldCheck aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 8 }} />
          {t('settings.privacyTitle')}
        </h2>
        <Switch id="hide-intimacy" checked={prefs.hideIntimacy} onChange={(value) => savePrefs({ hideIntimacy: value })} label={t('settings.hideIntimacy')} hint={t('settings.hideIntimacyHint')} />
        <div className="row">
          <button type="button" className="btn ghost" onClick={exportData}>
            <LuDownload aria-hidden="true" /> {t('settings.export')}
          </button>
          {!confirmDelete ? (
            <button type="button" className="btn ghost" onClick={() => setConfirmDelete(true)}>
              <LuTrash2 aria-hidden="true" /> {t('settings.delete')}
            </button>
          ) : (
            <>
              <button type="button" className="btn danger" onClick={deleteEverything}>{t('settings.deleteConfirm')}</button>
              <button type="button" className="btn quiet" onClick={() => setConfirmDelete(false)}>{t('settings.cancel')}</button>
            </>
          )}
        </div>
        <p className="muted" style={{ fontSize: '0.88rem' }}>{t('settings.privacyBody')}</p>
      </section>

      <p className="muted center" style={{ fontSize: '0.84rem' }}>{t('settings.version')}</p>
    </div>
  )
}

export default Settings
