import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CELEBRATE_EVENT, shouldCelebrate } from '../lib/celebrate'
import { getPrefs, hasMotion } from '../lib/repo'

// Timings per kind. Pieces animate transform and opacity only, and the layer never blocks clicks.
const TIMINGS = {
  burst: { duration: 1.5, count: 18, full: false },
  claim: { duration: 1.9, count: 28, full: false },
  progress: { duration: 1.5, count: 12, full: false },
  vibe: { duration: 1.8, count: 20, full: false },
  milestone: { duration: 2.6, count: 64, full: true },
  level: { duration: 2.6, count: 64, full: true },
  stage: { duration: 3.2, count: 110, full: true },
}

const PALETTE = ['#d4a3b2', '#c26c95', '#f3c6d6', '#ffe8e1', '#e9b44c', '#8fc7a8']
const MAX_BATCHES = 4

const Glyph = ({ pattern, color, size }) => {
  if (pattern === 'petal') {
    return (
      <svg width={size} height={size * 1.4} viewBox="0 0 10 14" aria-hidden="true">
        <ellipse cx="5" cy="7" rx="4" ry="6.2" fill={color} />
      </svg>
    )
  }
  if (pattern === 'drop') {
    return (
      <svg width={size} height={size * 1.2} viewBox="0 0 10 12" aria-hidden="true">
        <path d="M5 0 C7 4 9 6 9 8 A4 4 0 0 1 1 8 C1 6 3 4 5 0 Z" fill={color} />
      </svg>
    )
  }
  if (pattern === 'ember') {
    return (
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="4.5" fill={color} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 C12.8 8.2 15.8 11.2 24 12 C15.8 12.8 12.8 15.8 12 24 C11.2 15.8 8.2 12.8 0 12 C8.2 11.2 11.2 8.2 12 0 Z" fill={color} />
    </svg>
  )
}

const buildPieces = ({ count, spread, pattern, colors }) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.6
    const distance = spread * (0.45 + Math.random() * 0.55)
    return {
      id: index,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - (spread * 0.15),
      rotate: (Math.random() - 0.5) * 540,
      size: 9 + Math.random() * 11,
      color: colors[index % colors.length],
      pattern: pattern || (index % 4 === 0 ? 'petal' : index % 4 === 1 ? 'ember' : 'sparkle'),
    }
  })

/**
 * Listens for celebration events and renders short-lived pieces. Motion switch off means this
 * renders nothing. Reward kinds also respect the Settings preferences.
 */
const Celebration = () => {
  const [batches, setBatches] = useState([])
  const nextId = useRef(0)

  useEffect(() => {
    const onEvent = (event) => {
      const detail = event.detail || {}
      const kind = detail.kind || 'burst'
      const motionOn = hasMotion()
      if (!shouldCelebrate(kind, { motionOn, prefs: getPrefs() })) return

      const timing = TIMINGS[kind] || TIMINGS.burst
      const count = Math.min(detail.count || timing.count, timing.count)
      const colors = detail.color ? [detail.color, ...PALETTE] : PALETTE
      const origin = timing.full
        ? { x: window.innerWidth / 2, y: window.innerHeight * 0.4 }
        : { x: detail.x ?? window.innerWidth / 2, y: detail.y ?? window.innerHeight / 2 }
      const spread = timing.full ? Math.max(window.innerWidth, window.innerHeight) * 0.6 : 110
      const id = (nextId.current += 1)

      const batch = {
        id,
        full: timing.full,
        origin,
        duration: timing.duration,
        pieces: buildPieces({ count, spread, pattern: detail.pattern, colors }),
        flash: timing.full ? (detail.color || '#c26c95') : null,
      }
      setBatches((current) => [...current.slice(-(MAX_BATCHES - 1)), batch])
      window.setTimeout(() => {
        setBatches((current) => current.filter((item) => item.id !== id))
      }, timing.duration * 1000 + 1400)
    }

    window.addEventListener(CELEBRATE_EVENT, onEvent)
    return () => window.removeEventListener(CELEBRATE_EVENT, onEvent)
  }, [])

  return (
    <div className="celebrate-layer" aria-hidden="true">
      <AnimatePresence>
        {batches.map((batch) => (
          <React.Fragment key={batch.id}>
            {batch.flash && (
              <motion.div
                key={`flash-${batch.id}`}
                className="celebrate-flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.84, 0.59, 0.02] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, times: [0, 0.08, 0.28, 1], ease: 'easeOut' }}
                style={{ background: `radial-gradient(circle at 50% 40%, ${batch.flash}33, transparent 62%)` }}
              />
            )}
            {batch.pieces.map((piece) => (
              <motion.span
                key={`${batch.id}-${piece.id}`}
                className="celebrate-piece"
                style={{ left: batch.origin.x, top: batch.origin.y, marginLeft: -piece.size / 2, marginTop: -piece.size / 2 }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                animate={{
                  x: piece.dx,
                  y: piece.dy + (batch.full ? 40 : 0),
                  opacity: [0, 1, 0],
                  scale: [0.3, 1, 0.7],
                  rotate: piece.rotate,
                }}
                transition={{ duration: batch.duration, ease: [0.22, 1, 0.36, 1], times: [0, 0.22, 1] }}
              >
                <Glyph pattern={piece.pattern} color={piece.color} size={piece.size} />
              </motion.span>
            ))}
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Celebration
