import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiAtSign,
  FiCamera,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiHeart,
  FiLock,
  FiMail,
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiSend,
  FiShare2,
  FiShield,
  FiZap,
} from 'react-icons/fi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import BotanicalMoodLayer from '../components/BotanicalMoodLayer'
import IntimacyMenu from '../components/IntimacyMenu'
import { PrivacyShieldEmblem } from '../components/SplashScreen'
import {
  buildPartnerHandoffLinks,
  copyDraftSynchronously,
  launchMobileAwareSocialHandoff,
  validatePartnerEmail,
  validatePartnerSms,
  validateWhatsappPlus251,
} from '../lib/account'
import {
  loadUserCycles,
  loadUserIntimacy,
  saveIntimacyEntry,
} from '../lib/care'
import {
  INTIMACY_MOTION_TOKENS,
  describeDesireState,
  deriveIntimacySuggestionContext,
  nextCoordinatedEffect,
  resolveAuraOrigin,
  useReducedMotionPreference,
} from '../lib/intimacyMotion'
import { recordJourneyActivity } from '../lib/journey'
import { readSharedThread, writeSharedThread } from '../lib/luna'
import { localDateString } from '../lib/period'

const signals = [
  { key: 'green', icon: '✿' },
  { key: 'yellow', icon: '☼' },
  { key: 'red', icon: '♡' },
]

const comfortValues = [0, 1, 2, 3, 4, 5]
const terms = ['romantic', 'sensual', 'sexual', 'spontaneous']
const vibes = ['tender', 'playful', 'naughty']

// Exact channel order: Instagram -> Telegram -> Snapchat -> WhatsApp -> Email -> SMS
const HANDOFF_CHANNELS = [
  { id: 'instagram', labelKey: 'channelInstagram', hintKey: 'channelHintInstagram', icon: FiCamera },
  { id: 'telegram', labelKey: 'channelTelegram', hintKey: 'channelHintTelegram', icon: FiSend },
  { id: 'snapchat', labelKey: 'channelSnapchat', hintKey: 'channelHintSnapchat', icon: FiZap },
  { id: 'whatsapp', labelKey: 'channelWhatsapp', hintKey: 'channelHintWhatsapp', icon: FiMessageCircle },
  { id: 'email', labelKey: 'channelEmail', hintKey: 'channelHintEmail', icon: FiMail },
  { id: 'sms', labelKey: 'channelSms', hintKey: 'channelHintSms', icon: FiPhone },
]

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

// Soft botanical vector glyphs for Tender, Playful, and Naughty (zero circles, zero flames)
const VibeMinimalGlyph = ({ vibe }) => {
  if (vibe === 'tender') {
    return (
      <span className="hc-vibe-glyph hc-vibe-glyph-tender" aria-hidden="true">
        <svg viewBox="0 0 28 28" className="intimacy-vibe-icon hc-vibe-svg-icon">
          <path
            d="M14 23.4 C13.4 23.4 5.2 17.9 5.2 11.4 C5.2 8.4 7.5 6.2 10.3 6.2 C12.1 6.2 13.4 7.2 14 8.5 C14.6 7.2 15.9 6.2 17.7 6.2 C20.5 6.2 22.8 8.4 22.8 11.4 C22.8 17.9 14.6 23.4 14 23.4 Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M14 19.2 C13.7 19.2 9.4 16.1 9.4 12.6 C9.4 11 10.6 9.8 12.1 9.8 C13 9.8 13.7 10.3 14 11 C14.3 10.3 15 9.8 15.9 9.8 C17.4 9.8 18.6 11 18.6 12.6 C18.6 16.1 14.3 19.2 14 19.2 Z"
            fill="currentColor"
          />
        </svg>
      </span>
    )
  }

  if (vibe === 'playful') {
    return (
      <span className="hc-vibe-glyph hc-vibe-glyph-playful" aria-hidden="true">
        <svg viewBox="0 0 28 28" className="intimacy-vibe-icon hc-vibe-svg-icon">
          <path
            d="M14 3.6 L16.5 11.1 L24 13.6 L16.5 16.1 L14 23.6 L11.5 16.1 L4 13.6 L11.5 11.1 Z"
            fill="currentColor"
            fillOpacity="0.26"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  // Naughty: night-bloom botanical crescent & star emblem (zero flames)
  return (
    <span className="hc-vibe-glyph hc-vibe-glyph-naughty" aria-hidden="true">
      <svg viewBox="0 0 28 28" className="intimacy-vibe-icon hc-vibe-svg-icon">
        <path
          d="M18.6 5.2 C13.4 5.8 9.6 10.2 9.6 15.4 C9.6 18.6 11.1 21.3 13.4 23 C8.6 22.4 5 18.3 5 13.3 C5 8.1 9.1 4 14.3 3.8 C15.9 3.8 17.4 4.3 18.6 5.2 Z"
          fill="currentColor"
          fillOpacity="0.26"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <path
          d="M19.8 9.2 L20.9 12.1 L23.8 13.2 L20.9 14.3 L19.8 17.2 L18.7 14.3 L15.8 13.2 L18.7 12.1 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

const TermKineticIcon = ({ term, chosen }) => {
  if (term === 'romantic') {
    return (
      <span className="hc-term-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 20 20" className="hc-term-svg">
          <path
            d="M10 17.2 C9.5 17.2 3.3 13 3.3 8.1 C3.3 5.8 5.1 4.1 7.2 4.1 C8.6 4.1 9.5 4.9 10 5.9 C10.5 4.9 11.4 4.1 12.8 4.1 C14.9 4.1 16.7 5.8 16.7 8.1 C16.7 13 10.5 17.2 10 17.2 Z"
            fill={chosen ? 'currentColor' : 'none'}
            fillOpacity={chosen ? 0.9 : 0}
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  if (term === 'sensual') {
    return (
      <span className="hc-term-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 20 20" className="hc-term-svg">
          <path
            d="M13.8 3.6 C9.8 4.1 6.7 7.5 6.7 11.6 C6.7 14 7.8 16.1 9.6 17.4 C5.9 16.9 3.2 13.7 3.2 9.9 C3.2 5.9 6.3 2.7 10.3 2.5 C11.6 2.5 12.8 2.9 13.8 3.6 Z"
            fill={chosen ? 'currentColor' : 'none'}
            fillOpacity={chosen ? 0.88 : 0}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  if (term === 'sexual') {
    return (
      <span className="hc-term-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 20 20" className="hc-term-svg">
          <path
            d="M10 3.2 L12.1 7.9 L17 10 L12.1 12.1 L10 16.8 L7.9 12.1 L3 10 L7.9 7.9 Z"
            fill={chosen ? 'currentColor' : 'none'}
            fillOpacity={chosen ? 0.88 : 0}
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  return (
    <span className="hc-term-icon-wrap" aria-hidden="true">
      <svg viewBox="0 0 20 20" className="hc-term-svg">
        <path
          d="M10 3 C11.6 6.4 13.6 8.4 17 10 C13.6 11.6 11.6 13.6 10 17 C8.4 13.6 6.4 11.6 3 10 C6.4 8.4 8.4 6.4 10 3 Z"
          fill={chosen ? 'currentColor' : 'none'}
          fillOpacity={chosen ? 0.9 : 0}
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

const copyDraftToClipboard = async (text) => {
  if (!text) return false
  const syncCopied = copyDraftSynchronously(text)
  if (syncCopied) return true
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    return false
  } catch {
    return false
  }
}

const readPendingIntimacy = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem('hercycle.pendingIntimacy') || 'null')
  } catch {
    return null
  }
}

const Intimacy = ({ session }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'
  const reduceMotion = useReducedMotionPreference()

  // Genuine user selections & persisted domain state (strictly separated from motion state)
  const [initialDraft] = useState(readPendingIntimacy)
  const [signal, setSignal] = useState(initialDraft?.traffic_light || 'green')
  const [comfort, setComfort] = useState(
    initialDraft?.intimacy_level !== undefined ? Number(initialDraft.intimacy_level) : 3
  )
  const [selectedTerms, setSelectedTerms] = useState(initialDraft?.preferred_terms || ['sensual'])
  const [desire, setDesire] = useState(
    initialDraft?.libido !== undefined ? initialDraft.libido : 7
  )
  const [desireVibe, setDesireVibe] = useState(initialDraft?.desire_vibe || 'playful')
  const [triedRituals, setTriedRituals] = useState([])
  const [cyclePhase, setCyclePhase] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [saveNotice, setSaveNotice] = useState('')
  const [error, setError] = useState('')

  // Partner composer state
  const [isShareOpen, setIsShareOpen] = useState(true)
  const [activeChannel, setActiveChannel] = useState('instagram')
  const [customEditedDraft, setCustomEditedDraft] = useState(false)
  const [customEditedSubject, setCustomEditedSubject] = useState(false)
  const [partnerHandle, setPartnerHandle] = useState('')
  const [partnerPhone, setPartnerPhone] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerSubject, setPartnerSubject] = useState(() => t('intimacyShareTitle'))
  const [shareNotice, setShareNotice] = useState('')
  const [whatsappHint, setWhatsappHint] = useState(null)

  // Compass spark state & distinct per-action UI feedback
  const [promptCursor, setPromptCursor] = useState(0)
  const [isShufflingSpark, setIsShufflingSpark] = useState(false)
  const [compassFeedback, setCompassFeedback] = useState('')
  const [pendingComposerText, setPendingComposerText] = useState(null)

  // Coordinated ephemeral decorative state: ONLY ONE active control animates at a time
  const [activeEffect, setActiveEffect] = useState(null)
  const shuffleTimerRef = useRef(null)
  const shuffleBtnRef = useRef(null)
  const signalRefs = useRef({})
  const comfortRefs = useRef({})
  const vibeRefs = useRef({})
  const dragStartDesireRef = useRef(desire)
  const playfulCountRef = useRef(0)

  useEffect(
    () => () => {
      if (shuffleTimerRef.current) window.clearTimeout(shuffleTimerRef.current)
    },
    []
  )

  // Synchronize page-level mood atmosphere token cleanly on /intimacy
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    document.documentElement.setAttribute('data-intimacy-mood', desireVibe)
    return () => {
      document.documentElement.removeAttribute('data-intimacy-mood')
    }
  }, [desireVibe])

  // Derive stage prompt, partner note, and Luna prompt with Readiness > Comfort > Mood precedence
  const derivedContext = useMemo(
    () =>
      deriveIntimacySuggestionContext({
        signal,
        comfort,
        desire,
        desireVibe,
        selectedTerms,
        promptCursor,
        locale,
        t,
      }),
    [comfort, desire, desireVibe, locale, promptCursor, selectedTerms, signal, t]
  )

  const computeNoteFor = useCallback(
    (nextSignal, nextComfort, nextDesire, nextVibe, nextTerms = []) =>
      deriveIntimacySuggestionContext({
        signal: nextSignal,
        comfort: nextComfort,
        desire: nextDesire,
        desireVibe: nextVibe,
        selectedTerms: nextTerms,
        promptCursor: 0,
        locale,
        t,
      }).suggestedPartnerNote,
    [locale, t]
  )

  const [partnerMessage, setPartnerMessage] = useState(() =>
    deriveIntimacySuggestionContext({
      signal: initialDraft?.traffic_light || 'green',
      comfort:
        initialDraft?.intimacy_level !== undefined ? Number(initialDraft.intimacy_level) : 3,
      desire: initialDraft?.libido !== undefined ? initialDraft.libido : 7,
      desireVibe: initialDraft?.desire_vibe || 'playful',
      selectedTerms: initialDraft?.preferred_terms || ['sensual'],
      promptCursor: 0,
      locale,
      t,
    }).suggestedPartnerNote
  )

  // Keep unedited partner draft synced across state & EN <-> AM toggles without overwriting user edits
  useEffect(() => {
    if (!customEditedDraft) {
      setPartnerMessage(derivedContext.suggestedPartnerNote)
    }
  }, [customEditedDraft, derivedContext.suggestedPartnerNote])

  useEffect(() => {
    if (!customEditedSubject) {
      setPartnerSubject(t('intimacyShareTitle'))
    }
  }, [customEditedSubject, i18n.language, t])

  useEffect(() => {
    let isMounted = true
    const loadToday = async () => {
      setIsLoading(true)
      try {
        const [intimacyRows, cycleRows] = await Promise.all([
          loadUserIntimacy(userId),
          loadUserCycles(userId),
        ])
        if (!isMounted) return

        const todayRow = intimacyRows.find((row) => row.date === localDateString()) || intimacyRows[0]
        if (todayRow) {
          const resolvedVibe = vibes.includes(todayRow.desire_vibe)
            ? todayRow.desire_vibe
            : 'playful'
          const resolvedSignal = todayRow.traffic_light || 'green'
          const resolvedTerms = todayRow.preferred_terms || []
          const resolvedComfort = todayRow.intimacy_level ?? 0
          const resolvedDesire = todayRow.libido ?? null
          setDesire(resolvedDesire)
          setComfort(resolvedComfort)
          setSignal(resolvedSignal)
          setSelectedTerms(resolvedTerms)
          setDesireVibe(resolvedVibe)
          setTriedRituals(Array.isArray(todayRow.tried_rituals) ? todayRow.tried_rituals : [])
          setPartnerMessage(
            computeNoteFor(
              resolvedSignal,
              resolvedComfort,
              resolvedDesire,
              resolvedVibe,
              resolvedTerms
            )
          )
          setCustomEditedDraft(false)
        }
        setCyclePhase(cycleRows[0]?.phase || null)
      } catch (queryError) {
        if (isMounted) setError(queryError.message || t('errorGeneric'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadToday()
    return () => {
      isMounted = false
    }
  }, [computeNoteFor, t, userId])

  const triggerSingleEffect = useCallback(
    (source, payload = {}) => {
      setActiveEffect((prev) => nextCoordinatedEffect(prev, source, payload, reduceMotion))
    },
    [reduceMotion]
  )

  // Card 2: Accessible Readiness Radio Group — equal dignity, no-op on re-select, stops pending escalations on "red"
  const handleSelectSignal = (nextSignal) => {
    if (nextSignal === signal) return
    if (nextSignal === 'red' && shuffleTimerRef.current) {
      window.clearTimeout(shuffleTimerRef.current)
      shuffleTimerRef.current = null
      setIsShufflingSpark(false)
    }
    setSignal(nextSignal)
    setPendingComposerText(null)
    setCompassFeedback('')
    triggerSingleEffect('readiness', { signalKey: nextSignal })
    setSaveState('idle')
    setSaveNotice('')
  }

  const handleReadinessKeyDown = (event, idx) => {
    let nextIdx = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIdx = (idx + 1) % signals.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIdx = (idx - 1 + signals.length) % signals.length
    }
    if (nextIdx >= 0) {
      event.preventDefault()
      const nextKey = signals[nextIdx].key
      handleSelectSignal(nextKey)
      signalRefs.current[nextKey]?.focus?.()
    }
  }

  // Card 3: Comfort Level (0 = Skip, 1..5) — sliding indicator, equal glow across levels, zero sparkles on numbers
  const handleSelectComfort = (nextComfort) => {
    if (nextComfort === comfort) return
    setComfort(nextComfort)
    triggerSingleEffect('comfort', { comfortValue: nextComfort })
    setSaveState('idle')
    setSaveNotice('')
  }

  const handleComfortKeyDown = (event, idx) => {
    let nextIdx = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIdx = (idx + 1) % comfortValues.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIdx = (idx - 1 + comfortValues.length) % comfortValues.length
    }
    if (nextIdx >= 0) {
      event.preventDefault()
      const nextVal = comfortValues[nextIdx]
      handleSelectComfort(nextVal)
      comfortRefs.current[nextVal]?.focus?.()
    }
  }

  // Card 4: Desire Heat (0..10 slider + distinct `null` unrated Skip) — smooth drag, zero particles while dragging
  const handleDesireDragStart = () => {
    dragStartDesireRef.current = desire
  }

  const handleDesireChange = (event) => {
    const nextVal = Number(event.target.value)
    setDesire(nextVal)
    setSaveState('idle')
    setSaveNotice('')
  }

  const handleDesireCommit = () => {
    if (desire !== dragStartDesireRef.current) {
      dragStartDesireRef.current = desire
      triggerSingleEffect('desire-release', { desireValue: desire })
    }
  }

  const handleSkipDesire = () => {
    if (desire === null) return
    dragStartDesireRef.current = null
    setDesire(null)
    triggerSingleEffect('desire-skip', {})
    setSaveState('idle')
    setSaveNotice('')
  }

  // Card 5A: Expressive Mood Cards — pointer-origin clipped aura, center on keyboard, no-op on re-select, preserves drafts
  const updateVibe = (nextVibe, event) => {
    if (nextVibe === desireVibe) return
    const origin = resolveAuraOrigin(event)
    const nextPlayfulCount =
      nextVibe === 'playful' ? playfulCountRef.current + 1 : playfulCountRef.current
    if (nextVibe === 'playful') {
      playfulCountRef.current = nextPlayfulCount
    }
    setDesireVibe(nextVibe)
    setPromptCursor(0)
    setPendingComposerText(null)
    setCompassFeedback('')
    triggerSingleEffect('mood', {
      vibe: nextVibe,
      xPct: origin.xPct,
      yPct: origin.yPct,
      playfulVisitCount: nextPlayfulCount,
    })
    setShareNotice('')
    setSaveNotice('')
    setSaveState('idle')
  }

  const handleVibeKeyDown = (event, idx) => {
    let nextIdx = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIdx = (idx + 1) % vibes.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIdx = (idx - 1 + vibes.length) % vibes.length
    }
    if (nextIdx >= 0) {
      event.preventDefault()
      const nextVibe = vibes[nextIdx]
      updateVibe(nextVibe, { detail: 0 })
      vibeRefs.current[nextVibe]?.focus?.()
    }
  }

  // Card 5B: Message-direction toggles — quiet background transition, zero fauna/particles, preserves custom edits
  const toggleTerm = (term) => {
    setSaveState('idle')
    setSaveNotice('')
    setSelectedTerms((current) =>
      current.includes(term) ? current.filter((item) => item !== term) : [...current, term]
    )
  }

  // Card 1 Action A: Shuffle mood spark with brief loading state, zero layout shift, focus preserved
  const handleShuffleSpark = () => {
    if (isShufflingSpark) return
    setCompassFeedback('')
    setPendingComposerText(null)
    if (reduceMotion) {
      setPromptCursor((prev) => prev + 1)
      return
    }
    setIsShufflingSpark(true)
    if (shuffleTimerRef.current) window.clearTimeout(shuffleTimerRef.current)
    shuffleTimerRef.current = window.setTimeout(() => {
      shuffleTimerRef.current = null
      setPromptCursor((prev) => prev + 1)
      setIsShufflingSpark(false)
      triggerSingleEffect('compass-shuffle', {})
    }, INTIMACY_MOTION_TOKENS.shuffleLoadMs)
  }

  // Card 1 Action B: Load into partner composer — confirms visibly & asks Replace vs Append if custom user draft exists
  const requestLoadIntoComposer = (incomingText) => {
    const cleanIncoming = String(incomingText || '').trim()
    if (!cleanIncoming) return
    setIsShareOpen(true)

    const currentTrimmed = partnerMessage.trim()
    if (customEditedDraft && currentTrimmed && currentTrimmed !== cleanIncoming) {
      setPendingComposerText(cleanIncoming)
      setCompassFeedback('')
      return
    }

    setPartnerMessage(cleanIncoming)
    setCustomEditedDraft(true)
    setPendingComposerText(null)
    setCompassFeedback(t('compassAddedToComposer'))
  }

  const handleConfirmReplaceDraft = () => {
    if (!pendingComposerText) return
    setPartnerMessage(pendingComposerText)
    setCustomEditedDraft(true)
    setPendingComposerText(null)
    setCompassFeedback(t('compassAddedToComposer'))
  }

  const handleConfirmAppendDraft = () => {
    if (!pendingComposerText) return
    setPartnerMessage((prev) => `${prev.trim()} ${pendingComposerText}`.trim())
    setCustomEditedDraft(true)
    setPendingComposerText(null)
    setCompassFeedback(t('compassAppendedToComposer'))
  }

  // Card 1 Action C: Explore with Luna using real shared thread & respectful readiness-bounded prompt
  const askLunaAboutMood = () => {
    const existing = readSharedThread(userId, t('lunaHello'))
    writeSharedThread(userId, [
      ...existing,
      {
        id: `intimacy-seed-${Date.now()}`,
        role: 'user',
        content: derivedContext.lunaPrompt,
      },
    ])
    navigate('/luna?autostart=1')
  }

  const stagePrompt = derivedContext.stagePrompt
  const desireState = useMemo(() => describeDesireState(desire), [desire])

  const moodNuancePresets = useMemo(() => {
    const primaryNote = derivedContext.suggestedPartnerNote
    const picked = selectedTerms.length ? selectedTerms : ['romantic', 'sensual']
    return [
      {
        id: 'primary',
        label: `${t(`intimacyVibe${capitalize(desireVibe)}`)}${
          selectedTerms[0] ? ` · ${t(selectedTerms[0])}` : ''
        }`,
        text: primaryNote,
      },
      ...picked.slice(0, 2).map((termKey) => ({
        id: `nuance-${termKey}`,
        label: `+ ${t(termKey)}`,
        text: computeNoteFor(signal, comfort, desire, desireVibe, [termKey]),
      })),
    ]
  }, [comfort, computeNoteFor, derivedContext.suggestedPartnerNote, desire, desireVibe, selectedTerms, signal, t])

  const handleMarkRitualTried = async (ritualId) => {
    const nextTried = Array.from(new Set([...triedRituals, ritualId]))
    setTriedRituals(nextTried)
    recordJourneyActivity(userId, 'reflection', {
      labelEn: 'Explored an intimacy ritual',
      labelAm: 'የቅርበት ሥነ-ሥርዓት ተሞክሯል',
    })
    await saveIntimacyEntry(userId, {
      date: localDateString(),
      libido: desire,
      intimacy_level: comfort,
      traffic_light: signal,
      preferred_terms: selectedTerms,
      desire_vibe: desireVibe,
      tried_rituals: nextTried,
    }).catch(() => {})
  }

  const saveReflection = async (event) => {
    event.preventDefault()
    setError('')
    setSaveNotice('')
    setSaveState('saving')

    try {
      await saveIntimacyEntry(userId, {
        libido: desire,
        intimacy_level: comfort,
        traffic_light: signal,
        preferred_terms: selectedTerms,
        desire_vibe: desireVibe,
        tried_rituals: triedRituals,
        date: localDateString(),
      })

      recordJourneyActivity(userId, 'reflection', {
        labelEn: 'Saved private intimacy reflection',
        labelAm: 'የግል የቅርበት ማስታወሻ ተቀምጧል',
      })

      setSaveState('saved')
      setSaveNotice(t('intimacySaved'))
      try {
        window.sessionStorage.removeItem('hercycle.pendingIntimacy')
      } catch {
        // Ignore session storage errors.
      }
    } catch (saveError) {
      console.error('Unable to save private reflection:', saveError)
      setError(saveError.message || t('errorGeneric'))
      setSaveState('idle')
    }
  }

  const signInToSave = () => {
    try {
      window.sessionStorage.setItem(
        'hercycle.pendingIntimacy',
        JSON.stringify({
          libido: desire,
          intimacy_level: comfort,
          traffic_light: signal,
          preferred_terms: selectedTerms,
          desire_vibe: desireVibe,
        })
      )
    } catch {
      // Guest can still sign in cleanly.
    }
    navigate('/signin', { state: { from: '/intimacy' } })
  }

  const copyMessage = async () => {
    const text = partnerMessage.trim()
    if (!text) return
    const ok = await copyDraftToClipboard(text)
    setShareNotice(ok ? t('intimacyMessageCopied') : t('intimacyCopyUnavailable'))
  }

  const launchInstagram = () => {
    const text = partnerMessage.trim()
    if (!text) return
    const links = buildPartnerHandoffLinks({
      message: text,
      handle: partnerHandle,
      phone: partnerPhone,
      email: partnerEmail,
      subject: partnerSubject,
    })
    launchMobileAwareSocialHandoff('instagram', links, { message: text })
    setShareNotice(
      links.cleanHandle
        ? t('intimacyInstagramHandleReady', { handle: `@${links.cleanHandle}` })
        : t('intimacyInstagramReady')
    )
  }

  const launchTelegram = () => {
    const text = partnerMessage.trim()
    if (!text) return
    copyDraftSynchronously(text)
    const links = buildPartnerHandoffLinks({
      message: text,
      handle: partnerHandle,
      phone: partnerPhone,
      email: partnerEmail,
      subject: partnerSubject,
    })
    if (links.telegramHref) {
      window.open(links.telegramHref, '_blank', 'noopener,noreferrer')
      setShareNotice(t('intimacyTelegramReady'))
    }
  }

  const launchSnapchat = () => {
    const text = partnerMessage.trim()
    if (!text) return
    const links = buildPartnerHandoffLinks({
      message: text,
      handle: partnerHandle,
      phone: partnerPhone,
      email: partnerEmail,
      subject: partnerSubject,
    })
    launchMobileAwareSocialHandoff('snapchat', links, { message: text })
    setShareNotice(
      links.cleanHandle
        ? t('intimacySnapchatHandleReady', { handle: links.cleanHandle })
        : t('intimacySnapchatReady')
    )
  }

  const sendViaWhatsapp = () => {
    const text = partnerMessage.trim()
    if (!text) return
    const rawTrimmed = partnerPhone.trim()
    if (!rawTrimmed) {
      const links = buildPartnerHandoffLinks({
        message: text,
        phone: '',
        email: partnerEmail,
        subject: partnerSubject,
      })
      if (links.whatsappWebChooserHref) {
        window.open(links.whatsappWebChooserHref, '_blank', 'noopener,noreferrer')
        setShareNotice(t('intimacyWhatsappChooserReady'))
      }
      return
    }
    const check = validateWhatsappPlus251(partnerPhone)
    if (!check.valid) {
      setWhatsappHint(check.suggestion || null)
      setShareNotice(t('intimacyWhatsappInvalid'))
      return
    }
    setWhatsappHint(null)
    const links = buildPartnerHandoffLinks({
      message: text,
      phone: check.normalized,
      email: partnerEmail,
      subject: partnerSubject,
    })
    if (links.whatsappHref) {
      window.open(links.whatsappHref, '_blank', 'noopener,noreferrer')
      setShareNotice(t('intimacyWhatsappReady'))
    }
  }

  const sendViaSms = () => {
    const text = partnerMessage.trim()
    if (!text) return
    const trimmedPhone = partnerPhone.trim()
    if (trimmedPhone) {
      const check = validatePartnerSms(trimmedPhone)
      if (!check.valid) {
        setShareNotice(t('intimacyPhoneInvalid'))
        return
      }
    }
    const links = buildPartnerHandoffLinks({
      message: text,
      phone: trimmedPhone,
      email: partnerEmail,
      subject: partnerSubject,
    })
    if (links.smsHref) {
      window.location.href = links.smsHref
      setShareNotice(t('intimacySmsReady'))
    }
  }

  const sendViaEmail = (provider = 'mailto') => {
    const text = partnerMessage.trim()
    if (!text) return
    const trimmedEmail = partnerEmail.trim()
    if (trimmedEmail) {
      const emailCheck = validatePartnerEmail(trimmedEmail)
      if (!emailCheck.valid) {
        setShareNotice(t('intimacyEmailInvalid'))
        return
      }
    }
    const links = buildPartnerHandoffLinks({
      message: text,
      phone: partnerPhone,
      email: trimmedEmail,
      subject: partnerSubject || t('intimacyShareTitle'),
    })
    if (provider === 'gmail' && links.gmailHref) {
      window.open(links.gmailHref, '_blank', 'noopener,noreferrer')
      setShareNotice(t('intimacyEmailWebReady', { provider: t('webmailGmail') }))
      return
    }
    if (provider === 'outlook' && links.outlookHref) {
      window.open(links.outlookHref, '_blank', 'noopener,noreferrer')
      setShareNotice(t('intimacyEmailWebReady', { provider: t('webmailOutlook') }))
      return
    }
    if (provider === 'yahoo' && links.yahooHref) {
      window.open(links.yahooHref, '_blank', 'noopener,noreferrer')
      setShareNotice(t('intimacyEmailWebReady', { provider: t('webmailYahoo') }))
      return
    }
    if (links.emailHref) {
      window.location.href = links.emailHref
      setShareNotice(t('intimacyEmailReady'))
    }
  }

  const handlePrimaryChannelHandoff = () => {
    if (activeChannel === 'instagram') return launchInstagram()
    if (activeChannel === 'telegram') return launchTelegram()
    if (activeChannel === 'snapchat') return launchSnapchat()
    if (activeChannel === 'whatsapp') return sendViaWhatsapp()
    if (activeChannel === 'email') return sendViaEmail('mailto')
    return sendViaSms()
  }

  const shareViaSheet = async () => {
    const text = partnerMessage.trim()
    if (!text) return
    copyDraftSynchronously(text)
    try {
      if (navigator.share) {
        await navigator.share({ text })
        setShareNotice(t('intimacyShareReady'))
        return
      }
      if (activeChannel === 'instagram') {
        launchInstagram()
        return
      }
      if (activeChannel === 'snapchat') {
        launchSnapchat()
        return
      }
      await copyMessage()
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setShareNotice(t('intimacyShareUnavailable'))
    }
  }

  const activeMoodLabel = t(`intimacyVibe${capitalize(desireVibe)}`)

  return (
    <div
      className={`intimacy-page hc-vibe-aura-${desireVibe}`}
      data-active-mood={desireVibe}
    >
      {/* Restrained soft-botanical atmosphere wash (static under reduced motion) */}
      <div
        className={`hc-intimacy-page-atmosphere is-${desireVibe}`}
        data-testid="intimacy-page-atmosphere"
        aria-hidden="true"
      >
        <span className="hc-mood-aurora hc-mood-aurora-one" />
        <span className="hc-mood-aurora hc-mood-aurora-two" />
        <span className="hc-mood-aurora hc-mood-aurora-three" />
      </div>

      <motion.section
        className="intimacy-privacy-card hc-spotlight-card"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: INTIMACY_MOTION_TOKENS.ease }}
      >
        <div className="intimacy-privacy-icon">
          <FiLock aria-hidden="true" />
        </div>
        <div>
          <span className="eyebrow-label">{t('intimacyEyebrow')}</span>
          <h2>{t('intimacyTitle')}</h2>
          <p>{t('intimacyDescription')}</p>
        </div>
        <span className="intimacy-privacy-badge">
          <FiShield aria-hidden="true" /> {t('intimacyPrivateBadge')}
        </span>
      </motion.section>

      <section className="intimacy-cycle-context hc-spotlight-card">
        <span className="intimacy-cycle-context-icon" aria-hidden="true">
          <FiZap />
        </span>
        <p>
          {cyclePhase
            ? t('intimacyCycleContext', { phase: t(`phase.${cyclePhase}`) })
            : t('intimacyCycleNoContext')}
        </p>
      </section>

      {/* CARD 1: Live Tonight's Intimacy Compass — quiet live summary card */}
      <section
        className={`hc-intimacy-compass hc-compass-signal-${
          signal || 'neutral'
        } hc-compass-vibe-${desireVibe} hc-spotlight-card`}
        data-testid="intimacy-live-compass"
        aria-live="polite"
      >
        {/* Localized small decorative accent corner only (never full-card animations) */}
        <span
          className={`hc-compass-corner-accent is-${
            signal === 'red' ? 'calm' : desireVibe
          }${activeEffect?.source === 'compass-shuffle' ? ' is-shimmering' : ''}`}
          aria-hidden="true"
        />

        <div className="hc-intimacy-compass-head">
          <div className="hc-compass-title-cluster">
            <span className="eyebrow-label hc-compass-eyebrow">
              <AutoAwesomeRoundedIcon sx={{ fontSize: 14, mr: 0.6 }} />
              {t('tonightCompassEyebrow')}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`compass-label-${signal}-${desireVibe}`}
                className="hc-compass-mood-badge"
                initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                transition={{
                  duration: INTIMACY_MOTION_TOKENS.crossfadeDuration,
                  ease: INTIMACY_MOTION_TOKENS.ease,
                }}
              >
                {signal === 'red' ? t('red') : activeMoodLabel}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="hc-compass-heat-meter" data-testid="compass-heat-indicator">
            <span className="hc-compass-heat-text">
              {desireState.isUnrated
                ? t('compassHeatUnrated')
                : t('intimacyDesireRating', { value: desireState.numericValue })}
            </span>
            <span
              className={`hc-compass-heat-track${desireState.isUnrated ? ' is-unrated' : ''}`}
              aria-hidden="true"
            >
              <span
                className="hc-compass-heat-fill"
                style={{ width: `${desireState.isUnrated ? 0 : desireState.fillPct}%` }}
              />
            </span>
          </div>
        </div>

        <div className="hc-compass-stage-slot">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${signal || 'none'}-${desireVibe}-${promptCursor}-${
                derivedContext.effectiveComfort <= 2 ? 'gentle' : 'open'
              }-${locale}`}
              className={`hc-intimacy-compass-stage${isShufflingSpark ? ' is-loading' : ''}`}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: isShufflingSpark ? 0.52 : 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{
                duration: INTIMACY_MOTION_TOKENS.crossfadeDuration,
                ease: INTIMACY_MOTION_TOKENS.ease,
              }}
            >
              “{stagePrompt}”
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="hc-ritual-actions">
          <button
            ref={shuffleBtnRef}
            type="button"
            className={`partner-copy-button hc-spotlight-btn${
              isShufflingSpark ? ' is-shuffling' : ''
            }`}
            aria-busy={isShufflingSpark}
            data-testid="compass-shuffle-btn"
            onClick={handleShuffleSpark}
          >
            <ShuffleRoundedIcon sx={{ fontSize: 15 }} />
            <span>
              {isShufflingSpark ? t('compassSparkLoading') : t('moodStageSpinPrompt')}
            </span>
          </button>

          <button
            type="button"
            className="partner-copy-button hc-spotlight-btn"
            data-testid="compass-load-composer-btn"
            onClick={() => requestLoadIntoComposer(stagePrompt)}
          >
            <FiHeart aria-hidden="true" />
            <span>{t('moodStageCopyToComposer')}</span>
          </button>

          <button
            type="button"
            className="partner-copy-button hc-spotlight-btn"
            data-testid="compass-explore-luna-btn"
            onClick={askLunaAboutMood}
          >
            <FiMessageSquare aria-hidden="true" />
            <span>{t('tonightCompassAskLuna')}</span>
          </button>
        </div>

        {/* Distinct inline confirmation or Replace / Append prompt when user draft exists */}
        {pendingComposerText && (
          <div
            className="hc-compass-draft-choice"
            role="region"
            aria-label={t('moodStageCopyToComposer')}
            data-testid="compass-draft-conflict-prompt"
          >
            <p>{t('compassExistingDraftPrompt')}</p>
            <div className="hc-compass-draft-choice-btns">
              <button
                type="button"
                className="hc-account-secondary-btn"
                data-testid="compass-replace-draft-btn"
                onClick={handleConfirmReplaceDraft}
              >
                {t('compassReplaceDraft')}
              </button>
              <button
                type="button"
                className="hc-account-secondary-btn"
                data-testid="compass-append-draft-btn"
                onClick={handleConfirmAppendDraft}
              >
                {t('compassAppendDraft')}
              </button>
              <button
                type="button"
                className="hc-account-ghost-btn"
                data-testid="compass-keep-draft-btn"
                onClick={() => setPendingComposerText(null)}
              >
                {t('compassKeepDraft')}
              </button>
            </div>
          </div>
        )}

        {compassFeedback && !pendingComposerText && (
          <p className="hc-compass-added-note" role="status" data-testid="compass-added-feedback">
            <FiCheck aria-hidden="true" />
            <span>{compassFeedback}</span>
          </p>
        )}
      </section>

      <form className="intimacy-form" onSubmit={saveReflection}>
        {/* CARD 2: "How open do you feel today?" — Equal visual respect across all 3 readiness choices */}
        <section
          className="intimacy-section hc-consent-section hc-spotlight-card"
          style={{ position: 'relative' }}
          data-testid="readiness-section"
        >
          <div className="intimacy-section-heading">
            <span className="form-step-number">01</span>
            <div>
              <h3>{t('consentSignal')}</h3>
              <p>{t('intimacySignalDescription')}</p>
            </div>
          </div>

          <div
            className="consent-signal-grid"
            role="radiogroup"
            aria-label={t('consentSignal')}
          >
            {signals.map((item, idx) => {
              const isSelected = signal === item.key
              const justChosen =
                !reduceMotion &&
                activeEffect?.source === 'readiness' &&
                activeEffect?.signalKey === item.key

              return (
                <motion.button
                  ref={(el) => {
                    signalRefs.current[item.key] = el
                  }}
                  key={item.key}
                  type="button"
                  className={`consent-signal-card consent-signal-${item.key} hc-spotlight-btn${
                    isSelected ? ' is-selected' : ''
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleSelectSignal(item.key)}
                  onKeyDown={(e) => handleReadinessKeyDown(e, idx)}
                  whileTap={reduceMotion ? undefined : { scale: INTIMACY_MOTION_TOKENS.pressScale }}
                  transition={{
                    duration: INTIMACY_MOTION_TOKENS.pressDuration,
                    ease: INTIMACY_MOTION_TOKENS.ease,
                  }}
                >
                  {justChosen && (
                    <motion.span
                      key={`readiness-glow-${activeEffect.seq}`}
                      className="hc-readiness-brief-highlight"
                      aria-hidden="true"
                      initial={{ opacity: 0.65, scale: 0.86 }}
                      animate={{ opacity: 0, scale: 1.35 }}
                      transition={{ duration: 0.56, ease: INTIMACY_MOTION_TOKENS.ease }}
                    />
                  )}
                  <span className="consent-signal-symbol" aria-hidden="true">
                    {item.icon}
                  </span>
                  <strong className="consent-signal-label">{t(item.key)}</strong>
                  {isSelected && (
                    <span className="consent-signal-check" aria-hidden="true">
                      <FiCheck />
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>

          <div className="hc-consent-reflection-slot">
            <AnimatePresence mode="wait">
              {signal && (
                <motion.p
                  className={`consent-reflection consent-reflection-${signal}`}
                  key={signal}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{
                    duration: INTIMACY_MOTION_TOKENS.crossfadeDuration,
                    ease: INTIMACY_MOTION_TOKENS.ease,
                  }}
                >
                  {t(`intimacySignal_${signal}`)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* CARD 3: Comfort Level (1–5 + Skip) — smooth sliding pill indicator, zero sparkle escalation */}
        <section
          className="intimacy-section hc-comfort-section hc-spotlight-card"
          style={{ position: 'relative' }}
          data-testid="comfort-level-section"
        >
          <div className="intimacy-section-heading">
            <span className="form-step-number">02</span>
            <div>
              <h3>{t('intimacyLevel')}</h3>
              <p>{t('intimacyComfortDescription')}</p>
            </div>
          </div>

          <div className={`hc-warmth-meter${comfort === 0 ? ' is-skipped' : ''}`}>
            <div className="hc-warmth-meter-head">
              <span>{t('intimacyWarmthMeter')}</span>
              <strong>{comfort === 0 ? t('skip') : `${comfort} / 5`}</strong>
            </div>
            <div className="hc-warmth-meter-track" aria-hidden="true">
              <span style={{ width: `${comfort === 0 ? 0 : comfort * 20}%` }} />
            </div>
          </div>

          <div className="comfort-scale" role="radiogroup" aria-label={t('intimacyLevel')}>
            {comfortValues.map((value, idx) => {
              const isSelected = comfort === value
              return (
                <motion.button
                  ref={(el) => {
                    comfortRefs.current[value] = el
                  }}
                  key={value}
                  type="button"
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className={`comfort-scale-button hc-spotlight-btn${
                    isSelected ? ' is-selected' : ''
                  }${value === 0 ? ' is-skip-option' : ''}`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  aria-label={value === 0 ? t('skip') : t('comfortLevelValue', { value })}
                  onClick={() => handleSelectComfort(value)}
                  onKeyDown={(e) => handleComfortKeyDown(e, idx)}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="hc-comfort-selected-indicator"
                      className="hc-comfort-sliding-pill"
                      aria-hidden="true"
                      transition={
                        reduceMotion
                          ? { duration: 0.01 }
                          : { type: 'spring', stiffness: 430, damping: 34 }
                      }
                    />
                  )}
                  <span className="hc-comfort-btn-text">
                    {value === 0 ? t('skip') : value}
                  </span>
                </motion.button>
              )
            })}
          </div>

          <div className="hc-comfort-description-slot">
            <AnimatePresence mode="wait">
              <motion.p
                key={`comfort-tier-${comfort}-${locale}`}
                className={`hc-comfort-tier-live${comfort === 0 ? ' is-skipped' : ''}`}
                data-testid="comfort-tier-feedback"
                initial={reduceMotion ? false : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                transition={{
                  duration: INTIMACY_MOTION_TOKENS.crossfadeDuration,
                  ease: INTIMACY_MOTION_TOKENS.ease,
                }}
              >
                {t(`comfortTier_${comfort}`)}
              </motion.p>
            </AnimatePresence>
          </div>
        </section>

        {/* CARD 4: Desire Heat 0–10 Slider — smooth drag, zero drag particles, distinct Skip state */}
        <section
          className={`intimacy-section intimacy-desire-section hc-spotlight-card${
            desireState.isUnrated ? ' is-unrated' : ''
          }`}
          data-testid="desire-level-section"
          style={{
            position: 'relative',
            '--desire-fill-pct': `${desireState.fillPct}%`,
            '--ember-alpha': desireState.glowAlpha,
          }}
        >
          {!reduceMotion && activeEffect?.source === 'desire-release' && (
            <motion.span
              key={`desire-settle-${activeEffect.seq}`}
              className="hc-desire-release-sheen"
              aria-hidden="true"
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: INTIMACY_MOTION_TOKENS.ease }}
            />
          )}

          <div className="intimacy-section-heading">
            <span className="form-step-number">03</span>
            <div>
              <h3>{t('intimacyDesireTitle')}</h3>
              <p>{t('intimacyDesireDescription')}</p>
            </div>
          </div>

          <div className="intimacy-desire-topline">
            <span
              className={`hc-ember-status-pill${desireState.isUnrated ? ' is-unrated' : ''}`}
              data-testid="desire-live-readout"
            >
              {desireState.isUnrated
                ? t('desireSkippedBadge')
                : `${t('intimacyDesireRating', { value: desireState.numericValue })} · ${
                    desireState.numericValue <= 3
                      ? t('intimacyEmberLow')
                      : desireState.numericValue <= 7
                      ? t('intimacyEmberMid')
                      : t('intimacyEmberHigh')
                  }`}
            </span>
          </div>

          <input
            className={`intimacy-desire-range${desireState.isUnrated ? ' is-unrated' : ''}`}
            type="range"
            min="0"
            max="10"
            step="1"
            value={desireState.isUnrated ? 5 : desireState.numericValue}
            onPointerDown={handleDesireDragStart}
            onChange={handleDesireChange}
            onPointerUp={handleDesireCommit}
            onKeyUp={handleDesireCommit}
            aria-label={t('intimacyDesireTitle')}
            aria-valuetext={
              desireState.isUnrated
                ? t('intimacyDesireNotChecked')
                : `${desireState.numericValue} / 10`
            }
          />
          <div className="intimacy-desire-endpoints">
            <span>0 · {t('intimacyDesireLow')}</span>
            <span>10 · {t('intimacyDesireHigh')}</span>
          </div>
          <button
            type="button"
            className={`intimacy-skip-desire${desireState.isUnrated ? ' is-selected' : ''}`}
            aria-pressed={desireState.isUnrated}
            data-testid="skip-desire-btn"
            onClick={handleSkipDesire}
          >
            {desireState.isUnrated && <FiCheck aria-hidden="true" />}
            <span>{t('skipDesire')}</span>
          </button>
        </section>

        {/* CARD 5: "What kind of mood are you in?" — Tender / Playful / Naughty + Message Directions */}
        <section
          className="intimacy-section hc-vibe-section hc-spotlight-card"
          data-active-vibe={desireVibe}
          data-testid="mood-selection-section"
          style={{ position: 'relative' }}
        >
          <div className="intimacy-section-heading">
            <span className="form-step-number">04</span>
            <div>
              <h3>{t('intimacyVibeTitle')}</h3>
              <p>{t('intimacyVibeDescription')}</p>
            </div>
          </div>

          <div
            className="intimacy-vibe-grid"
            role="radiogroup"
            aria-label={t('intimacyVibeTitle')}
          >
            {vibes.map((vibe, idx) => {
              const isSelected = desireVibe === vibe

              return (
                <motion.button
                  ref={(el) => {
                    vibeRefs.current[vibe] = el
                  }}
                  type="button"
                  key={vibe}
                  whileTap={reduceMotion ? undefined : { scale: INTIMACY_MOTION_TOKENS.pressScale }}
                  transition={{
                    duration: INTIMACY_MOTION_TOKENS.pressDuration,
                    ease: INTIMACY_MOTION_TOKENS.ease,
                  }}
                  className={`intimacy-vibe-card intimacy-vibe-${vibe} hc-spotlight-btn${
                    isSelected ? ' is-selected' : ''
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  data-testid={`mood-card-${vibe}`}
                  onClick={(event) => updateVibe(vibe, event)}
                  onKeyDown={(event) => handleVibeKeyDown(event, idx)}
                >
                  {isSelected && (
                    <span
                      className={`hc-vibe-active-surface hc-vibe-active-${vibe}`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Clipped pointer-origin botanical aura & sparse motes (reference pattern) */}
                  <BotanicalMoodLayer
                    effect={activeEffect}
                    vibe={vibe}
                    reducedMotion={reduceMotion}
                  />

                  <div className="hc-vibe-card-top-row">
                    <VibeMinimalGlyph vibe={vibe} />
                    <span className={`hc-vibe-feel-pill is-${vibe}`}>
                      {isSelected ? `✦ ${t(`vibeFeel_${vibe}`)}` : t(`vibeFeel_${vibe}`)}
                    </span>
                  </div>

                  <strong className="hc-vibe-card-title">
                    {t(`intimacyVibe${capitalize(vibe)}`)}
                  </strong>
                  <small className="hc-vibe-card-desc">
                    {t(`intimacyVibe${capitalize(vibe)}Description`)}
                  </small>
                </motion.button>
              )
            })}
          </div>

          <div className="hc-nuance-subblock">
            <div className="hc-nuance-subheader">
              <span className="hc-nuance-title">{t('preferredTerms')}</span>
              <small className="hc-nuance-hint">{t('preferredTermsHint')}</small>
            </div>

            <div className="intimacy-term-list" role="group" aria-label={t('preferredTerms')}>
              {terms.map((term) => {
                const chosen = selectedTerms.includes(term)
                return (
                  <motion.button
                    type="button"
                    key={term}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={{
                      duration: INTIMACY_MOTION_TOKENS.pressDuration,
                      ease: INTIMACY_MOTION_TOKENS.ease,
                    }}
                    className={`intimacy-term intimacy-term-${term} hc-spotlight-btn${
                      chosen ? ' is-selected' : ''
                    }`}
                    aria-pressed={chosen}
                    data-testid={`direction-option-${term}`}
                    onClick={() => toggleTerm(term)}
                  >
                    <TermKineticIcon term={term} chosen={chosen} />
                    <span className="hc-term-label">{t(term)}</span>
                    {chosen && (
                      <span className="hc-term-selected-mark" aria-hidden="true">
                        <FiCheck />
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </section>

        <IntimacyMenu
          opennessSignal={signal}
          comfortLevel={comfort}
          vibe={desireVibe}
          selectedTerms={selectedTerms}
          triedIds={triedRituals}
          reduceMotion={reduceMotion}
          onMarkTried={handleMarkRitualTried}
          onUseInComposer={(ritualText) => requestLoadIntoComposer(ritualText)}
        />

        {/* USER-INITIATED PARTNER HANDOFF: Desktop & Native Mobile Deep Links + Share Sheet */}
        <motion.section
          className={`partner-spark-card hc-partner-vibe-${desireVibe} hc-spotlight-card`}
          data-active-vibe={desireVibe}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: INTIMACY_MOTION_TOKENS.ease }}
          data-testid="partner-message-studio"
        >
          <div className="partner-spark-header">
            <span className={`partner-spark-icon is-${desireVibe}`}>
              <FiHeart aria-hidden="true" />
            </span>
            <div className="hc-partner-header-copy">
              <span className="eyebrow-label">{t('intimacyPartnerEyebrow')}</span>
              <h3>{t('intimacyPartnerTitle')}</h3>
            </div>
            <button
              type="button"
              className="partner-copy-button hc-spotlight-btn"
              style={{ marginLeft: 'auto' }}
              onClick={() => setIsShareOpen((open) => !open)}
            >
              {isShareOpen ? t('intimacyPartnerHide') : t('intimacyPartnerCompose')}
            </button>
          </div>

          <div className="hc-partner-mood-sync-bar" data-testid="partner-mood-sync-bar">
            <span className={`hc-partner-active-mood-pill is-${desireVibe}`}>
              ✦ {t('partnerMoodTunedTo', { mood: activeMoodLabel })}
            </span>
            {selectedTerms.map((termKey) => (
              <span key={termKey} className={`hc-partner-nuance-tag is-${termKey}`}>
                {t(termKey)}
              </span>
            ))}
          </div>

          <p className="partner-spark-description">{t('intimacyPartnerDescription')}</p>

          {isShareOpen && (
            <div className="partner-share-editor">
              <div className="hc-partner-preset-row">
                {moodNuancePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`hc-partner-preset-chip${
                      partnerMessage.trim() === preset.text.trim() ? ' is-active' : ''
                    }`}
                    onClick={() => {
                      setPartnerMessage(preset.text)
                      setCustomEditedDraft(false)
                      setPendingComposerText(null)
                      setShareNotice('')
                    }}
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              <label className="partner-message-label" htmlFor="partner-note">
                <span>{t('intimacyPartnerMessageLabel')}</span>
                <button
                  type="button"
                  className="hc-inline-pill"
                  onClick={() => {
                    setPartnerMessage(derivedContext.suggestedPartnerNote)
                    setCustomEditedDraft(false)
                    setPendingComposerText(null)
                  }}
                >
                  {t('tonightCompassSyncDraft')}
                </button>
              </label>

              <textarea
                id="partner-note"
                rows={3}
                maxLength={600}
                value={partnerMessage}
                onChange={(event) => {
                  setPartnerMessage(event.target.value)
                  setCustomEditedDraft(true)
                  setPendingComposerText(null)
                  setShareNotice('')
                }}
              />

              <div className={`hc-partner-live-preview is-${desireVibe}`}>
                <span className="hc-partner-preview-label">{t('partnerDraftPreviewLabel')}</span>
                <p>{partnerMessage || '…'}</p>
              </div>

              {/* 6-Channel Selector: Instagram · Telegram · Snapchat · WhatsApp · Email · SMS */}
              <div className="hc-channel-picker-block">
                <div className="hc-channel-picker-header">
                  <span>{t('partnerChooseChannelLabel')}</span>
                  <small>{t(`channelHint${capitalize(activeChannel)}`)}</small>
                </div>

                <div
                  className="hc-channel-grid"
                  role="tablist"
                  aria-label={t('partnerChooseChannelLabel')}
                  data-testid="partner-channel-grid"
                >
                  {HANDOFF_CHANNELS.map(({ id, labelKey, icon: ChannelIcon }) => {
                    const selected = activeChannel === id
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        data-channel={id}
                        className={`hc-channel-card hc-channel-${id} hc-spotlight-btn${
                          selected ? ' is-selected' : ''
                        }`}
                        onClick={() => {
                          setActiveChannel(id)
                          setShareNotice('')
                        }}
                      >
                        <span className="hc-channel-icon-orb" aria-hidden="true">
                          <ChannelIcon />
                        </span>
                        <span className="hc-channel-name">{t(labelKey)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="hc-partner-contact-grid">
                <div className="hc-partner-field-col">
                  <label className="partner-phone-label" htmlFor="partner-handle">
                    <span>{t('intimacyPartnerHandleLabel')}</span>
                    <span>{t('partnerUsernameHint')} · {t('optional')}</span>
                  </label>
                  <div className="hc-input-with-icon">
                    <FiAtSign aria-hidden="true" />
                    <input
                      id="partner-handle"
                      type="text"
                      autoComplete="off"
                      placeholder={t('intimacyPartnerHandlePlaceholder')}
                      value={partnerHandle}
                      onChange={(event) => {
                        setPartnerHandle(event.target.value)
                        setShareNotice('')
                      }}
                    />
                  </div>
                </div>

                <div className="hc-partner-field-col">
                  <label className="partner-phone-label" htmlFor="partner-phone">
                    <span>{t('intimacyPartnerPhoneLabel')}</span>
                    <span>+251…</span>
                  </label>
                  <input
                    id="partner-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder={t('intimacyPartnerPhonePlaceholder')}
                    value={partnerPhone}
                    onChange={(event) => {
                      setPartnerPhone(event.target.value)
                      setWhatsappHint(null)
                      setShareNotice('')
                    }}
                  />
                  {whatsappHint && (
                    <button
                      type="button"
                      className="hc-fix-251-pill"
                      onClick={() => {
                        setPartnerPhone(whatsappHint)
                        setWhatsappHint(null)
                        setShareNotice('')
                      }}
                    >
                      {t('intimacyFixPlus251', { suggestion: whatsappHint })}
                    </button>
                  )}
                </div>
              </div>

              <div className="hc-partner-contact-grid">
                <div className="hc-partner-field-col">
                  <label className="partner-phone-label" htmlFor="partner-email">
                    <span>{t('intimacyPartnerEmailLabel')}</span>
                    <span>{t('optional')}</span>
                  </label>
                  <input
                    id="partner-email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('intimacyPartnerEmailPlaceholder')}
                    value={partnerEmail}
                    onChange={(event) => {
                      setPartnerEmail(event.target.value)
                      setShareNotice('')
                    }}
                  />
                </div>

                <div className="hc-partner-field-col">
                  <label className="partner-phone-label" htmlFor="partner-subject">
                    <span>{t('intimacyPartnerSubjectLabel')}</span>
                    <span>{t('channelEmail')}</span>
                  </label>
                  <input
                    id="partner-subject"
                    type="text"
                    maxLength={120}
                    value={partnerSubject}
                    onChange={(event) => {
                      setPartnerSubject(event.target.value)
                      setCustomEditedSubject(true)
                    }}
                  />
                </div>
              </div>

              {/* Mobile Direct App Share Ribbon for Instagram & Snapchat */}
              {(activeChannel === 'instagram' || activeChannel === 'snapchat') && (
                <div
                  className="hc-social-mobile-bar"
                  data-testid="social-mobile-handoff-bar"
                >
                  <span className="hc-social-mobile-note">
                    {t('partnerSocialMobileHint', {
                      channel: t(`channel${capitalize(activeChannel)}`),
                    })}
                  </span>
                  <button
                    type="button"
                    className="partner-copy-button hc-social-direct-share-btn hc-spotlight-btn"
                    onClick={shareViaSheet}
                    disabled={!partnerMessage.trim()}
                    data-testid={`mobile-share-${activeChannel}`}
                  >
                    <FiShare2 aria-hidden="true" />
                    <span>
                      {t('partnerDirectShareToApp', {
                        channel: t(`channel${capitalize(activeChannel)}`),
                      })}
                    </span>
                  </button>
                </div>
              )}

              {/* Webmail Sign-In Composer Strip when Email channel is selected */}
              {activeChannel === 'email' && (
                <div className="hc-email-provider-bar">
                  <span>{t('emailWebSignInPrompt')}</span>
                  <div className="hc-email-provider-pills">
                    <button
                      type="button"
                      className="partner-copy-button hc-spotlight-btn"
                      onClick={() => sendViaEmail('mailto')}
                      disabled={!partnerMessage.trim()}
                    >
                      <FiMail aria-hidden="true" /> {t('emailDefaultApp')}
                    </button>
                    <button
                      type="button"
                      className="partner-copy-button hc-spotlight-btn"
                      onClick={() => sendViaEmail('gmail')}
                      disabled={!partnerMessage.trim()}
                    >
                      <FiExternalLink aria-hidden="true" /> {t('webmailGmail')}
                    </button>
                    <button
                      type="button"
                      className="partner-copy-button hc-spotlight-btn"
                      onClick={() => sendViaEmail('outlook')}
                      disabled={!partnerMessage.trim()}
                    >
                      <FiExternalLink aria-hidden="true" /> {t('webmailOutlook')}
                    </button>
                    <button
                      type="button"
                      className="partner-copy-button hc-spotlight-btn"
                      onClick={() => sendViaEmail('yahoo')}
                      disabled={!partnerMessage.trim()}
                    >
                      <FiExternalLink aria-hidden="true" /> {t('webmailYahoo')}
                    </button>
                  </div>
                </div>
              )}

              <div className="partner-share-actions">
                <Button
                  type="button"
                  variant="contained"
                  disableElevation
                  className="form-submit-button hc-partner-primary-launch hc-spotlight-btn"
                  endIcon={<FiExternalLink aria-hidden="true" />}
                  onClick={handlePrimaryChannelHandoff}
                  disabled={!partnerMessage.trim()}
                >
                  {t('partnerOpenChannelCta', {
                    channel: t(`channel${capitalize(activeChannel)}`),
                  })}
                </Button>

                {activeChannel !== 'whatsapp' && (
                  <button
                    type="button"
                    className="partner-copy-button hc-spotlight-btn"
                    onClick={() => {
                      setActiveChannel('whatsapp')
                      sendViaWhatsapp()
                    }}
                    disabled={!partnerMessage.trim()}
                  >
                    <FiMessageCircle aria-hidden="true" /> {t('intimacyChannelWhatsapp')}
                  </button>
                )}

                {activeChannel !== 'sms' && (
                  <button
                    type="button"
                    className="partner-copy-button hc-spotlight-btn"
                    onClick={() => {
                      setActiveChannel('sms')
                      sendViaSms()
                    }}
                    disabled={!partnerMessage.trim()}
                  >
                    <FiPhone aria-hidden="true" /> {t('intimacyChannelSms')}
                  </button>
                )}

                <button
                  type="button"
                  className="partner-copy-button hc-spotlight-btn"
                  onClick={shareViaSheet}
                  disabled={!partnerMessage.trim()}
                >
                  <FiShare2 aria-hidden="true" /> {t('intimacyPartnerShare')}
                </button>

                <button
                  type="button"
                  className="partner-copy-button hc-spotlight-btn"
                  onClick={copyMessage}
                  disabled={!partnerMessage.trim()}
                >
                  <FiCopy aria-hidden="true" /> {t('intimacyPartnerCopy')}
                </button>
              </div>

              {shareNotice && (
                <p className="partner-share-notice" role="status">
                  {shareNotice}
                </p>
              )}
              <small className="partner-share-privacy">
                <FiShield aria-hidden="true" /> {t('intimacyPartnerPrivacy')}
              </small>
            </div>
          )}
        </motion.section>

        {error && <Alert severity="error">{error}</Alert>}
        {saveNotice && <Alert severity="success">{saveNotice}</Alert>}

        {!session && (
          <div className="guest-save-note intimacy-signin-note hc-spotlight-card">
            <PrivacyShieldEmblem compact />
            <span className="guest-save-copy">{t('intimacyGuestDataNote')}</span>
            <button
              type="button"
              className="hc-guest-signin-pill hc-spotlight-btn"
              onClick={signInToSave}
            >
              {t('intimacySignInToSave')}
            </button>
          </div>
        )}

        <div className="hc-page-bottom-cta" style={{ position: 'relative' }}>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            fullWidth
            disabled={isLoading || saveState === 'saving'}
            className="form-submit-button hc-spotlight-btn"
          >
            {saveState === 'saving'
              ? t('savingPrivateReflection')
              : saveState === 'saved'
              ? t('intimacySaved')
              : session
              ? t('saveIntimacy')
              : t('saveIntimacyDevice')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Intimacy
