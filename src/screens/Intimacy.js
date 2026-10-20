import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LuCopy, LuFlame, LuHeart, LuMail, LuMessageCircle, LuPhone, LuShuffle, LuSparkles } from 'react-icons/lu'

import { SaveButton, SelectCard, Slider } from '../components/Controls'
import { celebrate } from '../lib/celebrate'
import { cycleDayFor, normalizeCycleLength, phaseFor, toDateKey } from '../lib/cycle'
import { readinessFor } from '../lib/intimacyReadiness'
import { buildMailtoUrl, buildSmsUrl, buildWhatsAppUrl, isValidEmail, normalizeEthiopianMobile } from '../lib/partner'
import { getIntimacy, getPrefs, getProfile, saveIntimacyLog } from '../lib/repo'
import { pushIntimacy } from '../lib/sync'
import { useSession } from '../lib/session'
import { PHASE_TINTS } from '../lib/phases'

const LIGHTS = [
  { key: 'green', tint: '#3f9a78', icon: <LuSparkles />, pattern: 'sparkle' },
  { key: 'yellow', tint: '#e07a2e', icon: <LuFlame />, pattern: 'ember' },
  { key: 'red', tint: '#b03a52', icon: <LuHeart />, pattern: 'drop' },
]

const VIBES = [
  { key: 'tender', tint: '#c98aa5', aura: 'rgba(212, 163, 178, 0.35)', pattern: 'petal', color: '#d4a3b2' },
  { key: 'playful', tint: '#e09a2e', aura: 'rgba(255, 179, 71, 0.32)', pattern: 'sparkle', color: '#e9b44c' },
  { key: 'bold', tint: '#b0527f', aura: 'rgba(176, 82, 127, 0.3)', pattern: 'ember', color: '#c26c95' },
]

const IDEA_PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal', 'general']

/** Intimacy: ideas that follow the cycle and the day's readiness, plus a partner handoff. */
const Intimacy = () => {
  const { t, i18n } = useTranslation()
  const { session } = useSession()
  const prefs = getPrefs()
  const profile = getProfile()
  const cycleLength = normalizeCycleLength(profile.cycleLength)
  const today = new Date()
  const todayKey = toDateKey(today)
  const day = cycleDayFor(today, profile.lastPeriodStart, cycleLength)
  const phase = phaseFor(day, { cycleLength, periodLength: profile.periodLength })
  const ideaPhase = phase && IDEA_PHASES.includes(phase) ? phase : 'general'

  const existing = getIntimacy()[todayKey] || {}
  const [light, setLight] = useState(existing.trafficLight || null)
  const [comfort, setComfort] = useState(existing.comfort ?? 5)
  const [libido, setLibido] = useState(existing.libido ?? 5)
  const [vibe, setVibe] = useState(null)
  const vibeRefs = useRef({})
  const surpriseRef = useRef(null)

  const readiness = readinessFor({ trafficLight: light, comfort, libido })
  const ideas = Array.isArray(t(`intimacy.ideas.${ideaPhase}`, { returnObjects: true }))
    ? t(`intimacy.ideas.${ideaPhase}`, { returnObjects: true }).slice(0, readiness.suggestionCount)
    : []

  // Partner composer: defaults follow the readiness state. A custom message wins once edited.
  const defaultMessage = t(`intimacy.partnerMsg.${readiness.id}`)
  const [customMessage, setCustomMessage] = useState(null)
  const message = customMessage ?? defaultMessage

  const [phoneInput, setPhoneInput] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const phone = normalizeEthiopianMobile(phoneInput)
  const phoneTouched = phoneInput.trim().length > 0
  const emailTouched = email.trim().length > 0
  const emailOk = isValidEmail(email)
  const phoneError = phoneTouched && !phone.valid ? t(phone.error === 'local' ? 'intimacy.partner.errLocal' : 'intimacy.partner.errFormat') : ''
  const emailError = emailTouched && !emailOk ? t('intimacy.partner.errEmail') : ''

  const chooseVibe = (key, element) => {
    setVibe(key)
    const v = VIBES.find((item) => item.key === key)
    const rect = element?.getBoundingClientRect?.()
    celebrate('vibe', {
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      color: v.color,
      pattern: v.pattern,
      count: 20,
    })
  }

  // "Surprise me" changes only the vibe. It never touches the light, comfort, or desire inputs.
  const surprise = () => {
    const options = VIBES.filter((item) => item.key !== vibe)
    const pick = options[Math.floor(Math.random() * options.length)]
    chooseVibe(pick.key, surpriseRef.current)
  }

  const activeVibe = VIBES.find((item) => item.key === vibe)
  const aura = activeVibe?.aura || 'rgba(212, 163, 178, 0.18)'

  const save = async () => {
    const entry = { trafficLight: light, comfort, libido, intimacyLevel: comfort, preferredTerms: [] }
    saveIntimacyLog(todayKey, entry)
    if (session?.user?.id) {
      try {
        await pushIntimacy(session.user.id, todayKey, entry)
      } catch (failure) {
        throw new Error(t('intimacy.syncFailed', { message: failure.message }))
      }
    }
    celebrate('progress', { x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#c26c95', count: 10 })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  // Handoff only: the link opens the user's own app. HerCycle never sends the message itself.
  const sendVia = (url, { newTab = false } = {}) => {
    if (newTab) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  const libidoNote = readiness.libidoNoteKey === 'intimacyLibidoLowNote' ? t('intimacy.libidoLowNote') : readiness.libidoNoteKey ? t('intimacy.libidoHighNote') : null

  if (prefs.hideIntimacy) {
    return (
      <section className="card stack" aria-labelledby="hidden-title">
        <h1 id="hidden-title" style={{ fontSize: '1.6rem' }}>{t('intimacy.hiddenTitle')}</h1>
        <p className="muted">{t('intimacy.hiddenBody')}</p>
        <Link to="/settings" className="btn">{t('intimacy.goSettings')}</Link>
      </section>
    )
  }

  return (
    <div className="section-gap">
      <header>
        <p className="card-kicker">{phase ? t(`phase.${ideaPhase}.name`) : t('intimacy.generalKicker')}</p>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginTop: 6 }}>{t('intimacy.title')}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{t('intimacy.intro')}</p>
      </header>

      <section className="card stack" aria-labelledby="light-title" style={{ background: `radial-gradient(560px circle at 0% 0%, ${aura}, transparent 62%), var(--surface)`, transition: 'background 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <h2 id="light-title" style={{ fontSize: '1.2rem' }}>{t('intimacy.lightTitle')}</h2>
        <p className="muted" style={{ fontSize: '0.92rem' }}>{t('intimacy.lightBody')}</p>
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {LIGHTS.map((item) => (
            <SelectCard
              key={item.key}
              pressed={light === item.key}
              onSelect={() => setLight(item.key)}
              icon={item.icon}
              title={t(`intimacy.lights.${item.key}.title`)}
              hint={t(`intimacy.lights.${item.key}.hint`)}
              tint={item.tint}
              pattern={item.pattern}
              burstKind="burst"
            />
          ))}
        </div>
        <Slider id="comfort" label={t('intimacy.comfort')} value={comfort} min={1} max={10} onChange={setComfort} tint="var(--berry)" lowLabel={t('intimacy.comfortLow')} highLabel={t('intimacy.comfortHigh')} pattern="petal" />
        <Slider id="libido" label={t('intimacy.libido')} value={libido} min={1} max={10} onChange={setLibido} tint="#e07a2e" lowLabel={t('intimacy.libidoLow')} highLabel={t('intimacy.libidoHigh')} pattern="ember" />
        <div className="notice info" role="status" aria-live="polite" key={readiness.id} style={{ animation: 'page-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both' }}>
          <LuSparkles aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
          <div>
            <strong>{t(`intimacy.readiness.${readiness.id}`)}</strong>
            {libidoNote && <div style={{ marginTop: 4 }}>{libidoNote}</div>}
          </div>
        </div>
      </section>

      <section className="card stack" aria-labelledby="ideas-title">
        <h2 id="ideas-title" style={{ fontSize: '1.2rem' }}>{t('intimacy.ideasTitle', { count: readiness.suggestionCount })}</h2>
        <ul className="stack" style={{ gap: 10, paddingLeft: 0, listStyle: 'none', margin: 0 }}>
          {ideas.map((idea) => (
            <li key={idea} className="chip" style={{ justifyContent: 'flex-start', borderRadius: 16, color: 'var(--ink)' }}>
              <LuSparkles aria-hidden="true" style={{ color: PHASE_TINTS[ideaPhase] || 'var(--berry)', flex: 'none' }} />
              {idea}
            </li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: '0.88rem' }}>{t('intimacy.consentNote')}</p>
      </section>

      <section className="card stack" aria-labelledby="vibe-title" style={{ background: `radial-gradient(520px circle at 100% 0%, ${aura}, transparent 60%), var(--surface)`, transition: 'background 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <div className="between">
          <div>
            <h2 id="vibe-title" style={{ fontSize: '1.2rem' }}>{t('intimacy.vibeTitle')}</h2>
            <p className="muted" style={{ fontSize: '0.92rem' }}>{t('intimacy.vibeBody')}</p>
          </div>
          <button ref={surpriseRef} type="button" className="btn ghost" onClick={surprise}>
            <LuShuffle aria-hidden="true" /> {t('intimacy.surprise')}
          </button>
        </div>
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {VIBES.map((item) => (
            <div key={item.key} ref={(el) => { vibeRefs.current[item.key] = el }}>
              <SelectCard
                pressed={vibe === item.key}
                onSelect={() => chooseVibe(item.key, vibeRefs.current[item.key])}
                icon={<LuSparkles />}
                title={t(`intimacy.vibes.${item.key}.title`)}
                hint={t(`intimacy.vibes.${item.key}.hint`)}
                tint={item.tint}
                pattern={item.pattern}
                burstCount={0}
                burstKind="vibe"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="partner-title">
        <div>
          <h2 id="partner-title" style={{ fontSize: '1.2rem' }}>{t('intimacy.partner.title')}</h2>
          <p className="muted" style={{ fontSize: '0.92rem' }}>{t('intimacy.partner.body')}</p>
        </div>

        <label className="field">
          <span>{t('intimacy.partner.phone')}</span>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <LuPhone aria-hidden="true" style={{ color: 'var(--muted)', flex: 'none' }} />
            <input
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="+251 9XX XXX XXX"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              aria-invalid={Boolean(phoneError)}
              aria-describedby="phone-help"
            />
          </div>
          <small id="phone-help" className={phoneError ? 'field-error' : phoneTouched && phone.valid ? 'field-ok' : ''}>
            {phoneError || (phoneTouched && phone.valid ? t('intimacy.partner.phoneOk') : t('intimacy.partner.phoneHelp'))}
          </small>
        </label>

        <label className="field">
          <span>{t('intimacy.partner.email')}</span>
          <input
            className="input"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby="email-help"
          />
          <small id="email-help" className={emailError ? 'field-error' : ''}>
            {emailError || t('intimacy.partner.emailHelp')}
          </small>
        </label>

        <label className="field">
          <span>{t('intimacy.partner.message')}</span>
          <textarea className="textarea" value={message} maxLength={500} onChange={(event) => setCustomMessage(event.target.value)} />
          <small>{t('intimacy.partner.messageHelp')}</small>
        </label>

        <div className="row" role="group" aria-label={t('intimacy.partner.sendGroup')}>
          <button type="button" className="btn" disabled={!phone.valid} onClick={() => sendVia(buildWhatsAppUrl(phone.value, message), { newTab: true })}>
            <LuMessageCircle aria-hidden="true" /> {t('intimacy.partner.whatsapp')}
          </button>
          <button type="button" className="btn ghost" disabled={!phone.valid} onClick={() => sendVia(buildSmsUrl(phone.value, message))}>
            <LuPhone aria-hidden="true" /> {t('intimacy.partner.sms')}
          </button>
          <button type="button" className="btn ghost" disabled={!emailOk} onClick={() => sendVia(buildMailtoUrl(email.trim(), t('intimacy.partner.subject'), message))}>
            <LuMail aria-hidden="true" /> {t('intimacy.partner.emailSend')}
          </button>
          <button type="button" className="btn quiet" onClick={copy}>
            <LuCopy aria-hidden="true" /> {copied ? t('intimacy.partner.copied') : t('intimacy.partner.copy')}
          </button>
        </div>
        <p className="muted" style={{ fontSize: '0.86rem' }}>{t('intimacy.partner.handoff')}</p>
      </section>

      <section className="card stack" aria-labelledby="save-title">
        <h2 id="save-title" style={{ fontSize: '1.2rem' }}>{t('intimacy.saveTitle')}</h2>
        <p className="muted" style={{ fontSize: '0.92rem' }}>{t('intimacy.saveBody')}</p>
        <SaveButton
          onSave={save}
          idleLabel={t('intimacy.save')}
          savingLabel={t('intimacy.saving')}
          savedLabel={t('intimacy.saved')}
          savedText={session?.user ? t('intimacy.savedAccount') : t('intimacy.savedDevice')}
          statusText={session?.user ? '' : t('intimacy.deviceHint')}
        />
      </section>
    </div>
  )
}

export default Intimacy
