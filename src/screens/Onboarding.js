import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiArrowRight, FiCheck, FiShield } from 'react-icons/fi'

import LanguageToggle from '../components/LanguageToggle'
import Logo from '../components/Logo'
import Slider from '../components/Slider'
import { normalizeCycleLength, normalizePeriodLength, toDateKey } from '../lib/cycle'
import { pushSettings } from '../lib/sync'
import { KEYS, getPrefs, getProfile, saveProfile, writeRaw } from '../lib/store'
import { getLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'

const TONES = ['warm', 'balanced', 'straightforward']

const Onboarding = ({ session, client, onComplete }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(() => ({ ...getProfile() }))
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const today = toDateKey(new Date())

  const set = (key, value) => setProfile((current) => ({ ...current, [key]: value }))

  const finish = async () => {
    setStatus({ state: 'saving', message: '' })
    const nextProfile = saveProfile({
      lastPeriodStart: profile.lastPeriodStart || null,
      cycleLength: normalizeCycleLength(profile.cycleLength),
      periodLength: normalizePeriodLength(profile.periodLength),
      tone: profile.tone || 'balanced',
    })
    writeRaw(KEYS.onboarded, 'true')
    if (session?.user?.id && client) {
      const result = await pushSettings(client, session.user.id, { profile: nextProfile, prefs: getPrefs(), lang: getLang() })
      if (!result.ok) {
        // The device copy is saved, so the user can continue. The error stays visible until they move on.
        setStatus({ state: 'error', message: t('onboarding.accountSyncError', { error: result.error }) })
      }
    }
    onComplete?.()
    navigate('/', { replace: true })
  }

  const hasAccounts = Boolean(supabase)

  return (
    <main className="onboarding-shell">
      <header className="onboarding-topbar">
        <Link to="/onboarding" className="onboarding-brand" aria-label={t('homeLabel')}>
          <Logo size={36} />
          <span>hercycle</span>
        </Link>
        <LanguageToggle />
      </header>

      <div className="onboarding-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={t('onboarding.progress', { step, total: 4 })}>
        {[1, 2, 3, 4].map((index) => <span key={index} className={`progress-segment${step >= index ? ' is-complete' : ''}`} />)}
      </div>

      {step === 1 && (
        <section className="onboarding-panel onboarding-welcome">
          <span className="eyebrow-label">{t('onboarding.eyebrow')}</span>
          <h1>{t('onboarding.welcomeTitle')}</h1>
          <p>{t('onboarding.welcomeCopy')}</p>
          <button type="button" className="primary-button spot" onClick={() => setStep(2)}>
            {t('onboarding.start')} <FiArrowRight aria-hidden="true" />
          </button>
          <p className="privacy-note"><FiShield aria-hidden="true" /> {t('onboarding.privacy')}</p>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-panel">
          <span className="eyebrow-label">{t('onboarding.cycleEyebrow')}</span>
          <h1>{t('onboarding.cycleTitle')}</h1>
          <p>{t('onboarding.cycleCopy')}</p>
          <label className="field" htmlFor="onboarding-last-period">
            <span className="field-label">{t('onboarding.lastPeriod')}</span>
            <input id="onboarding-last-period" type="date" max={today} value={profile.lastPeriodStart || ''} onChange={(event) => set('lastPeriodStart', event.target.value || null)} />
          </label>
          <Slider id="onboarding-cycle-length" label={t('settings.cycleLength')} min={21} max={40} value={normalizeCycleLength(profile.cycleLength)} tone="sage" format={(value) => t('checkIn.days', { count: value })} onChange={(value) => set('cycleLength', value)} hint={t('onboarding.cycleHint')} />
          <Slider id="onboarding-period-length" label={t('settings.periodLength')} min={2} max={10} value={normalizePeriodLength(profile.periodLength)} tone="rose" format={(value) => t('checkIn.days', { count: value })} onChange={(value) => set('periodLength', value)} />
          <div className="onboarding-actions">
            <button type="button" className="ghost-button" onClick={() => setStep(1)}><FiArrowLeft aria-hidden="true" /> {t('onboarding.back')}</button>
            <button type="button" className="primary-button spot" onClick={() => setStep(3)}>{t('onboarding.next')} <FiArrowRight aria-hidden="true" /></button>
          </div>
          <button type="button" className="link-button" onClick={() => { set('lastPeriodStart', null); setStep(3) }}>{t('onboarding.skip')}</button>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-panel">
          <span className="eyebrow-label">{t('onboarding.toneEyebrow')}</span>
          <h1>{t('onboarding.toneTitle')}</h1>
          <p>{t('onboarding.toneCopy')}</p>
          <div className="tone-grid" role="radiogroup" aria-label={t('onboarding.toneTitle')}>
            {TONES.map((tone) => (
              <button key={tone} type="button" role="radio" aria-checked={profile.tone === tone} className={`tone-card${profile.tone === tone ? ' is-selected' : ''} spot`} onClick={() => set('tone', tone)}>
                <strong>{t(`onboarding.tone.${tone}.title`)}</strong>
                <span>{t(`onboarding.tone.${tone}.copy`)}</span>
                {profile.tone === tone && <FiCheck aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="onboarding-actions">
            <button type="button" className="ghost-button" onClick={() => setStep(2)}><FiArrowLeft aria-hidden="true" /> {t('onboarding.back')}</button>
            <button type="button" className="primary-button spot" onClick={() => setStep(4)}>{t('onboarding.next')} <FiArrowRight aria-hidden="true" /></button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="onboarding-panel onboarding-done">
          <div className="done-mark" aria-hidden="true"><Logo size={72} /></div>
          <span className="eyebrow-label">{t('onboarding.doneEyebrow')}</span>
          <h1>{t('onboarding.doneTitle')}</h1>
          <p>{t('onboarding.doneCopy')}</p>
          {status.state === 'error' && <p className="save-state is-error" role="alert">{status.message}</p>}
          <button type="button" className="primary-button spot" onClick={finish} disabled={status.state === 'saving'}>
            {status.state === 'saving' ? t('onboarding.saving') : t('onboarding.enter')}
          </button>
          {!hasAccounts || session ? null : (
            <Link to="/auth" className="link-button">{t('onboarding.haveAccount')}</Link>
          )}
        </section>
      )}
    </main>
  )
}

export default Onboarding
