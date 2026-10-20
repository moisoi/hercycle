import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowRight, FiArrowUpRight, FiHeart, FiLock, FiSend, FiShield, FiTrash2, FiX } from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import {
  MAX_MESSAGE_LENGTH,
  makeLocalReply,
  readAiPreference,
  readOnboardingPhase,
  readOnboardingTone,
  requestLunaReply,
  summarizeCycles,
  writeAiPreference,
} from '../lib/luna'

const LunaWidget = ({ session }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const [isOpen, setIsOpen] = useState(false)
  const [cycles, setCycles] = useState([])
  const [isLoadingCycles, setIsLoadingCycles] = useState(Boolean(userId))
  const [message, setMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [aiPreference, setAiPreference] = useState(() => readAiPreference(userId))
  const [connectionMode, setConnectionMode] = useState(null)
  const [chatError, setChatError] = useState('')
  const [messages, setMessages] = useState(() => [{
    id: 'luna-widget-welcome',
    role: 'assistant',
    content: t('lunaHello'),
  }])
  const launcherRef = useRef(null)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const activeRequestRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    setCycles([])
    setAiPreference(readAiPreference(userId))
    setIsLoadingCycles(Boolean(userId))
    setChatError('')

    if (!userId) {
      setIsLoadingCycles(false)
      return () => { isMounted = false }
    }

    supabase
      .from('cycles')
      .select('date, phase, mood, energy, period_start_date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!isMounted) return
        if (error) {
          console.error('Luna widget could not load cycle context:', error)
          setChatError(t('lunaContextLoadError'))
        } else {
          setCycles(data || [])
        }
        setIsLoadingCycles(false)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Luna widget could not load cycle context:', error)
        setChatError(t('lunaContextLoadError'))
        setIsLoadingCycles(false)
      })

    return () => { isMounted = false }
  }, [userId, t])

  useEffect(() => {
    const syncConsent = (event) => {
      if (!event.detail || event.detail.userId === userId) {
        setAiPreference(event.detail?.preference || readAiPreference(userId))
      }
    }
    window.addEventListener('hercycle:luna-consent-changed', syncConsent)
    return () => window.removeEventListener('hercycle:luna-consent-changed', syncConsent)
  }, [userId])

  useEffect(() => () => activeRequestRef.current?.abort(), [])

  const cycleSummary = useMemo(() => summarizeCycles(cycles), [cycles])
  const aiConsent = aiPreference === 'yes'
  const consentIsPending = Boolean(userId) && aiPreference === 'unset'
  const canChat = !isThinking

  useEffect(() => {
    if (!isOpen) return undefined
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 90)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !messagesEndRef.current) return
    const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    messagesEndRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' })
  }, [isOpen, messages, isThinking])

  const allowAiChat = () => {
    writeAiPreference(userId, 'yes')
    setAiPreference('yes')
  }

  const continueLocally = () => {
    writeAiPreference(userId, 'no')
    setAiPreference('no')
  }

  const turnOffAiChat = () => {
    activeRequestRef.current?.abort()
    writeAiPreference(userId, 'no')
    setAiPreference('no')
    setConnectionMode('local')
    setMessages([{ id: `luna-widget-welcome-${Date.now()}`, role: 'assistant', content: t('lunaHello') }])
    setChatError('')
  }

  const clearConversation = () => {
    activeRequestRef.current?.abort()
    setMessage('')
    setMessages([{ id: `luna-widget-welcome-${Date.now()}`, role: 'assistant', content: t('lunaHello') }])
    setChatError('')
    inputRef.current?.focus()
  }

  const sendMessage = async (suggestedMessage) => {
    const text = String(suggestedMessage ?? message).trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!text || !canChat) return

    const userMessage = { id: `luna-widget-user-${Date.now()}`, role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages.slice(-40))
    setMessage('')
    setChatError('')
    setIsThinking(true)

    let controller = null
    try {
      let reply = null
      if (session?.access_token && aiConsent) {
        controller = new AbortController()
        activeRequestRef.current = controller
        reply = await requestLunaReply(session.access_token, nextMessages, cycleSummary, controller.signal)
      }

      if (reply) {
        setConnectionMode('ai')
        setMessages((current) => [...current, { id: `luna-widget-ai-${Date.now()}`, role: 'assistant', content: reply }].slice(-40))
      } else {
        setConnectionMode('local')
        if (session?.access_token && aiConsent) setChatError(t('lunaAiUnavailable'))
        setMessages((current) => [...current, {
          id: `luna-widget-local-${Date.now()}`,
          role: 'assistant',
          content: makeLocalReply(text, cycleSummary, readOnboardingPhase(), readOnboardingTone(), nextMessages),
        }].slice(-40))
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.info('Luna widget is using local replies because AI is unavailable.', error)
      setConnectionMode('local')
      if (session?.access_token && aiConsent) setChatError(t('lunaAiUnavailable'))
      setMessages((current) => [...current, {
        id: `luna-widget-local-${Date.now()}`,
        role: 'assistant',
        content: makeLocalReply(text, cycleSummary, readOnboardingPhase(), readOnboardingTone(), nextMessages),
      }].slice(-40))
    } finally {
      if (activeRequestRef.current === controller) activeRequestRef.current = null
      setIsThinking(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage()
  }

  const closeWidget = () => {
    setIsOpen(false)
    window.requestAnimationFrame(() => launcherRef.current?.focus())
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
    if (event.key === 'Escape') {
      event.stopPropagation()
      closeWidget()
    }
  }

  const openFullChat = () => {
    setIsOpen(false)
    navigate('/luna')
  }

  if (location.pathname === '/luna') return null

  const suggestions = [t('lunaPromptPatterns'), t('lunaPromptIntimacy'), t('lunaPromptGeneral')]
  const statusLabel = connectionMode === 'ai' ? t('lunaModeAi') : connectionMode === 'local' ? t('lunaModeLocal') : aiConsent ? t('lunaModeAiReady') : t('lunaModeReady')

  return (
    <div className={`luna-widget-root${isOpen ? ' is-open' : ''}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="luna-widget-panel"
            role="dialog"
            id="luna-widget-dialog"
            aria-modal="false"
            aria-labelledby="luna-widget-title"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onKeyDown={(event) => { if (event.key === 'Escape') closeWidget() }}
          >
            <header className="luna-widget-header">
              <div className="luna-widget-avatar" aria-hidden="true">
                <GiLotus />
                <span>✦</span>
              </div>
              <div className="luna-widget-heading">
                <h2 id="luna-widget-title">Luna</h2>
                <span><i className={connectionMode === 'ai' ? 'is-ai' : ''} />{statusLabel}</span>
              </div>
              <div className="luna-widget-header-actions">
                <button type="button" className="luna-widget-clear" onClick={clearConversation} title={t('lunaClearChat')} aria-label={t('lunaClearChat')}>
                  <FiTrash2 aria-hidden="true" />
                </button>
                <button type="button" className="luna-widget-close" onClick={closeWidget} title={t('lunaWidgetClose')} aria-label={t('lunaWidgetClose')}>
                  <FiX aria-hidden="true" />
                </button>
              </div>
            </header>

            {consentIsPending && (
              <div className="luna-widget-consent">
                <p className="luna-widget-consent-summary">{t('lunaPrivacySummary')}</p>
                <details>
                  <summary><FiShield aria-hidden="true" /> {t('lunaWidgetDetailsLabel')}</summary>
                  <p>{t('lunaPrivacyConsent')}</p>
                </details>
                <div className="luna-widget-consent-actions">
                  <button type="button" className="luna-widget-consent-allow" onClick={allowAiChat}>{t('lunaConsentButton')} <FiHeart aria-hidden="true" /></button>
                  <button type="button" className="luna-widget-consent-local" onClick={continueLocally}>{t('lunaPreviewButton')}</button>
                </div>
              </div>
            )}

            {chatError && <Alert severity="info" className="luna-widget-alert">{chatError}</Alert>}

            <div className="luna-widget-messages" role="log" aria-live="polite" aria-relevant="additions text">
              {isLoadingCycles && <span className="luna-widget-context-loading">{t('lunaContextLoading')}</span>}
              {messages.map((item) => (
                <article key={item.id} className={`luna-widget-message luna-widget-message-${item.role}`}>
                  {item.role === 'assistant' && <span className="luna-widget-message-mark" aria-hidden="true"><GiLotus /></span>}
                  <div className="luna-widget-bubble-wrap">
                    {item.role === 'assistant' && <span className="luna-widget-speaker">Luna</span>}
                    <p className="luna-widget-bubble">{item.content}</p>
                  </div>
                </article>
              ))}
              <AnimatePresence>
                {isThinking && (
                  <motion.div className="luna-widget-message luna-widget-message-assistant" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <span className="luna-widget-message-mark" aria-hidden="true"><GiLotus /></span>
                    <div className="luna-widget-bubble-wrap">
                      <span className="luna-widget-speaker">Luna</span>
                      <div className="luna-widget-typing" role="status" aria-label={t('lunaThinking')}><i /><i /><i /></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && !isThinking && (
              <div className="luna-widget-suggestions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} disabled={!canChat}>
                    {suggestion}<FiArrowRight aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            <form className="luna-widget-composer" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="luna-widget-message">{t('lunaInputPlaceholder')}</label>
              <textarea
                id="luna-widget-message"
                ref={inputRef}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={t('lunaWidgetPlaceholder')}
                value={message}
                disabled={!canChat}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button type="submit" disabled={!message.trim() || !canChat} aria-label={t('lunaSend')}>
                <FiSend aria-hidden="true" />
              </button>
            </form>

            <footer className="luna-widget-footer">
              <span><FiLock aria-hidden="true" />{t('lunaWidgetPrivacy')}</span>
              <button type="button" onClick={openFullChat}>{t('lunaWidgetFullChat')} <FiArrowUpRight aria-hidden="true" /></button>
              {aiConsent && <button type="button" className="luna-widget-ai-toggle" onClick={turnOffAiChat}>{t('lunaDisableAi')}</button>}
              {aiPreference === 'no' && <button type="button" className="luna-widget-ai-toggle" onClick={allowAiChat}>{t('lunaEnableAi')}</button>}
            </footer>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        ref={launcherRef}
        type="button"
        className="luna-widget-launcher"
        aria-expanded={isOpen}
        aria-controls="luna-widget-dialog"
        aria-label={isOpen ? t('lunaWidgetClose') : t('lunaWidgetOpen')}
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="luna-widget-launcher-flower" aria-hidden="true"><GiLotus /><i>✦</i></span>
        <span className="luna-widget-launcher-label">Luna</span>
        <span className="luna-widget-launcher-subtitle">{t('lunaWidgetShortLabel')}</span>
      </motion.button>
    </div>
  )
}

export default LunaWidget
