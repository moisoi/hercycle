import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { LuMessageCircle, LuRotateCcw, LuSend, LuX } from 'react-icons/lu'

import { buildLunaProfile } from '../lib/cycle'
import { replyTo } from '../lib/luna'
import { KEYS, useStoredJson } from '../lib/store'
import { getProfile, DEFAULT_JOURNEY } from '../lib/repo'

const EMPTY = Object.freeze({})
const EMPTY_LIST = Object.freeze([])
const FORM_CONTROL = /^(INPUT|TEXTAREA|SELECT)$/
const isFormControl = (el) => Boolean(el && FORM_CONTROL.test(el.tagName) && !el.disabled)

/** True while the user is typing or choosing in any form field. Luna steps aside then. */
function useFormFocus() {
  const [inForm, setInForm] = useState(false)
  useEffect(() => {
    const onIn = (event) => setInForm(isFormControl(event.target))
    const onOut = () => setInForm(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])
  return inForm
}

const LunaChat = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('am') ? 'am' : 'en'
  const inForm = useFormFocus()

  const profileStore = useStoredJson(KEYS.profile, EMPTY)
  const checkins = useStoredJson(KEYS.checkins, EMPTY)
  const journey = useStoredJson(KEYS.journey, DEFAULT_JOURNEY)

  const summary = useMemo(
    () =>
      buildLunaProfile({
        profile: { ...getProfile(), ...profileStore },
        checkins,
        intentions: journey.intentions || [],
        today: new Date(),
      }),
    [profileStore, checkins, journey.intentions]
  )

  const greeting = () => ({ id: 0, role: 'luna', text: t('luna.greeting'), topic: null })
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => [greeting()])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const timer = useRef(null)
  const threadEnd = useRef(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    threadEnd.current?.scrollIntoView?.({ block: 'nearest' })
  }, [messages, busy])

  const send = (raw) => {
    const text = raw.trim()
    if (!text || busy) return
    const userMessage = { id: nextId.current++, role: 'user', text, topic: null }
    const history = [...messages, userMessage]
    setMessages(history)
    setDraft('')
    setBusy(true)
    // A short pause makes Luna feel present. It does not block anything else on the page.
    timer.current = window.setTimeout(() => {
      const reply = replyTo(text, { lang, profile: summary, history })
      setMessages((current) => [...current, { id: nextId.current++, role: 'luna', text: reply.text, topic: reply.topic }])
      setBusy(false)
    }, 380)
  }

  const suggestions = Array.isArray(t('luna.suggestions', { returnObjects: true })) ? t('luna.suggestions', { returnObjects: true }) : []

  const reset = () => {
    window.clearTimeout(timer.current)
    setBusy(false)
    setMessages([greeting()])
  }

  return (
    <>
      <button
        type="button"
        className="luna-launch spot"
        aria-label={t('luna.open')}
        aria-expanded={open}
        aria-controls="luna-panel"
        data-hidden={inForm || open}
        tabIndex={inForm || open ? -1 : 0}
        onClick={() => setOpen(true)}
      >
        <LuMessageCircle aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            id="luna-panel"
            className="luna-panel"
            aria-label={t('luna.title')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
          >
            <header className="luna-head">
              <div>
                <strong>{t('luna.title')}</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{t('luna.subtitle')}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button type="button" className="btn quiet" style={{ color: '#fff' }} onClick={reset} aria-label={t('luna.newChat')}>
                  <LuRotateCcw aria-hidden="true" />
                </button>
                <button type="button" className="btn quiet" style={{ color: '#fff' }} onClick={() => setOpen(false)} aria-label={t('luna.close')}>
                  <LuX aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="luna-thread" role="log" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`bubble ${message.role === 'user' ? 'user' : 'luna'}`}>
                  {message.text}
                </div>
              ))}
              {busy && (
                <div className="bubble luna" aria-label={t('luna.typing')}>
                  <span className="typing" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
              <div ref={threadEnd} />
            </div>

            {messages.length <= 2 && suggestions.length > 0 && (
              <div className="luna-chips">
                {suggestions.map((item) => (
                  <button key={item} type="button" className="chip" onClick={() => send(item)}>
                    {item}
                  </button>
                ))}
              </div>
            )}

            <form
              className="luna-form"
              onSubmit={(event) => {
                event.preventDefault()
                send(draft)
              }}
            >
              <label className="sr-only" htmlFor="luna-input">
                {t('luna.placeholder')}
              </label>
              <input
                id="luna-input"
                className="input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t('luna.placeholder')}
                maxLength={500}
                autoComplete="off"
              />
              <button type="submit" className="btn" disabled={!draft.trim() || busy} aria-label={t('luna.send')}>
                <LuSend aria-hidden="true" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}

export default LunaChat
