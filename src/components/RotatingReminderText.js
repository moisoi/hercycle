import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { REMINDER_ROTATION_MS } from '../lib/reminders'

/**
 * Positive, feminine rotating reminder copy with intrinsic fixed-footprint sizing.
 * Places the active message AND invisible sizers for every other candidate message
 * into the exact same single CSS Grid cell (grid-area: 1 / 1). The union of all
 * items in cell (1, 1) is always the full message set — locking exact intrinsic
 * card height across short and long messages with zero layout shift and zero
 * duplicate text nodes in the DOM.
 */
export default function RotatingReminderText({
  as = 'p',
  messages = [],
  intervalMs = REMINDER_ROTATION_MS,
  className = '',
}) {
  const safeMessages = Array.isArray(messages) && messages.length > 0 ? messages : ['']
  const [index, setIndex] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    setIndex((prev) => (prev < safeMessages.length ? prev : 0))
  }, [safeMessages.length])

  useEffect(() => {
    if (safeMessages.length <= 1) return undefined

    const fadeOutDurationMs = Math.min(520, Math.floor(intervalMs * 0.14))
    let swapTimeoutId = null
    let nextTickTimeoutId = null
    let cancelled = false

    const scheduleCycle = () => {
      nextTickTimeoutId = window.setTimeout(() => {
        if (cancelled) return
        setFadingOut(true)
        swapTimeoutId = window.setTimeout(() => {
          if (cancelled) return
          setIndex((current) => (current + 1) % safeMessages.length)
          setFadingOut(false)
          scheduleCycle()
        }, fadeOutDurationMs)
      }, Math.max(400, intervalMs - fadeOutDurationMs))
    }

    // Intentionally never attached to pointer/hover handlers so reminders never pause on hover
    scheduleCycle()

    return () => {
      cancelled = true
      if (nextTickTimeoutId) window.clearTimeout(nextTickTimeoutId)
      if (swapTimeoutId) window.clearTimeout(swapTimeoutId)
    }
  }, [intervalMs, safeMessages.length])

  const activeIdx = index % safeMessages.length
  const currentCopy = safeMessages[activeIdx] || ''
  const WrapperTag = as === 'strong' ? 'span' : 'div'
  const StaticTag = as === 'strong' ? 'strong' : 'p'
  const MotionTag = as === 'strong' ? motion.strong : motion.p

  return (
    <WrapperTag className="hc-rotating-reminder-slot">
      {safeMessages.map((msg, sIdx) =>
        sIdx === activeIdx ? null : (
          <StaticTag
            key={`sizer-${sIdx}`}
            className={`hc-rotating-reminder-sizer ${className}`.trim()}
            aria-hidden="true"
          >
            {msg}
          </StaticTag>
        )
      )}
      <MotionTag
        key={`${activeIdx}-${currentCopy.slice(0, 24)}`}
        className={`hc-rotating-reminder-copy ${className}${fadingOut ? ' is-fading-out' : ''}`.trim()}
        initial={{ opacity: 0, y: 4 }}
        animate={{
          opacity: fadingOut ? 0 : 1,
          y: fadingOut ? -3 : 0,
        }}
        transition={{
          duration: fadingOut ? 0.46 : 0.56,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {currentCopy}
      </MotionTag>
    </WrapperTag>
  )
}
