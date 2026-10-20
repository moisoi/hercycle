import React, { useEffect, useState } from 'react'

import { FADE_IN_MS, FADE_OUT_MS, REMINDER_INTERVAL_MS, nextIndex } from '../lib/reminders'

// Rotates lines every 5 seconds: slow fade out, then fade in. It never pauses on hover or focus.
const GentleReminder = ({ lines = [] }) => {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('in')
  const count = lines.length

  useEffect(() => {
    if (count < 2) return undefined
    let inner = null
    const outer = window.setInterval(() => {
      setPhase('out')
      inner = window.setTimeout(() => {
        setIndex((current) => nextIndex(current, count))
        setPhase('in')
      }, FADE_OUT_MS)
    }, REMINDER_INTERVAL_MS)
    return () => {
      window.clearInterval(outer)
      if (inner) window.clearTimeout(inner)
    }
  }, [count])

  if (!count) return null
  const safeIndex = index % count
  return (
    <p
      className={`gentle-reminder is-${phase}`}
      style={{ '--fade-in': `${FADE_IN_MS}ms`, '--fade-out': `${FADE_OUT_MS}ms` }}
      aria-live="off"
    >
      {lines[safeIndex]}
    </p>
  )
}

export default GentleReminder
