import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { loadPreferences, loadUserCycles } from '../lib/care'
import {
  MAX_MESSAGE_LENGTH,
  clearSharedThread,
  makeLocalReply,
  readAiPreference,
  readOnboardingPhase,
  readOnboardingTone,
  readSharedThread,
  requestLunaReply,
  summarizeCycles,
  writeAiPreference,
  writeSharedThread,
} from '../lib/luna'

const LunaChat = ({ session }) => {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const [cycles, setCycles] = useState([])
  const [isLoadingCycles, setIsLoadingCycles] = useState(true)
  const [contextError, setContextError] = useState('')
  const [message, setMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [aiPreference, setAiPreference] = useState(() => readAiPreference(userId))
  const aiConsent = aiPreference === 'yes'
  const [connectionMode, setConnectionMode] = useState(null)
  const [chatError, setChatError] = useState('')
  const [messages, setMessages] = useState(() => readSharedThread(userId, t('lunaHello')))

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const activeAiRequestRef = useRef(null)
  const autostartHandledRef = useRef(false)

  const syncCycleContext = useCallback(async () => {
    setIsLoadingCycles(true)
    setContextError('')
    try {
      const loaded = await loadUserCycles(userId)
      setCycles(loaded)
    } catch (error) {
      console.error('Luna could not load cycle context:', error)
      setContextError(t('lunaContextLoadError'))
    } finally {
      setIsLoadingCycles(false)
    }
  }, [t, userId])

  useEffect(() => {
    setMessages(readSharedThread(userId, t('lunaHello')))
    syncCycleContext()

    const onDataChanged = () => syncCycleContext()
    const onThreadChanged = () => setMessages(readSharedThread(userId, t('lunaHello')))
    window.addEventListener('hercycle:data-changed', onDataChanged)
    window.addEventListener('hercycle:luna-thread-changed', onThreadChanged)
    return () => {
      window.removeEventListener('hercycle:data-changed', onDataChanged)
      window.removeEventListener('hercycle:luna-thread-changed', onThreadChanged)
    }
  }, [syncCycleContext, t, userId])

  useEffect(() => () => activeAiRequestRef.current?.abort(), [])

  const cycleSummary = useMemo(() => summarizeCycles(cycles), [cycles])
  const localPhase = readOnboardingPhase()
  const localTone = readOnboardingTone()
  const isConsentRequired = Boolean(userId)
  const consentIsPending = isConsentRequired && aiPreference === 'unset'
  const canChat = !isThinking

  const commitMessages = useCallback(
    (updater) => {
      setMessages((current) => {
        const next = (typeof updater === 'function' ? updater(current) : updater).slice(-40)
        writeSharedThread(userId, next)
        return next
      })
    },
    [userId]
  )

  // If navigated from Intimacy compass with ?autostart=1 and trailing user message, answer automatically.
  useEffect(() => {
    if (autostartHandledRef.current || isLoadingCycles) return
    if (searchParams.get('autostart') !== '1') return
    const last = messages[messages.length - 1]
    if (last && last.role === 'user') {
      autostartHandledRef.current = true
      setSearchParams({}, { replace: true })
      const replyText = makeLocalReply(
        last.content,
        cycleSummary,
        localPhase,
        localTone,
        messages,
        locale
      )
      commitMessages((curr) => [
        ...curr,
        { id: `luna-auto-${Date.now()}`, role: 'assistant', content: replyText },
      ])
    }
  }, [
    commitMessages,
    cycleSummary,
    isLoadingCycles,
    localPhase,
    localTone,
    locale,
    messages,
    searchParams,
    setSearchParams,
  ])

  useEffect(() => {
    const node = messagesEndRef.current
    if (!node || typeof node.scrollIntoView !== 'function') return
    const reduceMotion = Boolean(loadPreferences().reduceMotion)
    node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' })
  }, [messages, isThinking])

  const setAiPreferenceForSession = (preference) => {
    writeAiPreference(userId, preference)
    setAiPreference(preference)
  }

  const allowAiChat = () => setAiPreferenceForSession('yes')
  const continueLocally = () => setAiPreferenceForSession('no')
  const turnOffAiChat = () => {
    activeAiRequestRef.current?.abort()
    setAiPreferenceForSession('no')
    setConnectionMode('local')
    setChatError('')
  }

  const clearConversation = () => {
    activeAiRequestRef.current?.abort()
    clearSharedThread(userId)
    const fresh = [
      {
        id: `luna-welcome-${Date.now()}`,
        role: 'assistant',
        content: t('lunaHello'),
      },
    ]
    writeSharedThread(userId, fresh)
    setMessage('')
    setMessages(fresh)
    setChatError('')
    inputRef.current?.focus()
  }

  const sendMessage = async (suggestedMessage) => {
    const text = String(suggestedMessage ?? message).trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!text || !canChat) return

    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: text }
    const nextMessages = [...messages, userMessage].slice(-40)
    commitMessages(nextMessages)
    setMessage('')
    setChatError('')
    setIsThinking(true)

    let requestController = null
    try {
      let aiReply = null
      if (session?.access_token && aiConsent) {
        requestController = new AbortController()
        activeAiRequestRef.current = requestController
        aiReply = await requestLunaReply(
          session.access_token,
          nextMessages,
          cycleSummary,
          requestController.signal,
          locale
        )
      }

      if (aiReply) {
        setConnectionMode('ai')
        setChatError('')
        commitMessages((current) => [
          ...current,
          { id: `luna-${Date.now()}`, role: 'assistant', content: aiReply },
        ])
      } else {
        setConnectionMode('local')
        if (session?.access_token && aiConsent) setChatError(t('lunaAiUnavailable'))
        commitMessages((current) => [
          ...current,
          {
            id: `luna-local-${Date.now()}`,
            role: 'assistant',
            content: makeLocalReply(
              text,
              cycleSummary,
              localPhase,
              localTone,
              nextMessages,
              locale
            ),
          },
        ])
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      setConnectionMode('local')
      if (session?.access_token && aiConsent) setChatError(t('lunaAiUnavailable'))
      commitMessages((current) => [
        ...current,
        {
          id: `luna-local-${Date.now()}`,
          role: 'assistant',
          content: makeLocalReply(
            text,
            cycleSummary,
            localPhase,
            localTone,
            nextMessages,
            locale
          ),
        },
      ])
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
          className="luna-chat-card hc-spotlight-card"
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
                <div className="luna-name-row">
                  <h2>{t('luna')}</h2>
                  <span className={`luna-status-dot${connectionMode === 'ai' ? ' is-ai' : ''}`} />
                </div>
                <p>
                  {connectionMode === 'ai'
                    ? t('lunaModeAi')
                    : connectionMode === 'local'
                    ? t('lunaModeLocal')
                    : t('lunaModeReady')}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="luna-clear-button hc-spotlight-btn"
              onClick={clearConversation}
              aria-label={t('lunaClearChat')}
            >
              <FiTrash2 aria-hidden="true" />
              <span>{t('lunaClearShort')}</span>
            </button>
          </header>

          {consentIsPending && (
            <div className="luna-consent-banner" role="region" aria-label={t('lunaPrivacyHeading')}>
              <span className="luna-consent-icon" aria-hidden="true">
                <FiShield />
              </span>
              <div className="luna-consent-banner-copy">
                <span className="eyebrow-label">{t('lunaConsentEyebrow')}</span>
                <strong>{t('lunaPrivacyHeading')}</strong>
                <p>{t('lunaPrivacyConsent')}</p>
              </div>
              <div className="luna-consent-actions">
                <button type="button" className="luna-ai-enable" onClick={allowAiChat}>
                  <FiHeart aria-hidden="true" />
                  <span>{t('lunaConsentButton')}</span>
                </button>
                <button type="button" className="luna-local-only" onClick={continueLocally}>
                  {t('lunaPreviewButton')}
                </button>
              </div>
            </div>
          )}

          {chatError && (
            <Alert severity="info" className="luna-inline-alert">
              {chatError}
            </Alert>
          )}
          {contextError && (
            <Alert severity="warning" className="luna-inline-alert">
              {contextError}
            </Alert>
          )}

          <div className="luna-message-list" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((item) => (
              <motion.article
                key={item.id}
                className={`luna-message luna-message-${item.role}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                {item.role === 'assistant' && (
                  <span className="luna-message-avatar" aria-hidden="true">
                    <GiLotus />
                  </span>
                )}
                <div className="luna-bubble-wrap">
                  {item.role === 'assistant' && (
                    <span className="luna-message-speaker">{t('luna')}</span>
                  )}
                  <p className="luna-bubble">
                    {String(item.id || '').startsWith('luna-welcome') ? t('lunaHello') : item.content}
                  </p>
                </div>
              </motion.article>
            ))}

            <AnimatePresence>
              {isThinking && (
                <motion.div
                  className="luna-message luna-message-assistant"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="luna-message-avatar" aria-hidden="true">
                    <GiLotus />
                  </span>
                  <div className="luna-bubble-wrap">
                    <span className="luna-message-speaker">{t('luna')}</span>
                    <div className="luna-typing-bubble" role="status" aria-label={t('lunaThinking')}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="luna-suggestions">
            <span className="luna-suggestions-label">
              <FiStar aria-hidden="true" /> {t('lunaStarters')}
            </span>
            <div className="luna-suggestion-list">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="luna-suggestion hc-spotlight-btn"
                  disabled={!canChat}
                  onClick={() => sendMessage(suggestion)}
                >
                  <span>{suggestion}</span>
                  <FiArrowDown aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <form className="luna-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="luna-message-input">
              {t('lunaInputPlaceholder')}
            </label>
            <textarea
              id="luna-message-input"
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
            <button
              type="submit"
              className="luna-send-button hc-spotlight-btn"
              disabled={!message.trim() || !canChat}
              aria-label={t('lunaSend')}
            >
              <FiSend aria-hidden="true" />
            </button>
          </form>

          <p className="luna-chat-footnote">
            <FiLock aria-hidden="true" />
            <span>{t('lunaMedicalNote')}</span>
          </p>
        </motion.section>

        <aside className="luna-side-column">
          <section className="luna-context-card hc-spotlight-card" data-testid="luna-live-context-card">
            <div className="luna-context-header-row">
              <span className="eyebrow-label">{t('lunaContextEyebrow')}</span>
              <span className="luna-context-flower" aria-hidden="true">
                <GiLotus />
              </span>
            </div>
            <h3>{t('lunaContextHeading')}</h3>
            <p className="luna-context-copy">{t('lunaContextDescription')}</p>

            {isLoadingCycles ? (
              <div className="luna-context-skeleton">
                <Skeleton width="60%" height={38} />
                <Skeleton width="90%" height={52} />
              </div>
            ) : cycleSummary.count > 0 ? (
              <>
                <div className="luna-context-count">
                  <strong>{cycleSummary.count}</strong>
                  <span>
                    {t('lunaCheckIns')}
                    {cycleSummary.cycleDay ? ` · ${t('cycleDayBadge', { day: cycleSummary.cycleDay })}` : ''}
                  </span>
                </div>
                <div className="luna-context-stats">
                  <div>
                    <span>{t('lunaAvgMood')}</span>
                    <strong>{cycleSummary.moodAverage ? `${cycleSummary.moodAverage}/10` : '—'}</strong>
                  </div>
                  <div>
                    <span>{t('lunaAvgEnergy')}</span>
                    <strong>
                      {cycleSummary.energyAverage ? `${cycleSummary.energyAverage}/10` : '—'}
                    </strong>
                  </div>
                </div>
                {(cycleSummary.latestPhase || cycleSummary.dominantPhase) && (
                  <div className="luna-phase-chip">
                    <span>{t('lunaPhasePattern')}</span>
                    <strong>
                      {t(`phase.${cycleSummary.latestPhase || cycleSummary.dominantPhase}`)}
                    </strong>
                  </div>
                )}
                <p className="luna-context-footer">{t('lunaSourceNote')}</p>
              </>
            ) : (
              <div className="luna-context-empty">
                <span aria-hidden="true">✧</span>
                <p>{t('lunaNoCheckIns')}</p>
              </div>
            )}
          </section>

          <section className="luna-privacy-card hc-spotlight-card">
            <span className="luna-privacy-icon" aria-hidden="true">
              <FiShield />
            </span>
            <div>
              <strong>{t('lunaChatLocalHeading')}</strong>
              <p>{aiConsent ? t('lunaConversationLocal') : t('lunaLocalOnlyDetail')}</p>
            </div>
            {aiConsent ? (
              <button type="button" className="luna-revoke-consent" onClick={turnOffAiChat}>
                {t('lunaDisableAi')}
              </button>
            ) : aiPreference === 'no' ? (
              <button type="button" className="luna-revoke-consent" onClick={allowAiChat}>
                {t('lunaEnableAi')}
              </button>
            ) : (
              <span className="luna-privacy-status">{t('lunaLocalOnlyStatus')}</span>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default LunaChat
