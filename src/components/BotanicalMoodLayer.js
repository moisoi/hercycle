import React from 'react'
import { motion } from 'framer-motion'

import {
  INTIMACY_MOTION_TOKENS,
  getMoodSelectionArtDirection,
} from '../lib/intimacyMotion'

/**
 * Clipped, non-interactive botanical selection layer inside a mood card.
 *
 * Implements the 5-step selection choreography:
 *   1. Immediate pressed feedback is handled on the parent button (`whileTap`).
 *   2. Soft radial aura expands from `(originX%, originY%)` — pointer position or
 *      `(50%, 50%)` for keyboard activation — clipped strictly to card bounds.
 *   3. Up to 4 art-directed motes/petals drift briefly and fade out.
 *   4. For `playful` only, an occasional single delicate butterfly glides once and fades.
 *   5. Keyed by `effect.seq` so rapid clicks interrupt cleanly without stacking.
 */
export default function BotanicalMoodLayer({ effect, vibe, reducedMotion = false }) {
  const matchedVibe = effect?.vibe || effect?.target
  if (reducedMotion || !effect || effect.source !== 'mood' || matchedVibe !== vibe) {
    return null
  }

  const art = getMoodSelectionArtDirection(vibe, effect.playfulVisitCount || 1)
  const xPct = typeof effect.xPct === 'number' ? effect.xPct : 50
  const yPct = typeof effect.yPct === 'number' ? effect.yPct : 50

  return (
    <span
      key={`mood-fx-${vibe}-${effect.seq}`}
      className={`hc-botanical-mood-layer is-${vibe}`}
      data-testid={`mood-selection-fx-${vibe}`}
      style={{ '--aura-origin-x': `${xPct}%`, '--aura-origin-y': `${yPct}%` }}
      aria-hidden="true"
    >
      {/* Clipped pointer-origin radial aura */}
      <motion.span
        className={`hc-mood-pointer-aura is-${vibe}`}
        initial={{ scale: 0.22, opacity: 0.72 }}
        animate={{ scale: 2.35, opacity: 0 }}
        transition={{
          duration: art.auraDuration,
          ease: INTIMACY_MOTION_TOKENS.ease,
        }}
      />

      {/* Restrained luminous edge gleam on Naughty (zero flames, zero flashing) */}
      {art.hasLuminousEdge && (
        <motion.span
          className="hc-mood-luminous-edge"
          data-testid="naughty-luminous-edge"
          initial={{ opacity: 0.78 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.74, ease: INTIMACY_MOTION_TOKENS.ease }}
        />
      )}

      {/* Sparse botanical motes & slow petal details (capped at <= 4) */}
      {art.particles.map((item, idx) => (
        <motion.span
          key={item.id}
          className={`hc-botanical-mote is-${item.kind} is-${vibe}`}
          style={{
            left: `calc(${xPct}% + ${item.startX}px)`,
            top: `calc(${yPct}% + ${item.startY}px)`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.65, rotate: 0 }}
          animate={{
            opacity: [0, 0.85, 0],
            x: item.curveX ? [0, item.curveX, item.dx] : item.dx,
            y: item.dy,
            scale: [0.65, 1, 0.82],
            rotate: item.rot,
          }}
          transition={{
            duration: art.moteDuration,
            delay: idx * 0.045,
            ease: INTIMACY_MOTION_TOKENS.ease,
          }}
        />
      ))}

      {/* Occasional delicate butterfly accent — Playful only, single instance */}
      {art.hasButterfly && (
        <motion.span
          className="hc-mood-delicate-butterfly"
          data-testid="mood-playful-butterfly"
          style={{
            left: `calc(${xPct}% + 6px)`,
            top: `calc(${yPct}% - 4px)`,
          }}
          initial={{ opacity: 0, x: -6, y: 6, scale: 0.72, rotate: -10 }}
          animate={{
            opacity: [0, 0.88, 0.72, 0],
            x: [-6, 12, 26],
            y: [6, -14, -26],
            scale: [0.72, 0.96, 0.86],
            rotate: [-10, 8, -4],
          }}
          transition={{
            duration: INTIMACY_MOTION_TOKENS.butterflyDuration,
            ease: INTIMACY_MOTION_TOKENS.ease,
          }}
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
            <path
              d="M9.6 10.2 C6.2 4.6 1.8 5.2 2.4 9.4 C2.8 12.1 6.4 12.6 9.5 10.8 Z"
              fill="currentColor"
              fillOpacity="0.45"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M10.4 10.2 C13.8 4.6 18.2 5.2 17.6 9.4 C17.2 12.1 13.6 12.6 10.5 10.8 Z"
              fill="currentColor"
              fillOpacity="0.45"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M10 6.8 L10 14.2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </motion.span>
      )}
    </span>
  )
}
