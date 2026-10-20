import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheck, FiCopy, FiMail, FiMessageSquare, FiShare2 } from 'react-icons/fi'

import CardBurst from '../components/CardBurst'
import Slider from '../components/Slider'
import { useBurst } from '../lib/celebrate'
import { toDateKey } from '../lib/cycle'
import { planFor, comfortBand, messageKeyFor, VIBES } from '../lib/intimacy'
import { buildMailtoUrl, buildSmsUrl, buildWhatsAppUrl, isValidEmail, normalizeEthiopianMobile } from '../lib/partner'
import { pushIntimacy } from '../lib/sync'
import { saveIntimacy, useIntimacy } from '../lib/store'

const FEELINGS = [
  { key: 'warm', icon: '♡' },
  { key: 'playful', icon: '✦' },
  { key: 'quiet', icon: '☾' },
]

const OPENNESS = [
  { key: 'open', icon: '☀' },
  { key: 'maybe', icon: '☁' },
  { key: 'pause', icon: '☾' },
]

const CHANNELS = ['sms', 'email', 'whatsapp', 'copy']

const Intimacy = ({ session, client }) => {
  const { t } = useTranslation()
  const saved = useIntimacy()
  const todayKey = toDateKey(new Date())
  const today = saved[todayKey]

  const [feeling, setFeeling] = useState(today?.feeling || 'warm')
  const [openness, setOpenness] = useState(today?.openness || 'maybe')
  const [comfort, setComfort] = useState(today?.comfort ?? 5)
  const [vibe, setVibe] = useState(today?.vibe || 'tender')
  const [message, setMessage] = useState(null)
  const [channel, setChannel] = useState('sms')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [composerError, setComposerError] = useState('')
  const [copyState, setCopyState] = useState('')
  const [saveState, setSaveState] = useState({ state: 'idle', message: '' })
  const [vibeBurst, fireVibe] = useBurst()

  const plan = useMemo(() => planFor({ openness, comfort, vibe }), [openness, comfort, vibe])
  const suggestedMessage = t(`intimacy.messages.${messageKeyFor(plan)}`)
  const composed = message ?? suggestedMessage
  const ideas = t(`intimacy.ideas.${plan.ideaSet}`, { returnObjects: true })
  const ideaList = (Array.isArray(ideas) ? ideas : []).slice(0, plan.ideaCount)
  const bandCopy = t(`intimacy.comfortBand.${comfortBand(comfort)}`)

  const pickVibe = (next) => {
    setVibe(next)
    setMessage(null)
    setSaveState({ state: 'idle', message: '' })
    fireVibe('vibe')
  }

  // "Surprise me" changes only the vibe. Feeling, openness, comfort, and the message draft stay put.
  const surprise = () => {
    const others = VIBES.filter((item) => item !== vibe)
    pickVibe(others[Math.floor(Math.random() * others.length)])
  }

  const saveToday = async () => {
    const entry = { feeling, openness, comfort, vibe }
    saveIntimacy(todayKey, entry)
    if (session?.user?.id && client) {
      setSaveState({ state: 'saving', message: '' })
      const result = await pushIntimacy(client, session.user.id, todayKey, entry)
      setSaveState(result.ok
        ? { state: 'saved', message: t('intimacy.savedAccount') }
        : { state: 'error', message: t('intimacy.savedDeviceOnly', { error: result.error }) })
      return
    }
    setSaveState({ state: 'saved', message: t('intimacy.savedDevice') })
  }

  // Each send is a handoff: it opens the user's own app, where they press send. Nothing is sent by HerCycle.
  const handoff = (event) => {
    event.preventDefault()
    setComposerError('')
    if (channel === 'copy') return
    if (channel === 'email') {
      if (!isValidEmail(email)) {
        setComposerError(t('intimacy.errors.email'))
        return
      }
      window.location.href = buildMailtoUrl(email, t('intimacy.emailSubject'), composed)
      return
    }
    const check = normalizeEthiopianMobile(phone)
    if (!check.valid) {
      setComposerError(t(check.error === 'local' ? 'intimacy.errors.localNumber' : 'intimacy.errors.phoneFormat'))
      return
    }
    if (channel === 'sms') {
      window.location.href = buildSmsUrl(phone, composed)
      return
    }
    window.open(buildWhatsAppUrl(phone, composed), '_blank', 'noopener,noreferrer')
  }

  const copyOrShare = async () => {
    setCopyState('')
    try {
      if (navigator.share) {
        await navigator.share({ text: composed, title: t('intimacy.emailSubject') })
        setCopyState(t('intimacy.sharedDone'))
        return
      }
      await navigator.clipboard.writeText(composed)
      setCopyState(t('intimacy.copiedDone'))
    } catch {
      setCopyState(t('intimacy.copyFailed'))
    }
  }

  return (
    <div className={`page intimacy-page feeling-${feeling}`} style={{ '--comfort': comfort / 10 }}>
      <section className="intimacy-hero aura spot" aria-live="polite">
        <span className="eyebrow-label">{t('intimacy.kicker')}</span>
        <h2>{t(`intimacy.headline.${openness}`)}</h2>
        <p>{t(`intimacy.feeling.${feeling}.copy`)}</p>
        <div className={`feeling-stage stage-${feeling}`} aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      </section>

      <section className="card" aria-labelledby="feeling-heading">
        <h3 id="feeling-heading" className="card-title">{t('intimacy.feelingHeading')}</h3>
        <div className="feeling-grid" role="radiogroup" aria-label={t('intimacy.feelingHeading')}>
          {FEELINGS.map(({ key, icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={feeling === key}
              className={`feeling-card feeling-${key}${feeling === key ? ' is-selected' : ''} spot`}
              onClick={() => { setFeeling(key); setSaveState({ state: 'idle', message: '' }) }}
            >
              <span className={`feeling-icon feeling-icon-${key}`} aria-hidden="true">{icon}</span>
              <strong>{t(`intimacy.feeling.${key}.title`)}</strong>
              <small>{t(`intimacy.feeling.${key}.short`)}</small>
              {feeling === key && <FiCheck className="feeling-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="openness-heading">
        <h3 id="openness-heading" className="card-title">{t('intimacy.opennessHeading')}</h3>
        <p className="card-copy">{t('intimacy.opennessCopy')}</p>
        <div className="openness-row" role="radiogroup" aria-label={t('intimacy.opennessHeading')}>
          {OPENNESS.map(({ key, icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={openness === key}
              className={`openness-option openness-${key}${openness === key ? ' is-selected' : ''} spot`}
              onClick={() => { setOpenness(key); setMessage(null); setSaveState({ state: 'idle', message: '' }) }}
            >
              <span aria-hidden="true">{icon}</span>
              <strong>{t(`intimacy.openness.${key}`)}</strong>
            </button>
          ))}
        </div>
        <Slider
          id="intimacy-comfort"
          label={t('intimacy.comfortLabel')}
          min={0}
          max={10}
          value={comfort}
          tone="rose"
          format={() => bandCopy}
          hint={t('intimacy.comfortHint')}
          onChange={(value) => { setComfort(value); setSaveState({ state: 'idle', message: '' }) }}
        />
      </section>

      <section className="card vibe-card" aria-labelledby="vibe-heading">
        <div className="vibe-head">
          <h3 id="vibe-heading" className="card-title">{t('intimacy.vibeHeading')}</h3>
          <button type="button" className="ghost-button spot" onClick={surprise}>{t('intimacy.surprise')}</button>
        </div>
        <div className="vibe-grid" role="radiogroup" aria-label={t('intimacy.vibeHeading')}>
          {VIBES.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={vibe === key}
              className={`vibe-option vibe-${key}${vibe === key ? ' is-selected' : ''} spot`}
              onClick={() => pickVibe(key)}
            >
              <strong>{t(`intimacy.vibe.${key}.title`)}</strong>
              <small>{t(`intimacy.vibe.${key}.copy`)}</small>
              {vibe === key && <CardBurst burstKey={vibeBurst} context={`${feeling}-${key}`} />}
            </button>
          ))}
        </div>
        <ul className="idea-list" aria-label={t('intimacy.ideasHeading')}>
          {ideaList.map((idea) => <li key={idea}>{idea}</li>)}
        </ul>
      </section>

      <form className="card composer" onSubmit={handoff} aria-labelledby="composer-heading">
        <h3 id="composer-heading" className="card-title">{t('intimacy.composerHeading')}</h3>
        <p className="card-copy">{t('intimacy.composerCopy')}</p>
        <label className="field" htmlFor="partner-message">
          <span className="field-label">{t('intimacy.messageLabel')}</span>
          <textarea id="partner-message" rows={3} maxLength={400} value={composed} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <button type="button" className="ghost-button" onClick={() => setMessage(null)} disabled={message === null}>{t('intimacy.resetMessage')}</button>

        <div className="channel-row" role="radiogroup" aria-label={t('intimacy.channelLabel')}>
          {CHANNELS.map((item) => (
            <button key={item} type="button" role="radio" aria-checked={channel === item} className={`channel-option${channel === item ? ' is-selected' : ''} spot`} onClick={() => { setChannel(item); setComposerError(''); setCopyState('') }}>
              {item === 'sms' && <FiMessageSquare aria-hidden="true" />}
              {item === 'email' && <FiMail aria-hidden="true" />}
              {item === 'whatsapp' && <FiMessageSquare aria-hidden="true" />}
              {item === 'copy' && <FiCopy aria-hidden="true" />}
              <span>{t(`intimacy.channel.${item}`)}</span>
            </button>
          ))}
        </div>

        {(channel === 'sms' || channel === 'whatsapp') && (
          <label className="field" htmlFor="partner-phone">
            <span className="field-label">{t('intimacy.phoneLabel')}</span>
            <input id="partner-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+251 9XX XXX XXX" value={phone} onChange={(event) => setPhone(event.target.value)} aria-describedby="phone-help" />
            <small id="phone-help" className="field-help">{t('intimacy.phoneHelp')}</small>
          </label>
        )}
        {channel === 'email' && (
          <label className="field" htmlFor="partner-email">
            <span className="field-label">{t('intimacy.emailLabel')}</span>
            <input id="partner-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
        )}

        {channel === 'copy' ? (
          <button type="button" className="primary-button spot" onClick={copyOrShare}>
            {typeof navigator !== 'undefined' && navigator.share ? <FiShare2 aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
            {typeof navigator !== 'undefined' && navigator.share ? t('intimacy.shareButton') : t('intimacy.copyButton')}
          </button>
        ) : (
          <button type="submit" className="primary-button spot">{t(`intimacy.open.${channel}`)}</button>
        )}
        {composerError && <p className="save-state is-error" role="alert">{composerError}</p>}
        {copyState && <p className="save-state" role="status">{copyState}</p>}
        <p className="card-footnote">{t('intimacy.handoffNote')}</p>
      </form>

      <section className="card save-card">
        <button type="button" className="primary-button spot" onClick={saveToday} disabled={saveState.state === 'saving'}>
          {saveState.state === 'saving' ? t('intimacy.saving') : t('intimacy.saveToday')}
        </button>
        {saveState.state === 'saved' && <p className="save-state is-saved" role="status">{saveState.message}</p>}
        {saveState.state === 'error' && <p className="save-state is-error" role="alert">{saveState.message}</p>}
        <p className="card-footnote">{t('intimacy.privateNote')}</p>
      </section>
    </div>
  )
}

export default Intimacy
