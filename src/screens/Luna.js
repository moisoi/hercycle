import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSend } from 'react-icons/fi'

import Logo from '../components/Logo'
import { buildLunaProfile } from '../lib/cycle'
import { MAX_MESSAGE_LENGTH, readAiPreference, requestLunaReply, writeAiPreference } from '../lib/luna'
import { replyTo, toServerSummary } from '../lib/lunaReply'
import { getLang } from '../lib/i18n'
import { useCheckins, useJourney, useProfile } from '../lib/store'

const THREAD_KEY = 'hercycle.luna.thread'

const readThread = () => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(THREAD_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.slice(-60) : []
  } catch {
    return []
  }
}

const writeThread = (items) => {
  try {
    window.sessionStorage.setItem(THREAD_KEY, JSON.stringify(items.slice(-60)))
  } catch {
    // Session storage can be disabled. The thread still works for this visit.
  }
}

const Luna = ({ session, client }) => {
  const { t } = useTranslation()
  const profile = useProfile()
  const checkins = useCheckins()
  const journey = useJourney()
  const userId = session?.user?.id || null
  const [messages, setMessages] = useState(readThread)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [consent, setConsent] = useState(() => readAiPreference(userId))
  const threadRef = useRef(null)

  const context = useMemo(() => {
    const today = new Date()
    return {
      profile: buildLunaProfile({ profile, checkins, intentions: journey.intentions, today }),
      summary: toServerSummary(checkins, profile, today),
    }
  }, [profile, checkins, journey.intentions])

  useEffect(() => {
    writeThread(messages)
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  const chooseConsent = (next) => {
    setConsent(next)
    writeAiPreference(userId, next)
  }

  const send = async (raw) => {
    const text = String(raw || '').trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!text || busy) return
    const stamp = Date.now()
    const userMessage = { id: `u${stamp}`, role: 'user', text }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setBusy(true)

    let reply = null
    const token = session?.access_token
    if (consent === 'yes' && token) {
      try {
        const aiText = await requestLunaReply(
          token,
          next.map((item) => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text })),
          context.summary,
        )
        reply = { text: aiText, topic: null }
      } catch (error) {
        // The AI service may be unavailable or the device offline. Local replies keep Luna useful.
        console.warn('Luna AI reply unavailable, using a local reply:', error)
      }
    }
    if (!reply) {
      reply = replyTo(text, {
        lang: getLang(),
        profile: context.profile,
        history: next.map((item) => ({ role: item.role, topic: item.topic })),
      })
    }

    setMessages((current) => [...current, { id: `l${Date.now()}`, role: 'luna', text: reply.text, topic: reply.topic }])
    setBusy(false)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(input)
    }
  }

  const prompts = t('luna.prompts', { returnObjects: true })
  const suggestions = Array.isArray(prompts) ? prompts : []

  return (
    <div className="page luna-page">
      <section className="card luna-intro">
        <div className="luna-intro-mark"><Logo size={56} /></div>
        <div>
          <h2 className="card-title">{t('luna.introTitle')}</h2>
          <p className="card-copy">{t('luna.introCopy')}</p>
        </div>
      </section>

      {userId && (
        <section className="card luna-consent" aria-labelledby="luna-consent-heading">
          <h3 id="luna-consent-heading" className="card-title">{t('luna.consentHeading')}</h3>
          <p className="card-copy">{t('luna.consentCopy')}</p>
          <div className="segmented" role="radiogroup" aria-label={t('luna.consentHeading')}>
            <button type="button" role="radio" aria-checked={consent === 'yes'} className={`segment${consent === 'yes' ? ' is-selected' : ''} spot`} onClick={() => chooseConsent('yes')}>{t('luna.consentYes')}</button>
            <button type="button" role="radio" aria-checked={consent !== 'yes'} className={`segment${consent !== 'yes' ? ' is-selected' : ''} spot`} onClick={() => chooseConsent('no')}>{t('luna.consentNo')}</button>
          </div>
        </section>
      )}

      <section className="card luna-thread-card">
        <div className="luna-thread" ref={threadRef} role="log" aria-live="polite" aria-label={t('luna.threadLabel')}>
          {messages.length === 0 && <p className="luna-empty">{t('luna.empty')}</p>}
          {messages.map((item) => (
            <div key={item.id} className={`luna-bubble luna-${item.role}`}>
              <span className="sr-only">{item.role === 'user' ? t('luna.you') : t('luna.name')}: </span>
              {item.text}
            </div>
          ))}
          {busy && <div className="luna-bubble luna-luna is-typing" aria-label={t('luna.typing')}><span /><span /><span /></div>}
        </div>

        <div className="luna-suggestions" aria-label={t('luna.suggestionsLabel')}>
          {suggestions.map((prompt) => (
            <button key={prompt} type="button" className="chip spot" onClick={() => send(prompt)} disabled={busy}>{prompt}</button>
          ))}
        </div>

        <form className="luna-composer" onSubmit={onSubmit}>
          <label htmlFor="luna-input" className="sr-only">{t('luna.inputLabel')}</label>
          <textarea
            id="luna-input"
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={t('luna.placeholder')}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="primary-button spot" disabled={busy || !input.trim()} aria-label={t('luna.send')}>
            <FiSend aria-hidden="true" />
          </button>
        </form>
        <p className="card-footnote">{t('luna.disclaimer')}</p>
      </section>
    </div>
  )
}

export default Luna
