import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { LuPause, LuPlay, LuHeart } from 'react-icons/lu'
import { REMINDER_INTERVAL_MS, buildRotation, nextIndex } from '../lib/reminders'

const asList = (value) => (Array.isArray(value) ? value : [])

/**
 * Cycles through messages every five seconds. The outgoing line fades out (600 ms), then the
 * next fades in (800 ms). Only opacity changes, so this is cheap to render.
 */
export function useRotation(messages, { paused = false } = {}) {
  const [index, setIndex] = useState(0)
  const length = messages.length

  useEffect(() => {
    if (paused || length < 2) return undefined
    const timer = window.setInterval(() => setIndex((current) => nextIndex(current, length)), REMINDER_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [paused, length])

  const safeIndex = length ? index % length : 0
  return { text: messages[safeIndex] || '', index: safeIndex }
}

const FadeText = ({ text, index, className }) => (
  <span className={`rotate-text ${className || ''}`.trim()} aria-live="off">
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  </span>
)

/** Gentle reminder card: water, meals, and positive reminders. Has a pause control. */
export const GentleReminder = ({ phase }) => {
  const { t } = useTranslation()
  const [paused, setPaused] = useState(false)

  const messages = useMemo(
    () => buildRotation({ general: asList(t('reminders.gentle', { returnObjects: true })), phaseSpecific: phase ? asList(t(`reminders.phase.${phase}`, { returnObjects: true })) : [] }),
    [t, phase]
  )
  const { text, index } = useRotation(messages, { paused })

  return (
    <section className="reminder" aria-labelledby="gentle-title">
      <div>
        <p className="card-kicker" id="gentle-title">
          {t('reminders.gentleTitle')}
        </p>
        <FadeText text={text} index={index} />
      </div>
      <button type="button" className="btn ghost spot-btn" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
        {paused ? <LuPlay aria-hidden="true" /> : <LuPause aria-hidden="true" />}
        {paused ? t('reminders.resume') : t('reminders.pause')}
      </button>
    </section>
  )
}

/** Small flirty note. It rotates on the same five-second rhythm, with no pause control. */
export const RotatingNote = () => {
  const { t } = useTranslation()
  const messages = useMemo(() => buildRotation({ general: asList(t('reminders.note', { returnObjects: true })) }), [t])
  const { text, index } = useRotation(messages)

  return (
    <div className="note-chip" role="note">
      <LuHeart aria-hidden="true" style={{ color: 'var(--menstrual)', flex: 'none' }} />
      <FadeText text={text} index={index} />
    </div>
  )
}
