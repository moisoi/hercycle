import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Skeleton } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiArrowDown,
  FiHeart,
  FiLock,
  FiSend,
  FiShield,
  FiStar,
  FiTrash2,
} from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'

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

const LunaChat = ({ session }) => {
  const { t } = useTranslation()
  const [cycles, setCycles] = useState([])
  const [isLoadingCycles, setIsLoadingCycles] = useState(Boolean(session?.user?.id))
  const [contextError, setContextError] = useState('')
  const [message, setMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [aiPreference, setAiPreference] = useState(() => readAiPreference(session?.user?.id))
  const aiConsent = aiPreference === 'yes'
  const [connectionMode, setConnectionMode] = useState(null)
  const [chatError, setChatError] = useState('')
  const [messages, setMessages] = useState(() => [{
    id: 'luna-welcome',
    role: 'assistant',
    content: t('lunaHello'),
  }])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const activeAiRequestRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const loadCycleContext = async () => {
      if (!session?.user?.id) {
        setCycles([])
        setIsLoadingCycles(false)
        return
      }

      setIsLoadingCycles(true)
      setContextError('')
      const { data, error } = await supabase
        .from('cycles')
        .select('date, phase, mood, energy, period_start_date')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .limit(60)

      if (!isMounted) return
      if (error) {
        console.error('Luna could not load cycle context:', error)
        setContextError(t('lunaContextLoadError'))
      } else {
        setCycles(data || [])
      }
      setIsLoadingCycles(false)
    }

    loadCycleContext().catch((error) => {
      if (isMounted) {
        console.error('Luna could not load cycle context:', error)
        setContextError(t('lunaContextLoadError'))
        setIsLoadingCycles(false)
      }
    })

    return () => { isMounted = false }
  }, [session?.user?.id, t])

  useEffect(() => () => activeAiRequestRef.current?.abort(), [])

  const cycleSummary = useMemo(() => summarizeCycles(cycles), [cycles])
  const localPhase = readOnboardingPhase()
  const localTone = readOnboardingTone()
  const isConsentRequired = Boolean(session?.user?.id)
  const consentIsPending = isConsentRequired && aiPreference === 'unset'
  const canChat = !isThinking

  useEffect(() => {
    const node = messagesEndRef.current
    if (!node) return
    const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' })
  }, [messages, isThinking])

  const setAiPreferenceForSession = (preference) => {
    writeAiPreference(session?.user?.id, preference)
    setAiPreference(preference)
  }

  const allowAiChat = () => setAiPreferenceForSession('yes')
  const continueLocally = () => setAiPreferenceForSession('no')
  const turnOffAiChat = () => {
    activeAiRequestRef.current?.abort()
    setAiPreferenceForSession('no')
    setConnectionMode('local')
    setMessages([{
      id: `luna-welcome-${Date.now()}`,
      role: 'assistant',
      content: t('lunaHello'),
    }])
    setChatError('')
  }

  const clearConversation = () => {
    activeAiRequestRef.current?.abort()
    setMessage('')
    setMessages([{
      id: `luna-welcome-${Date.now()}`,
      role: 'assistant',
      content: t('lunaHello'),
    }])
    setChatError('')
    inputRef.current?.focus()
  }

  const sendMessage = async (suggestedMessage) => {
    const text = String(suggestedMessage ?? message).trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!text || !canChat) return

    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setMessage('')
    setChatError('')
    setIsThinking(true)

    let requestController = null
    try {
      let aiReply = null
      if (session?.access_token && aiConsent) {
        requestController = new AbortController()
        activeAiRequestRef.current = requestController
        aiReply = await requestLunaReply(session.access_token, nextMessages, cycleSummary, requestController.signal)
      }

      if (aiReply) {
        setConnectionMode('ai')
        setChatError('')
        setMessages((current) => [...current, {
          id: `luna-${Date.now()}`,
          role: 'assistant',
          content: aiReply,
        }])
      } else {
        setConnectionMode('local')
        if (session?.access_token && aiConsent) setChatError(t('lunaAiUnavailable'))
        setMessages((current) => [...current, {
          id: `luna-local-${Date.now()}`,
          role: 'assistant',
          content: makeLocalReply(text, cycleSummary, localPhase, localTone, nextMessages),
        }])
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.info('Luna AI endpoint unavailable; using local companion replies.', error)
      setConnectionMode('local')
      if (session?.access_token && aiConsent) setChatError(t('lunaAiUnavailable'))
      setMessages((current) => [...current, {
        id: `luna-local-${Date.now()}`,
        role: 'assistant',
        content: makeLocalReply(text, cycleSummary, localPhase, localTone, nextMessages),
      }])
    } finally {
      if (activeAiRequestRef.current === requestController) activeAiRequestRef.current = null
      setIsThinking(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    t('lunaPromptPatterns'),
    t('lunaPromptEnergy'),
    t('lunaPromptPhase'),
    t('lunaPromptIntimacy'),
    t('lunaPromptGeneral'),
    t('lunaPromptDoctor'),
  ]

  return (
    <div className="luna-page">
      <div className="luna-layout">
        <motion.section
          className="luna-chat-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          aria-label={t('lunaChatLabel')}
        >
          <header className="luna-chat-header">
            <div className="luna-chat-brand">
              <div className="luna-avatar luna-avatar-header" aria-hidden="true">
                <span className="luna-avatar-glow" />
                <GiLotus />
                <span className="luna-avatar-spark">✦</span>
              </div>
              <div>
                <div className="luna-name-row"><h2>Luna</h2><span className={`luna-status-dot${connectionMode === 'ai' ? ' is-ai' : ''}`} /></div>
                <p>{connectionMode === 'ai' ? t('lunaModeAi') : connectionMode === 'local' ? t('lunaModeLocal') : t('lunaModeReady')}</p>
              </div>
            </div>
            <button type="button" className="luna-clear-button" onClick={clearConversation} aria-label={t('lunaClearChat')} title={t('lunaClearChat')}>
              <FiTrash2 aria-hidden="true" /><span>{t('lunaClearShort')}</span>
            </button>
          </header>

          {contextError && <Alert severity="info" className="luna-inline-alert">{contextError}</Alert>}

          {consentIsPending && (
            <section className="luna-consent-banner" aria-label={t('lunaPrivacyHeading')}>
              <span className="luna-consent-icon"><FiShield aria-hidden="true" /></span>
              <div className="luna-consent-banner-copy">
                <span className="eyebrow-label">{t('lunaConsentEyebrow')}</span>
                <strong>{t('lunaPrivacyHeading')}</strong>
                <p>{t('lunaPrivacyConsent')}</p>
              </div>
              <div className="luna-consent-actions">
                <button type="button" className="luna-ai-enable" onClick={allowAiChat}>{t('lunaConsentButton')} <FiHeart aria-hidden="true" /></button>
                <button type="button" className="luna-local-only" onClick={continueLocally}>{t('lunaPreviewButton')}</button>
              </div>
            </section>
          )}
          <>
              <div className="luna-message-list" role="log" aria-live="polite" aria-relevant="additions text">
                {messages.map((item, index) => (
                  <motion.article
                    key={item.id}
                    className={`luna-message luna-message-${item.role}`}
                    initial={{ opacity: 0, y: 8, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, delay: index === messages.length - 1 ? 0.03 : 0 }}
                  >
                    {item.role === 'assistant' && (
                      <span className="luna-message-avatar" aria-hidden="true"><GiLotus /></span>
                    )}
                    <div className="luna-bubble-wrap">
                      {item.role === 'assistant' && <span className="luna-message-speaker">Luna</span>}
                      <p className="luna-bubble">{item.content}</p>
                    </div>
                  </motion.article>
                ))}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div className="luna-message luna-message-assistant" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <span className="luna-message-avatar" aria-hidden="true"><GiLotus /></span>
                      <div className="luna-bubble-wrap">
                        <span className="luna-message-speaker">Luna</span>
                        <div className="luna-typing-bubble" role="status" aria-label={t('lunaThinking')}>
                          <span /><span /><span />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && !isThinking && (
                <div className="luna-suggestions">
                  <span className="luna-suggestions-label"><FiStar aria-hidden="true" /> {t('lunaStarters')}</span>
                  <div className="luna-suggestion-list">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={suggestion}
                        type="button"
                        className={`luna-suggestion luna-suggestion-${index + 1}`}
                        onClick={() => sendMessage(suggestion)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!canChat}
                      >
                        {suggestion}<FiArrowDown aria-hidden="true" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {chatError && <Alert severity="error" className="luna-inline-alert">{chatError}</Alert>}

              <form className="luna-composer" onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="luna-message">{t('lunaInputPlaceholder')}</label>
                <textarea
                  id="luna-message"
                  ref={inputRef}
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder={t('lunaInputPlaceholder')}
                  value={message}
                  disabled={!canChat}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <span className="luna-compose-hint">{t('lunaComposeHint')}</span>
                <button type="submit" className="luna-send-button" disabled={!message.trim() || !canChat} aria-label={t('lunaSend')}>
                  <FiSend aria-hidden="true" />
                </button>
              </form>
              <div className="luna-chat-footnote"><FiLock aria-hidden="true" /><span>{t('lunaMedicalNote')}</span></div>
            </>
        </motion.section>

        <aside className="luna-side-column">
          <motion.section className="luna-context-card" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.34, delay: 0.08 }}>
            <div className="luna-context-flower" aria-hidden="true"><GiLotus /></div>
            <span className="eyebrow-label">{t('lunaContextEyebrow')}</span>
            <h3>{t('lunaContextHeading')}</h3>
            <p className="luna-context-copy">{t('lunaContextDescription')}</p>

            {isLoadingCycles ? (
              <div className="luna-context-skeleton"><Skeleton width="65%" /><Skeleton width="90%" /><Skeleton width="75%" /></div>
            ) : cycleSummary.checkInCount ? (
              <>
                <div className="luna-context-count"><strong>{cycleSummary.checkInCount}</strong><span>{t('lunaCheckIns')}</span></div>
                <div className="luna-context-stats">
                  <div><span>{t('lunaAvgMood')}</span><strong>{cycleSummary.averageMood ? `${cycleSummary.averageMood.toFixed(1)} / 10` : '—'}</strong></div>
                  <div><span>{t('lunaAvgEnergy')}</span><strong>{cycleSummary.averageEnergy ? `${cycleSummary.averageEnergy.toFixed(1)} / 10` : '—'}</strong></div>
                </div>
                {cycleSummary.mostCommonPhase && (
                  <div className="luna-phase-chip"><span>{t('lunaPhasePattern')}</span><strong>{cycleSummary.mostCommonPhase}</strong></div>
                )}
                <p className="luna-context-footer">{t('lunaSourceNote')}</p>
              </>
            ) : (
              <div className="luna-context-empty">
                <span aria-hidden="true">✧</span>
                <p>{t('lunaNoCheckIns')}</p>
              </div>
            )}
          </motion.section>

          <section className="luna-privacy-card">
            <span className="luna-privacy-icon"><FiLock aria-hidden="true" /></span>
            <div><strong>{t('lunaChatLocalHeading')}</strong><p>{aiConsent ? t('lunaConversationLocal') : isConsentRequired ? t('lunaLocalOnlyDetail') : t('lunaLocalPrivacy')}</p></div>
            {aiConsent && <button type="button" className="luna-revoke-consent" onClick={turnOffAiChat}>{t('lunaDisableAi')}</button>}
            {aiPreference === 'no' && <><span className="luna-privacy-status">{t('lunaLocalOnlyStatus')}</span><button type="button" className="luna-revoke-consent" onClick={allowAiChat}>{t('lunaEnableAi')}</button></>}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default LunaChat
