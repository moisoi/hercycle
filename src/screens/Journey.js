import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiDroplet,
  FiLock,
  FiPause,
  FiPlay,
  FiPlus,
  FiRotateCcw,
  FiStar,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import BotanicalProgressRing from '../components/BotanicalProgressRing'
import CardBurst from '../components/CardBurst'
import { loadPreferences, loadUserCycles, savePreferences } from '../lib/care'
import {
  addPersonalReminder,
  addSelfCareNote,
  completeLearningQuiz,
  computeGardenProgress,
  computeGardenResources,
  FLEXIBLE_CADENCES,
  GARDEN_STAGES,
  JOURNAL_THEMES,
  JOURNEY_INTENTIONS,
  LEARNING_GUIDES,
  loadJourneyState,
  markGuideRead,
  MILESTONE_CATALOG,
  removePersonalReminder,
  selectCheckInCadence,
  selectJournalTheme,
  selectJourneyIntention,
  syncMilestones,
  togglePauseIntention,
} from '../lib/journey'
import { formatDisplayDate } from '../lib/period'

const resolveStageTitle = (stageObj, locale) => {
  if (!stageObj) return ''
  return locale === 'am'
    ? stageObj.amTitle || stageObj.nameAm || ''
    : stageObj.enTitle || stageObj.nameEn || ''
}

const Journey = ({ session }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const [prefs, setPrefs] = useState(() => loadPreferences())
  const [cycles, setCycles] = useState([])
  const [journeyState, setJourneyState] = useState(() => loadJourneyState(userId))
  const [activeTab, setActiveTab] = useState('intentions')
  const [openGuideId, setOpenGuideId] = useState(LEARNING_GUIDES[0]?.id || '')
  const [quizAnswers, setQuizAnswers] = useState({})
  const [noteDraft, setNoteDraft] = useState('')
  const [reminderDraft, setReminderDraft] = useState('')
  const [previewStage, setPreviewStage] = useState(null)

  // Card-scoped sparkle & fauna bursts across every interactive section (zero full-screen popups)
  const [burstKey, setBurstKey] = useState(0)
  const [metricBursts, setMetricBursts] = useState({
    days: 0,
    guides: 0,
    reminders: 0,
    milestones: 0,
  })
  const [cadenceBurst, setCadenceBurst] = useState(0)
  const [reminderBurst, setReminderBurst] = useState(0)
  const [noteBurst, setNoteBurst] = useState(0)
  const [themeBurst, setThemeBurst] = useState(0)
  const [guideBursts, setGuideBursts] = useState({})
  const [milestoneBursts, setMilestoneBursts] = useState({})

  const tabsRef = useRef(null)
  const reminderInputRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const refresh = async () => {
      try {
        const entries = await loadUserCycles(userId)
        if (!mounted) return
        setCycles(entries)
        const synced = syncMilestones(userId, entries.length)
        setJourneyState(synced.state)
      } catch {
        if (mounted) setJourneyState(loadJourneyState(userId))
      }
    }
    refresh()

    const onPrefs = () => setPrefs(loadPreferences())
    const onJourney = () => setJourneyState(loadJourneyState(userId))
    window.addEventListener('hercycle:preferences-changed', onPrefs)
    window.addEventListener('hercycle:journey-changed', onJourney)
    window.addEventListener('hercycle:data-changed', refresh)
    return () => {
      mounted = false
      window.removeEventListener('hercycle:preferences-changed', onPrefs)
      window.removeEventListener('hercycle:journey-changed', onJourney)
      window.removeEventListener('hercycle:data-changed', refresh)
    }
  }, [userId])

  const garden = useMemo(
    () => computeGardenProgress(journeyState, cycles.length),
    [cycles.length, journeyState]
  )

  const resources = useMemo(
    () => computeGardenResources(journeyState, cycles.length),
    [cycles.length, journeyState]
  )

  const fireGuideBurst = (guideId) => {
    setGuideBursts((prev) => ({ ...prev, [guideId]: (prev[guideId] || 0) + 1 }))
  }

  const fireMilestoneBurst = (milestoneId) => {
    setMilestoneBursts((prev) => ({
      ...prev,
      [milestoneId]: (prev[milestoneId] || 0) + 1,
    }))
  }

  const handleSelectIntention = (item) => {
    const isSame = journeyState.activeIntention === item.id
    const { state } = selectJourneyIntention(userId, isSame ? null : item.id)
    setJourneyState(state)
    setBurstKey((prev) => prev + 1)
  }

  const handleTogglePause = () => {
    const next = togglePauseIntention(userId)
    setJourneyState(next)
    setBurstKey((prev) => prev + 1)
  }

  const handleClearIntention = () => {
    const { state } = selectJourneyIntention(userId, null)
    setJourneyState(state)
  }

  const handleSelectCadence = (cadenceId) => {
    const next = selectCheckInCadence(userId, cadenceId)
    setJourneyState(next)
    setCadenceBurst((prev) => prev + 1)
  }

  const handleAddReminder = (event) => {
    event.preventDefault()
    if (!reminderDraft.trim()) return
    const result = addPersonalReminder(userId, reminderDraft)
    if (!result) return
    setJourneyState(result.state)
    setReminderDraft('')
    setReminderBurst((prev) => prev + 1)
  }

  const handleDeleteReminder = (reminderId) => {
    setJourneyState(removePersonalReminder(reminderId))
  }

  const handleToggleGuide = (guide) => {
    const nextOpen = openGuideId === guide.id ? '' : guide.id
    setOpenGuideId(nextOpen)
    if (nextOpen) {
      const updated = markGuideRead(guide.id, { userId, celebrate: false })
      setJourneyState(updated)
      fireGuideBurst(guide.id)
    }
  }

  const handleQuizAnswer = (guide, qIndex, optionIndex) => {
    const key = `${guide.id}:${qIndex}`
    const nextAnswers = { ...quizAnswers, [key]: optionIndex }
    setQuizAnswers(nextAnswers)

    if (optionIndex === guide.quiz[qIndex].answerIndex) {
      fireGuideBurst(guide.id)
    }

    const allCorrect = guide.quiz.every(
      (question, idx) => nextAnswers[`${guide.id}:${idx}`] === question.answerIndex
    )
    if (allCorrect) {
      const result = completeLearningQuiz(userId, guide.id)
      setJourneyState(result.state)
      fireGuideBurst(guide.id)
    }
  }

  const handleResetQuiz = (guide) => {
    setQuizAnswers((prev) => {
      const cleaned = { ...prev }
      guide.quiz.forEach((_, idx) => {
        delete cleaned[`${guide.id}:${idx}`]
      })
      return cleaned
    })
  }

  const handleSaveNote = (event) => {
    event.preventDefault()
    if (!noteDraft.trim()) return
    const result = addSelfCareNote(userId, noteDraft)
    if (!result) return
    setJourneyState(result.state)
    setNoteDraft('')
    setNoteBurst((prev) => prev + 1)
  }

  const handleSelectTheme = (theme) => {
    const { state } = selectJournalTheme(userId, theme.id)
    setJourneyState(state)
    const nextPrefs = savePreferences({ accentPalette: theme.palette || theme.accentKey })
    setPrefs(nextPrefs)
    setThemeBurst((prev) => prev + 1)
  }

  const handleReEnable = () => {
    const nextPrefs = savePreferences({ journeyEnabled: true })
    setPrefs(nextPrefs)
  }

  const jumpToTab = (tabKey, focusReminder = false) => {
    setActiveTab(tabKey)
    if (focusReminder) {
      window.setTimeout(() => {
        reminderInputRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
        reminderInputRef.current?.focus?.()
      }, 120)
    } else {
      window.setTimeout(() => {
        tabsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
      }, 80)
    }
  }

  if (prefs.journeyEnabled === false) {
    return (
      <div className="hc-journey-page" data-testid="journey-disabled-state">
        <section className="hc-journey-disabled-card hc-spotlight-card">
          <LocalFloristRoundedIcon sx={{ fontSize: 32, color: 'var(--primary)' }} />
          <h2>{t('journeyDisabledTitle')}</h2>
          <p>{t('journeyDisabledBody')}</p>
          <div className="hc-journey-disabled-actions">
            <Button
              variant="contained"
              disableElevation
              className="form-submit-button hc-spotlight-btn"
              onClick={handleReEnable}
            >
              {t('journeyEnableButton')}
            </Button>
            <Button
              variant="outlined"
              className="phase-spotlight-button hc-spotlight-btn"
              onClick={() => navigate('/settings')}
            >
              {t('settings')}
            </Button>
          </div>
        </section>
      </div>
    )
  }

  const reduceMotion = Boolean(prefs.reduceMotion)
  const unlockedCount = Object.keys(journeyState.unlockedMilestones || {}).length
  const exploredGuidesCount = Math.max(
    (journeyState.readGuideIds || []).length,
    (journeyState.completedQuizzes || []).length
  )
  const customReminderCount = (journeyState.personalReminders || []).length

  const displayedStageObj =
    previewStage !== null
      ? GARDEN_STAGES.find((st) => st.stage === previewStage) || garden.currentStage
      : garden.currentStage
  const displayedStageNum = displayedStageObj.stage
  const displayedPercent =
    previewStage !== null ? (previewStage === 5 ? 100 : previewStage * 20) : garden.progressPercent

  const navItems = [
    {
      key: 'intentions',
      label: t('journeyTabIntentions'),
      badge: customReminderCount > 0 ? `${customReminderCount}` : null,
      Icon: LocalFloristRoundedIcon,
    },
    {
      key: 'learning',
      label: t('journeyTabLearning'),
      badge: `${exploredGuidesCount}/${LEARNING_GUIDES.length}`,
      Icon: MenuBookRoundedIcon,
    },
    ...(prefs.journeyRewards !== false
      ? [
          {
            key: 'milestones',
            label: t('journeyTabMilestones'),
            badge: `${unlockedCount}/${MILESTONE_CATALOG.length}`,
            Icon: AutoAwesomeRoundedIcon,
          },
        ]
      : []),
    {
      key: 'timeline',
      label: t('journeyTabTimeline'),
      badge:
        (journeyState.timeline || []).length > 0
          ? `${(journeyState.timeline || []).length}`
          : null,
      Icon: HistoryRoundedIcon,
    },
  ]

  return (
    <div className="hc-journey-page" data-testid="journey-page">
      {/* Sanctuary Overview Hero with Upcoming Botanical Garden Canvas Card */}
      <motion.section
        className="hc-journey-hero hc-spotlight-card"
        style={{ position: 'relative' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <CardBurst burstKey={burstKey} disabled={reduceMotion} />

        <div className="hc-journey-hero-main">
          <div className="hc-journey-hero-copy">
            <div className="hc-journey-hero-topline">
              <div className="hc-journey-eyebrow-group">
                <span className="eyebrow-label hc-garden-eyebrow">
                  <LocalFloristRoundedIcon sx={{ fontSize: 13 }} />
                  {t('gardenHomeEyebrow')}
                </span>
                <span className="hc-garden-pill" data-testid="garden-seeds-counter">
                  {t('gardenSeedsResource', { count: resources.availableSeeds })}
                </span>
                <span className="hc-garden-pill hc-water-pill" data-testid="garden-water-counter">
                  <FiDroplet aria-hidden="true" />
                  {t('gardenWaterResource', { count: resources.availableWater })}
                </span>
              </div>

              <div className="hc-garden-top-controls">
                <button
                  type="button"
                  className="hc-journey-privacy-link hc-spotlight-btn"
                  onClick={() => navigate('/settings')}
                >
                  <FiLock aria-hidden="true" />
                  <span>{t('settings')}</span>
                </button>
              </div>
            </div>

            <h2>{resolveStageTitle(displayedStageObj, locale)}</h2>
            <p className="hc-journey-reassurance">
              {previewStage !== null
                ? t('gardenPreviewingStage', { stage: previewStage })
                : t('gardenNoWiltPromise')}
            </p>

            <div className="hc-journey-ring-row">
              <BotanicalProgressRing
                stage={displayedStageNum}
                progressPercent={displayedPercent}
                seeds={garden.points}
                size={84}
              />
              <div className="hc-journey-ring-meta">
                <div className="hc-garden-stage-head">
                  <strong>
                    {resolveStageTitle(garden.currentStage, locale)} · {garden.stage}/5
                  </strong>
                  <em>{garden.progressPercent}%</em>
                </div>
                <div className="hc-garden-progress-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(10, garden.progressPercent)}%` }} />
                </div>
                <span>
                  {garden.nextStage
                    ? t('gardenNextStage', {
                        name: resolveStageTitle(garden.nextStage, locale),
                        percent: garden.progressPercent,
                      })
                    : t('gardenMaxStageNote')}
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Hold Card: ONLY the garden drawing itself is queued for the next update */}
          <div className="hc-journey-hero-garden">
            <div
              className="hc-garden-upcoming-card"
              data-testid="garden-upcoming-card"
              onClick={() => setBurstKey((prev) => prev + 1)}
              role="region"
              aria-label={t('gardenUpcomingTitle')}
            >
              <span className="hc-garden-upcoming-badge">
                <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
                <span>{t('gardenUpcomingBadge')}</span>
              </span>

              <div className="hc-garden-upcoming-emblem" aria-hidden="true">
                <GiLotus />
              </div>

              <h3>{t('gardenUpcomingTitle')}</h3>
              <p>{t('gardenUpcomingBody')}</p>

              <span className="hc-garden-upcoming-saved-note">
                <FiCheck aria-hidden="true" />
                <span>{t('gardenUpcomingSavedNote')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Responsive 5-Stage Sanctuary Progression Stepper */}
        <div className="hc-stage-stepper-wrap">
          <div className="hc-stage-stepper-head">
            <span>{t('gardenStageStepHint')}</span>
            {previewStage !== null && (
              <button
                type="button"
                className="hc-stage-reset-pill"
                onClick={() => setPreviewStage(null)}
              >
                <FiRotateCcw aria-hidden="true" />
                <span>{t('gardenStageBadge', { stage: garden.stage })}</span>
              </button>
            )}
          </div>

          <div className="hc-stage-track" role="group" aria-label={t('gardenHomeEyebrow')}>
            {GARDEN_STAGES.map((st) => {
              const reached = garden.stage >= st.stage
              const active = displayedStageNum === st.stage
              return (
                <button
                  key={st.stage}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setPreviewStage(st.stage === garden.stage ? null : st.stage)
                    setBurstKey((prev) => prev + 1)
                  }}
                  className={`hc-stage-pill hc-spotlight-btn${reached ? ' is-reached' : ''}${
                    active ? ' is-active' : ''
                  }`}
                >
                  <i className="hc-stage-pill-num">
                    {reached ? <FiCheck aria-hidden="true" /> : st.stage}
                  </i>
                  <div className="hc-stage-pill-copy">
                    <small>{t('gardenStageLabel', { stage: st.stage })}</small>
                    <span>{resolveStageTitle(st, locale)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Executive 4-Card Personal Reflection Overview Strip */}
      <section className="hc-journey-summary-strip" aria-label={t('journey')}>
        <motion.button
          type="button"
          className="hc-journey-metric-card hc-metric-card-rose hc-spotlight-card"
          style={{ position: 'relative' }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setMetricBursts((prev) => ({ ...prev, days: prev.days + 1 }))
            window.setTimeout(() => navigate('/log'), 200)
          }}
        >
          <CardBurst burstKey={metricBursts.days} disabled={reduceMotion} />
          <div className="hc-metric-card-top">
            <span className="hc-metric-icon hc-metric-icon-rose" aria-hidden="true">
              <FiDroplet />
            </span>
            <FiArrowRight className="hc-metric-arrow" aria-hidden="true" />
          </div>
          <span className="hc-metric-label">{t('daysTracked')}</span>
          <strong className="hc-metric-value">{cycles.length}</strong>
          <div className="hc-metric-bar hc-metric-bar-rose" aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.max(12, cycles.length * 12))}%` }} />
          </div>
          <small className="hc-metric-sub">{t('noStreaksRequired')}</small>
        </motion.button>

        <motion.button
          type="button"
          className="hc-journey-metric-card hc-metric-card-sage hc-spotlight-card"
          style={{ position: 'relative' }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setMetricBursts((prev) => ({ ...prev, guides: prev.guides + 1 }))
            jumpToTab('learning')
          }}
        >
          <CardBurst burstKey={metricBursts.guides} disabled={reduceMotion} />
          <div className="hc-metric-card-top">
            <span className="hc-metric-icon hc-metric-icon-sage" aria-hidden="true">
              <FiBookOpen />
            </span>
            <FiArrowRight className="hc-metric-arrow" aria-hidden="true" />
          </div>
          <span className="hc-metric-label">{t('journeyStatGuides')}</span>
          <strong className="hc-metric-value">
            {exploredGuidesCount} <em>/ {LEARNING_GUIDES.length}</em>
          </strong>
          <div className="hc-metric-bar hc-metric-bar-sage" aria-hidden="true">
            <span
              style={{
                width: `${Math.max(
                  12,
                  Math.round((exploredGuidesCount / Math.max(1, LEARNING_GUIDES.length)) * 100)
                )}%`,
              }}
            />
          </div>
          <small className="hc-metric-sub">{t('journeyStatGuidesSub')}</small>
        </motion.button>

        <motion.button
          type="button"
          className="hc-journey-metric-card hc-metric-card-amber hc-spotlight-card"
          style={{ position: 'relative' }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            setMetricBursts((prev) => ({ ...prev, reminders: prev.reminders + 1 }))
            jumpToTab('intentions', true)
          }}
        >
          <CardBurst burstKey={metricBursts.reminders} disabled={reduceMotion} />
          <div className="hc-metric-card-top">
            <span className="hc-metric-icon hc-metric-icon-amber" aria-hidden="true">
              <FiBell />
            </span>
            <FiArrowRight className="hc-metric-arrow" aria-hidden="true" />
          </div>
          <span className="hc-metric-label">{t('journeyStatReminders')}</span>
          <strong className="hc-metric-value">{customReminderCount}</strong>
          <div className="hc-metric-bar hc-metric-bar-amber" aria-hidden="true">
            <span
              style={{ width: `${Math.min(100, Math.max(14, customReminderCount * 28))}%` }}
            />
          </div>
          <small className="hc-metric-sub">{t('journeyStatRemindersSub')}</small>
        </motion.button>

        {prefs.journeyRewards !== false && (
          <motion.button
            type="button"
            className="hc-journey-metric-card hc-metric-card-plum hc-spotlight-card"
            style={{ position: 'relative' }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setMetricBursts((prev) => ({ ...prev, milestones: prev.milestones + 1 }))
              jumpToTab('milestones')
            }}
          >
            <CardBurst burstKey={metricBursts.milestones} disabled={reduceMotion} />
            <div className="hc-metric-card-top">
              <span className="hc-metric-icon hc-metric-icon-plum" aria-hidden="true">
                <FiStar />
              </span>
              <FiArrowRight className="hc-metric-arrow" aria-hidden="true" />
            </div>
            <span className="hc-metric-label">{t('journeyStatMilestones')}</span>
            <strong className="hc-metric-value">
              {unlockedCount} <em>/ {MILESTONE_CATALOG.length}</em>
            </strong>
            <div className="hc-metric-bar hc-metric-bar-lilac" aria-hidden="true">
              <span
                style={{
                  width: `${Math.max(
                    12,
                    Math.round((unlockedCount / Math.max(1, MILESTONE_CATALOG.length)) * 100)
                  )}%`,
                }}
              />
            </div>
            <small className="hc-metric-sub">{t('journeyStatMilestonesSub')}</small>
          </motion.button>
        )}
      </section>

      {/* Open, Unboxed Architectural Section Navigation (zero enclosing outer pill) */}
      <nav
        className="hc-journey-tabs"
        role="tablist"
        aria-label={t('journey')}
        data-testid="journey-section-nav"
        ref={tabsRef}
      >
        {navItems.map(({ key, label, badge, Icon }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`hc-journey-tab hc-spotlight-btn${isActive ? ' is-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="hc-journey-tab-icon" aria-hidden="true">
                <Icon sx={{ fontSize: 17 }} />
              </span>
              <span className="hc-journey-tab-label">{label}</span>
              {badge ? (
                <span className="hc-journey-tab-count" aria-hidden="true">
                  {badge}
                </span>
              ) : null}
              {isActive && (
                <motion.span
                  layoutId="hc-journey-tab-accent"
                  className="hc-journey-tab-accent"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </nav>

      <AnimatePresence mode="wait">
        {/* TAB 1: Personal Intentions, Flexible Check-In Cadence & Personal Reminders */}
        {activeTab === 'intentions' && (
          <motion.section
            key="tab-intentions"
            className="hc-journey-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {journeyState.activeIntention && (
              <div className="hc-intention-controls-bar hc-spotlight-card">
                <div className="hc-intention-status-copy">
                  <span className="hc-garden-pill">
                    {journeyState.intentionPaused
                      ? t('journeyPauseIntention')
                      : t('journeyIntentionSelected')}
                  </span>
                  <strong>
                    {journeyState.intentionPaused
                      ? t('journeyIntentionPausedNote')
                      : t('journeyIntentionSelected')}
                  </strong>
                  <p>{t('gardenNoWiltPromise')}</p>
                </div>
                <div className="hc-intention-control-btns">
                  <button
                    type="button"
                    className="partner-copy-button hc-spotlight-btn"
                    onClick={handleTogglePause}
                  >
                    {journeyState.intentionPaused ? (
                      <>
                        <FiPlay aria-hidden="true" /> {t('journeyResumeIntention')}
                      </>
                    ) : (
                      <>
                        <FiPause aria-hidden="true" /> {t('journeyPauseIntention')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="hc-link-muted"
                    onClick={handleClearIntention}
                  >
                    <FiX aria-hidden="true" /> {t('journeyClearIntention')}
                  </button>
                </div>
              </div>
            )}

            <div className="hc-intentions-grid" style={{ position: 'relative' }}>
              <CardBurst burstKey={burstKey} disabled={reduceMotion} />
              {JOURNEY_INTENTIONS.map((item) => {
                const selected = journeyState.activeIntention === item.id
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.99 }}
                    className={`hc-intention-card hc-spotlight-card${
                      selected ? ' is-selected' : ''
                    }${selected && journeyState.intentionPaused ? ' is-paused' : ''}`}
                    onClick={() => handleSelectIntention(item)}
                  >
                    <div className="hc-intention-card-top">
                      <span className="hc-intention-icon" aria-hidden="true">
                        {item.code || '✦'}
                      </span>
                      {selected && (
                        <span className="hc-intention-badge">
                          <FiCheck aria-hidden="true" />
                          {journeyState.intentionPaused
                            ? t('journeyPauseIntention')
                            : t('journeyIntentionSelected')}
                        </span>
                      )}
                    </div>
                    <strong>{locale === 'am' ? item.amTitle : item.enTitle}</strong>
                    <p>{locale === 'am' ? item.amDesc : item.enDesc}</p>
                  </motion.button>
                )
              })}
            </div>

            <div className="hc-cadence-card hc-spotlight-card" style={{ position: 'relative' }}>
              <CardBurst burstKey={cadenceBurst} disabled={reduceMotion} />
              <div className="hc-journey-subheading">
                <span className="hc-section-seal">
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
                </span>
                <div>
                  <h3>{t('journeyCadenceHeading')}</h3>
                  <p>{t('journeyCadenceSub')}</p>
                </div>
              </div>

              <div className="hc-cadence-grid" role="radiogroup" aria-label={t('journeyCadenceHeading')}>
                {FLEXIBLE_CADENCES.map((cad) => {
                  const selected = (journeyState.cadenceId || 'unhurried') === cad.id
                  return (
                    <button
                      key={cad.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`hc-cadence-option hc-spotlight-btn${selected ? ' is-selected' : ''}`}
                      onClick={() => handleSelectCadence(cad.id)}
                    >
                      <div className="hc-cadence-option-top">
                        <strong>{locale === 'am' ? cad.titleAm : cad.titleEn}</strong>
                        <span className="hc-cadence-radio" aria-hidden="true">
                          {selected && <FiCheck />}
                        </span>
                      </div>
                      <small>{locale === 'am' ? cad.descAm : cad.descEn}</small>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="hc-personal-reminder-card hc-spotlight-card" style={{ position: 'relative' }}>
              <CardBurst burstKey={reminderBurst} disabled={reduceMotion} />
              <div className="hc-journey-subheading">
                <span className="hc-section-seal">
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
                </span>
                <div>
                  <h3>{t('journeyReminderHeading')}</h3>
                  <p>{t('journeyReminderSub')}</p>
                </div>
              </div>

              <form className="hc-reminder-form-row" onSubmit={handleAddReminder}>
                <input
                  ref={reminderInputRef}
                  type="text"
                  maxLength={160}
                  placeholder={t('journeyReminderPlaceholder')}
                  aria-label={t('journeyReminderHeading')}
                  value={reminderDraft}
                  onChange={(event) => setReminderDraft(event.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={!reminderDraft.trim()}
                  className="form-submit-button hc-spotlight-btn"
                  startIcon={<FiPlus aria-hidden="true" />}
                >
                  {t('journeyReminderAdd')}
                </Button>
              </form>

              {(journeyState.personalReminders || []).length > 0 && (
                <ul className="hc-personal-reminder-list">
                  {journeyState.personalReminders.map((rem) => (
                    <li key={rem.id} className="hc-personal-reminder-item">
                      <span className="hc-reminder-quote-mark" aria-hidden="true">
                        ✦
                      </span>
                      <span className="hc-reminder-item-copy">“{rem.text}”</span>
                      <button
                        type="button"
                        className="hc-reminder-delete-btn"
                        aria-label={t('remove')}
                        onClick={() => handleDeleteReminder(rem.id)}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        )}

        {/* TAB 2: Reviewed Learning Collections & Supportive Mini-Quizzes */}
        {activeTab === 'learning' && (
          <motion.section
            key="tab-learning"
            className="hc-journey-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <div className="hc-edu-boundary-banner">
              <span className="hc-edu-shield" aria-hidden="true">
                <VerifiedOutlinedIcon sx={{ fontSize: 18 }} />
              </span>
              <p>{t('journeyEduDisclaimer')}</p>
            </div>

            <div className="hc-guides-list">
              {LEARNING_GUIDES.map((guide, gIdx) => {
                const isOpen = openGuideId === guide.id
                const isDone = (journeyState.completedQuizzes || []).includes(guide.id)
                return (
                  <article
                    key={guide.id}
                    className={`hc-guide-card hc-spotlight-card${isOpen ? ' is-open' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    <CardBurst burstKey={guideBursts[guide.id] || 0} disabled={reduceMotion} />

                    <button
                      type="button"
                      className="hc-guide-header"
                      aria-expanded={isOpen}
                      onClick={() => handleToggleGuide(guide)}
                    >
                      <div className="hc-guide-title-wrap">
                        <span className="hc-guide-icon" aria-hidden="true">
                          0{gIdx + 1}
                        </span>
                        <div className="hc-guide-copy">
                          <span className="eyebrow-label">{t('journeyReviewedBadge')}</span>
                          <h3>{locale === 'am' ? guide.amTitle : guide.enTitle}</h3>
                          <p>{locale === 'am' ? guide.amSummary : guide.enSummary}</p>
                        </div>
                      </div>
                      <div className="hc-guide-status">
                        {isDone && (
                          <span className="hc-quiz-done-pill">
                            <FiCheck aria-hidden="true" />
                            {t('quizCompletedBadge')}
                          </span>
                        )}
                        <span className="hc-guide-chevron" aria-hidden="true">
                          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="hc-guide-body">
                        <ul className="hc-guide-points">
                          {(locale === 'am' ? guide.amPoints : guide.enPoints).map((pt, idx) => (
                            <li key={idx}>
                              <span className="hc-point-index" aria-hidden="true">
                                0{idx + 1}
                              </span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="hc-quiz-block">
                          <div className="hc-quiz-header-row">
                            <strong>{t('journeyQuizHeader')}</strong>
                            <button
                              type="button"
                              className="hc-link-muted"
                              onClick={() => handleResetQuiz(guide)}
                            >
                              <FiRotateCcw aria-hidden="true" /> {t('quizTryAgain')}
                            </button>
                          </div>

                          {guide.quiz.map((question, qIndex) => {
                            const selectedIdx = quizAnswers[`${guide.id}:${qIndex}`]
                            const answered = selectedIdx !== undefined
                            const isRight = selectedIdx === question.answerIndex
                            const options = locale === 'am' ? question.amOptions : question.enOptions
                            return (
                              <div key={qIndex} className="hc-quiz-question">
                                <p className="hc-quiz-prompt">
                                  {locale === 'am' ? question.amQ : question.enQ}
                                </p>
                                <div className="hc-quiz-options">
                                  {options.map((optText, oIdx) => {
                                    const chosen = selectedIdx === oIdx
                                    const stateClass = chosen
                                      ? isRight
                                        ? ' is-correct'
                                        : ' is-gentle-retry'
                                      : ''
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        className={`hc-quiz-option hc-spotlight-btn${stateClass}`}
                                        onClick={() => handleQuizAnswer(guide, qIndex, oIdx)}
                                      >
                                        <span className="hc-quiz-opt-letter" aria-hidden="true">
                                          {String.fromCharCode(65 + oIdx)}
                                        </span>
                                        <span>{optText}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                                {answered && (
                                  <p
                                    className={`hc-quiz-feedback${
                                      isRight ? ' is-correct' : ' is-retry'
                                    }`}
                                  >
                                    <strong>
                                      {isRight ? t('quizCorrectCue') : t('quizGentleRetryCue')}:
                                    </strong>{' '}
                                    {locale === 'am' ? question.amWhy : question.enWhy}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* TAB 3: Celebratory Milestones, Future-Self Notes & Personalization Studio */}
        {activeTab === 'milestones' && prefs.journeyRewards !== false && (
          <motion.section
            key="tab-milestones"
            className="hc-journey-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <div className="hc-milestones-grid">
              {MILESTONE_CATALOG.map((item) => {
                const unlockedAt = journeyState.unlockedMilestones?.[item.id]
                const isUnlocked = Boolean(unlockedAt)
                return (
                  <article
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => fireMilestoneBurst(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        fireMilestoneBurst(item.id)
                      }
                    }}
                    className={`hc-milestone-card hc-spotlight-card${
                      isUnlocked ? ' is-unlocked is-celebratable' : ' is-locked'
                    }`}
                    style={{ position: 'relative' }}
                  >
                    <CardBurst burstKey={milestoneBursts[item.id] || 0} disabled={reduceMotion} />
                    <div className="hc-milestone-top">
                      <span className="hc-milestone-icon" aria-hidden="true">
                        <FiStar />
                      </span>
                      <span className="hc-milestone-seeds">+{item.points} ✦</span>
                    </div>
                    <h3>{locale === 'am' ? item.amTitle || item.titleAm : item.enTitle || item.titleEn}</h3>
                    <p>{locale === 'am' ? item.amDesc || item.descriptionAm : item.enDesc || item.descriptionEn}</p>
                    <div className="hc-milestone-footer">
                      {isUnlocked ? (
                        <span className="hc-quiz-done-pill">
                          ✦ {formatDisplayDate(unlockedAt.slice(0, 10), locale)}
                        </span>
                      ) : (
                        <span className="hc-milestone-hint">{t('whenYouAreReady')}</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            <form
              className="hc-selfcare-note-form hc-spotlight-card"
              style={{ position: 'relative' }}
              onSubmit={handleSaveNote}
            >
              <CardBurst burstKey={noteBurst} disabled={reduceMotion} />
              <div className="hc-journey-subheading">
                <span className="hc-section-seal" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <label htmlFor="journey-self-note" className="hc-note-heading-label">
                    {t('journeyNoteLabel')}
                  </label>
                  <p>{t('gardenNoWiltPromise')}</p>
                </div>
              </div>

              <textarea
                id="journey-self-note"
                rows={3}
                maxLength={280}
                placeholder={t('journeyNotePlaceholder')}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
              />

              <div className="hc-form-action-bar">
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={!noteDraft.trim()}
                  className="form-submit-button hc-spotlight-btn"
                >
                  {t('journeyNoteSave')}
                </Button>
              </div>

              {(journeyState.personalNotes || []).length > 0 && (
                <div className="hc-saved-notes-list">
                  {journeyState.personalNotes.map((note) => (
                    <div key={note.id} className="hc-saved-note-chip">
                      <p>“{note.text}”</p>
                      <small>{formatDisplayDate((note.createdAt || '').slice(0, 10), locale)}</small>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* Personalization Studio */}
            <div className="hc-personalization-studio hc-spotlight-card" style={{ position: 'relative' }}>
              <CardBurst burstKey={themeBurst} disabled={reduceMotion} />
              <div className="hc-journey-subheading">
                <span className="hc-section-seal">
                  <PaletteOutlinedIcon sx={{ fontSize: 19 }} />
                </span>
                <div>
                  <h3>{t('journeyPersonalizeHeading')}</h3>
                  <p>{t('journeyPersonalizeSub')}</p>
                </div>
              </div>

              <div className="hc-journal-theme-grid">
                {JOURNAL_THEMES.map((theme) => {
                  const selected = (journeyState.journalTheme || 'rosewood') === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      aria-pressed={selected}
                      className={`hc-journal-theme-card hc-spotlight-btn${
                        selected ? ' is-selected' : ''
                      }`}
                      onClick={() => handleSelectTheme(theme)}
                    >
                      <span
                        className="hc-journal-theme-preview"
                        style={{ background: theme.preview || theme.surfacePreview }}
                        aria-hidden="true"
                      >
                        <i style={{ background: theme.swatch }} />
                      </span>
                      <strong>{locale === 'am' ? theme.titleAm : theme.titleEn}</strong>
                      <small>{locale === 'am' ? theme.descAm : theme.descEn}</small>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* TAB 4: Private Chronological Activity Log */}
        {activeTab === 'timeline' && (
          <motion.section
            key="tab-timeline"
            className="hc-journey-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <div className="hc-timeline-panel hc-spotlight-card">
              {(journeyState.timeline || []).length === 0 ? (
                <div className="hc-timeline-empty-state">
                  <p className="hc-timeline-empty">{t('journeyTimelineEmpty')}</p>
                  <Button
                    type="button"
                    variant="outlined"
                    className="phase-spotlight-button hc-spotlight-btn"
                    endIcon={<FiArrowRight aria-hidden="true" />}
                    onClick={() => navigate('/log')}
                  >
                    {t('logToday')}
                  </Button>
                </div>
              ) : (
                <ul className="hc-timeline-list">
                  {journeyState.timeline.map((entry) => (
                    <li key={entry.id} className="hc-timeline-item">
                      <span className="hc-timeline-dot" aria-hidden="true" />
                      <div className="hc-timeline-body">
                        <strong>
                          {locale === 'am'
                            ? entry.labelAm || entry.label
                            : entry.labelEn || entry.label}
                        </strong>
                        <small>{formatDisplayDate((entry.at || '').slice(0, 10), locale)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Journey
