import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export const GARDEN_PLOT_SPOTS = [
  { index: 0, x: 96, soilY: 207, windPeriod: 6.4, windDelay: 0 },
  { index: 1, x: 194, soilY: 201, windPeriod: 7.3, windDelay: -1.4 },
  { index: 2, x: 292, soilY: 197, windPeriod: 5.9, windDelay: -2.7 },
  { index: 3, x: 390, soilY: 197, windPeriod: 7.8, windDelay: -0.9 },
  { index: 4, x: 488, soilY: 201, windPeriod: 6.8, windDelay: -3.3 },
  { index: 5, x: 584, soilY: 207, windPeriod: 8.2, windDelay: -2.1 },
]

const SPECIES_HEIGHT = {
  rose: [0, 22, 46, 80, 102, 114],
  sunflower: [0, 24, 54, 94, 118, 134],
  tulip: [0, 20, 44, 74, 96, 110],
  daisy: [0, 19, 42, 70, 90, 102],
  lavender: [0, 18, 38, 64, 84, 98],
  orchid: [0, 18, 40, 74, 98, 114],
  iris: [0, 22, 48, 82, 104, 118],
  strelitzia: [0, 22, 48, 82, 104, 118],
}

const SPECIES_CURVE = {
  rose: -7,
  sunflower: 4,
  tulip: -3,
  daisy: 6,
  lavender: -2,
  orchid: 14,
  iris: -4,
  strelitzia: -6,
}

const clampStage = (s, max = 5) => Math.max(0, Math.min(max, Math.round(Number(s) || 0)))

/**
 * Derive fallback decorative plots if legacy props (`stage` 1..5 without explicit `plots`)
 * are passed in standalone tests. When real `plots` array is supplied, uses real persisted plots!
 */
function buildFallbackPlotsFromOverallStage(overallStage = 1) {
  const s = Math.max(1, Math.min(5, Math.round(Number(overallStage) || 1)))
  if (s === 1) {
    return [
      { id: 'f0', species: 'rose', growthStage: 1 },
      { id: 'f1', species: 'tulip', growthStage: 0 },
      { id: 'f2', species: 'daisy', growthStage: 0 },
      { id: 'f3', species: 'lavender', growthStage: 0 },
      null,
      null,
    ]
  }
  const mapStage = s === 2 ? 2 : s === 3 ? 3 : s === 4 ? 4 : 5
  return [
    { id: 'f0', species: 'rose', growthStage: mapStage },
    { id: 'f1', species: 'tulip', growthStage: Math.max(1, mapStage - (s < 5 ? 1 : 0)) },
    { id: 'f2', species: 'sunflower', growthStage: mapStage },
    { id: 'f3', species: 'daisy', growthStage: Math.max(1, mapStage - (s < 4 ? 1 : 0)) },
    { id: 'f4', species: 'orchid', growthStage: mapStage },
    { id: 'f5', species: 'iris', growthStage: Math.max(2, mapStage) },
  ]
}

/**
 * Multi-part species foliage renderer — draws genuine petioles, curved blades,
 * serrated/cordate/ensiform/linear silhouettes, and midrib/lateral venation.
 */
function SpeciesFoliage({ species, stage, x, soilY, tipX, tipY, calmMotion, windPeriod, windDelay }) {
  if (stage < 1) return null

  const swayAnim = calmMotion
    ? undefined
    : {
        rotate: [-1.1, 1.35, -0.8, -1.1],
      }

  const leafTransition = (offset = 0) => ({
    duration: windPeriod * 0.86,
    repeat: Infinity,
    ease: 'easeInOut',
    delay: windDelay - offset,
  })

  // Stage 1 universal tender cotyledons emerging from hypocotyl arch
  if (stage === 1) {
    const cy = soilY - 15
    return (
      <g>
        <motion.g
          initial={calmMotion ? false : { scale: 0.4, opacity: 0.6 }}
          animate={
            calmMotion
              ? { scale: 1, opacity: 1 }
              : { scale: 1, opacity: 1, rotate: [-1, 1.2, -1] }
          }
          transition={{ duration: 0.45, rotate: leafTransition(0.2) }}
          style={{ transformOrigin: `${x}px ${cy}px` }}
        >
          <path
            d={`M ${x} ${cy} C ${x - 7} ${cy - 8}, ${x - 16} ${cy - 6}, ${x - 17} ${cy - 1} C ${x - 13} ${cy + 4}, ${x - 5} ${cy + 3}, ${x} ${cy} Z`}
            fill="url(#sg-leaf-tender)"
            stroke="#4C7448"
            strokeWidth="0.6"
          />
          <path
            d={`M ${x - 1} ${cy} Q ${x - 9} ${cy - 2} ${x - 15} ${cy - 1}`}
            stroke="#BBD8AE"
            strokeWidth="0.65"
            fill="none"
          />
        </motion.g>
        <motion.g
          initial={calmMotion ? false : { scale: 0.4, opacity: 0.6 }}
          animate={
            calmMotion
              ? { scale: 1, opacity: 1 }
              : { scale: 1, opacity: 1, rotate: [1.1, -1.1, 1.1] }
          }
          transition={{ duration: 0.45, delay: 0.06, rotate: leafTransition(0.9) }}
          style={{ transformOrigin: `${x}px ${cy}px` }}
        >
          <path
            d={`M ${x} ${cy} C ${x + 7} ${cy - 8}, ${x + 16} ${cy - 5}, ${x + 17} ${cy} C ${x + 13} ${cy + 4}, ${x + 5} ${cy + 3}, ${x} ${cy} Z`}
            fill="url(#sg-leaf-mid)"
            stroke="#486E45"
            strokeWidth="0.6"
          />
          <path
            d={`M ${x + 1} ${cy} Q ${x + 9} ${cy - 2} ${x + 15} ${cy}`}
            stroke="#BBD8AE"
            strokeWidth="0.65"
            fill="none"
          />
        </motion.g>
      </g>
    )
  }

  const midY1 = soilY - (soilY - tipY) * 0.34
  const midY2 = soilY - (soilY - tipY) * 0.64
  const stemMidX1 = x + (tipX - x) * 0.28
  const stemMidX2 = x + (tipX - x) * 0.65

  // 1. DAMASK ROSE: Compound pinnate serrated dark-sage leaves + stipules
  if (species === 'rose') {
    const nodes =
      stage === 2
        ? [{ ax: stemMidX1, ay: midY1, dir: -1, sc: 0.84 }, { ax: stemMidX2, ay: midY2, dir: 1, sc: 0.8 }]
        : [
            { ax: stemMidX1, ay: soilY - 26, dir: -1, sc: 1 },
            { ax: stemMidX1 + 1, ay: soilY - 48, dir: 1, sc: 0.96 },
            { ax: stemMidX2, ay: soilY - 70, dir: -1, sc: 0.86 },
          ]
    return (
      <g>
        {nodes.map((n, i) => (
          <motion.g
            key={i}
            initial={calmMotion ? false : { scale: 0.45, opacity: 0.65 }}
            animate={calmMotion ? { scale: n.sc, opacity: 1 } : { scale: n.sc, opacity: 1, ...swayAnim }}
            transition={{ duration: 0.45, delay: i * 0.06, rotate: leafTransition(i * 0.7) }}
            style={{ transformOrigin: `${n.ax}px ${n.ay}px` }}
          >
            {/* Petiole */}
            <path
              d={`M ${n.ax} ${n.ay} Q ${n.ax + n.dir * 11} ${n.ay - 6} ${n.ax + n.dir * 22} ${n.ay - 9}`}
              stroke="#466B44"
              strokeWidth="1.35"
              fill="none"
              strokeLinecap="round"
            />
            {/* Terminal serrated rose leaflet */}
            <path
              d={`M ${n.ax + n.dir * 16} ${n.ay - 8}
                 C ${n.ax + n.dir * 22} ${n.ay - 15}, ${n.ax + n.dir * 31} ${n.ay - 14}, ${n.ax + n.dir * 35} ${n.ay - 9}
                 C ${n.ax + n.dir * 31} ${n.ay - 3}, ${n.ax + n.dir * 22} ${n.ay - 3}, ${n.ax + n.dir * 16} ${n.ay - 8} Z`}
              fill="url(#sg-leaf-deep)"
              stroke="#3B5D3A"
              strokeWidth="0.65"
            />
            {/* Paired lateral rose leaflets */}
            <path
              d={`M ${n.ax + n.dir * 8} ${n.ay - 5}
                 C ${n.ax + n.dir * 10} ${n.ay - 13}, ${n.ax + n.dir * 18} ${n.ay - 14}, ${n.ax + n.dir * 20} ${n.ay - 10}
                 C ${n.ax + n.dir * 16} ${n.ay - 6}, ${n.ax + n.dir * 11} ${n.ay - 4}, ${n.ax + n.dir * 8} ${n.ay - 5} Z`}
              fill="url(#sg-leaf-mid)"
            />
            <path
              d={`M ${n.ax + n.dir * 9} ${n.ay - 4}
                 C ${n.ax + n.dir * 13} ${n.ay + 2}, ${n.ax + n.dir * 20} ${n.ay + 2}, ${n.ax + n.dir * 22} ${n.ay - 2}
                 C ${n.ax + n.dir * 17} ${n.ay - 5}, ${n.ax + n.dir * 12} ${n.ay - 5}, ${n.ax + n.dir * 9} ${n.ay - 4} Z`}
              fill="url(#sg-leaf-mid)"
            />
            {/* Midrib vein */}
            <path
              d={`M ${n.ax + n.dir * 17} ${n.ay - 8} L ${n.ax + n.dir * 33} ${n.ay - 9}`}
              stroke="#A9CCA1"
              strokeWidth="0.65"
              strokeOpacity="0.85"
            />
          </motion.g>
        ))}
      </g>
    )
  }

  // 2. HEIRLOOM SUNFLOWER: Large broad heart-shaped (cordate) alternate leaves with 3 veins
  if (species === 'sunflower') {
    const nodes =
      stage === 2
        ? [{ ax: stemMidX1, ay: midY1, dir: -1, sc: 0.82 }, { ax: stemMidX2, ay: midY2, dir: 1, sc: 0.8 }]
        : [
            { ax: stemMidX1, ay: soilY - 30, dir: -1, sc: 1.05 },
            { ax: stemMidX1 + 1, ay: soilY - 56, dir: 1, sc: 1.02 },
            { ax: stemMidX2, ay: soilY - 82, dir: -1, sc: 0.88 },
            ...(stage >= 4 ? [{ ax: stemMidX2 + 1, ay: soilY - 98, dir: 1, sc: 0.76 }] : []),
          ]
    return (
      <g>
        {nodes.map((n, i) => (
          <motion.g
            key={i}
            initial={calmMotion ? false : { scale: 0.45 }}
            animate={calmMotion ? { scale: n.sc } : { scale: n.sc, ...swayAnim }}
            transition={{ duration: 0.45, rotate: leafTransition(i * 0.65) }}
            style={{ transformOrigin: `${n.ax}px ${n.ay}px` }}
          >
            <path
              d={`M ${n.ax} ${n.ay} Q ${n.ax + n.dir * 7} ${n.ay - 3} ${n.ax + n.dir * 12} ${n.ay - 4}`}
              stroke="#5A8349"
              strokeWidth="1.8"
              fill="none"
            />
            <path
              d={`M ${n.ax + n.dir * 10} ${n.ay - 4}
                 C ${n.ax + n.dir * 12} ${n.ay - 17}, ${n.ax + n.dir * 28} ${n.ay - 15}, ${n.ax + n.dir * 36} ${n.ay - 2}
                 C ${n.ax + n.dir * 26} ${n.ay + 10}, ${n.ax + n.dir * 13} ${n.ay + 7}, ${n.ax + n.dir * 10} ${n.ay - 4} Z`}
              fill="url(#sg-leaf-mid)"
              stroke="#4A7240"
              strokeWidth="0.65"
            />
            <path
              d={`M ${n.ax + n.dir * 11} ${n.ay - 4} Q ${n.ax + n.dir * 23} ${n.ay - 4} ${n.ax + n.dir * 34} ${n.ay - 2}`}
              stroke="#BFE0B2"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d={`M ${n.ax + n.dir * 16} ${n.ay - 4} Q ${n.ax + n.dir * 22} ${n.ay - 9} ${n.ax + n.dir * 27} ${n.ay - 9}`}
              stroke="#BFE0B2"
              strokeWidth="0.55"
              fill="none"
            />
          </motion.g>
        ))}
      </g>
    )
  }

  // 3. DARWIN TULIP: Broad clasping glaucous blue-green basal blades curving gracefully from bulb base
  if (species === 'tulip') {
    const scaleH = stage === 2 ? 0.62 : 1
    return (
      <g>
        <motion.g
          animate={calmMotion ? undefined : { rotate: [-0.9, 1.1, -0.9] }}
          transition={leafTransition(0.3)}
          style={{ transformOrigin: `${x}px ${soilY}px` }}
        >
          <path
            d={`M ${x - 2} ${soilY}
               C ${x - 18} ${soilY - 24 * scaleH}, ${x - 32} ${soilY - 52 * scaleH}, ${x - 24} ${soilY - 72 * scaleH}
               C ${x - 14} ${soilY - 54 * scaleH}, ${x - 6} ${soilY - 26 * scaleH}, ${x + 2} ${soilY} Z`}
            fill="url(#sg-leaf-glaucous)"
            stroke="#4B7268"
            strokeWidth="0.65"
          />
          <path
            d={`M ${x - 1} ${soilY - 4} Q ${x - 18} ${soilY - 38 * scaleH} ${x - 23} ${soilY - 68 * scaleH}`}
            stroke="#B7D7CE"
            strokeWidth="0.7"
            fill="none"
          />
        </motion.g>
        <motion.g
          animate={calmMotion ? undefined : { rotate: [1.1, -0.9, 1.1] }}
          transition={leafTransition(1.1)}
          style={{ transformOrigin: `${x}px ${soilY}px` }}
        >
          <path
            d={`M ${x - 1} ${soilY}
               C ${x + 17} ${soilY - 22 * scaleH}, ${x + 31} ${soilY - 48 * scaleH}, ${x + 23} ${soilY - 66 * scaleH}
               C ${x + 13} ${soilY - 48 * scaleH}, ${x + 5} ${soilY - 24 * scaleH}, ${x + 2} ${soilY} Z`}
            fill="url(#sg-leaf-glaucous)"
            stroke="#4B7268"
            strokeWidth="0.65"
          />
          <path
            d={`M ${x + 1} ${soilY - 4} Q ${x + 16} ${soilY - 35 * scaleH} ${x + 21} ${soilY - 62 * scaleH}`}
            stroke="#B7D7CE"
            strokeWidth="0.7"
            fill="none"
          />
        </motion.g>
      </g>
    )
  }

  // 5. ENGLISH LAVENDER: Opposite pairs of narrow silvery-sage linear leaves
  if (species === 'lavender') {
    const rows = stage === 2 ? [14, 26] : [12, 22, 33, 44]
    return (
      <g>
        {rows.map((dy, idx) => (
          <motion.g
            key={dy}
            animate={calmMotion ? undefined : { rotate: [-0.8, 0.9, -0.8] }}
            transition={leafTransition(idx * 0.4)}
            style={{ transformOrigin: `${x}px ${soilY - dy}px` }}
          >
            <path
              d={`M ${x} ${soilY - dy} Q ${x - 12} ${soilY - dy - 6} ${x - 20} ${soilY - dy - 12} Q ${x - 10} ${soilY - dy - 2} ${x} ${soilY - dy} Z`}
              fill="url(#sg-leaf-glaucous)"
            />
            <path
              d={`M ${x} ${soilY - dy} Q ${x + 12} ${soilY - dy - 6} ${x + 20} ${soilY - dy - 12} Q ${x + 10} ${soilY - dy - 2} ${x} ${soilY - dy} Z`}
              fill="url(#sg-leaf-glaucous)"
            />
          </motion.g>
        ))}
      </g>
    )
  }

  // 6. MOTH ORCHID: Glossy fleshy basal oblong leaves resting low above soil
  if (species === 'orchid') {
    const s = stage === 2 ? 0.72 : 1
    return (
      <g>
        <path
          d={`M ${x} ${soilY - 2}
             C ${x - 16 * s} ${soilY - 20 * s}, ${x - 36 * s} ${soilY - 14 * s}, ${x - 38 * s} ${soilY - 4 * s}
             C ${x - 28 * s} ${soilY + 3}, ${x - 10 * s} ${soilY + 2}, ${x} ${soilY - 2} Z`}
          fill="url(#sg-leaf-deep)"
          stroke="#335538"
          strokeWidth="0.7"
        />
        <path
          d={`M ${x} ${soilY - 2}
             C ${x + 16 * s} ${soilY - 20 * s}, ${x + 36 * s} ${soilY - 14 * s}, ${x + 38 * s} ${soilY - 4 * s}
             C ${x + 28 * s} ${soilY + 3}, ${x + 10 * s} ${soilY + 2}, ${x} ${soilY - 2} Z`}
          fill="url(#sg-leaf-deep)"
          stroke="#335538"
          strokeWidth="0.7"
        />
        <path
          d={`M ${x - 2} ${soilY - 3} Q ${x - 19 * s} ${soilY - 10 * s} ${x - 34 * s} ${soilY - 5 * s}`}
          stroke="#A8CFA5"
          strokeWidth="0.75"
          fill="none"
        />
        <path
          d={`M ${x + 2} ${soilY - 3} Q ${x + 19 * s} ${soilY - 10 * s} ${x + 34 * s} ${soilY - 5 * s}`}
          stroke="#A8CFA5"
          strokeWidth="0.75"
          fill="none"
        />
      </g>
    )
  }

  // 7. BEARDED IRIS: Sword-like ensiform fan leaves rising from rhizome base
  if (species === 'iris') {
    const h = stage === 2 ? 0.6 : 1
    return (
      <g>
        {[-26, -13, 13, 26].map((dx, idx) => (
          <motion.path
            key={dx}
            d={`M ${x - 2} ${soilY} L ${x + dx * h} ${soilY - (74 - Math.abs(dx) * 0.7) * h} L ${x + 3} ${soilY} Z`}
            fill={idx % 2 === 0 ? 'url(#sg-leaf-glaucous)' : 'url(#sg-leaf-deep)'}
            stroke="#42695E"
            strokeWidth="0.55"
            animate={calmMotion ? undefined : { rotate: idx < 2 ? [-0.7, 0.8, -0.7] : [0.8, -0.7, 0.8] }}
            transition={leafTransition(idx * 0.45)}
            style={{ transformOrigin: `${x}px ${soilY}px` }}
          />
        ))}
      </g>
    )
  }

  // 8. BIRD OF PARADISE (STRELITZIA): Long-petioled paddle tropical leaves
  if (species === 'strelitzia') {
    const h = stage === 2 ? 0.65 : 1
    return (
      <g>
        {[-1, 1].map((dir, idx) => (
          <motion.g
            key={dir}
            animate={calmMotion ? undefined : { rotate: dir < 0 ? [-0.9, 1.0, -0.9] : [1.0, -0.9, 1.0] }}
            transition={leafTransition(idx * 0.8)}
            style={{ transformOrigin: `${x}px ${soilY}px` }}
          >
            <path
              d={`M ${x} ${soilY} Q ${x + dir * 10 * h} ${soilY - 26 * h} ${x + dir * 18 * h} ${soilY - 40 * h}`}
              stroke="#426B58"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M ${x + dir * 15 * h} ${soilY - 36 * h}
                 C ${x + dir * 14 * h} ${soilY - 62 * h}, ${x + dir * 32 * h} ${soilY - 82 * h}, ${x + dir * 34 * h} ${soilY - 76 * h}
                 C ${x + dir * 36 * h} ${soilY - 56 * h}, ${x + dir * 24 * h} ${soilY - 40 * h}, ${x + dir * 15 * h} ${soilY - 36 * h} Z`}
              fill="url(#sg-leaf-glaucous)"
              stroke="#385E4E"
              strokeWidth="0.65"
            />
            <path
              d={`M ${x + dir * 16 * h} ${soilY - 38 * h} Q ${x + dir * 25 * h} ${soilY - 58 * h} ${x + dir * 33 * h} ${soilY - 75 * h}`}
              stroke="#BCE0D3"
              strokeWidth="0.8"
              fill="none"
            />
          </motion.g>
        ))}
      </g>
    )
  }

  // 4. OXEYE MEADOW DAISY: Spoon-shaped lower foliage leaves
  const dScale = stage === 2 ? 0.72 : 1
  return (
    <g>
      {[-1, 1].map((dir, i) => (
        <motion.g
          key={dir}
          animate={calmMotion ? undefined : { rotate: dir < 0 ? [-1, 1.1, -1] : [1.1, -1, 1.1] }}
          transition={leafTransition(i * 0.7)}
          style={{ transformOrigin: `${x}px ${soilY - 18}px` }}
        >
          <path
            d={`M ${x} ${soilY - 16}
               C ${x + dir * 10 * dScale} ${soilY - 24 * dScale}, ${x + dir * 26 * dScale} ${soilY - 28 * dScale}, ${x + dir * 27 * dScale} ${soilY - 20 * dScale}
               C ${x + dir * 22 * dScale} ${soilY - 12 * dScale}, ${x + dir * 9 * dScale} ${soilY - 12 * dScale}, ${x} ${soilY - 16} Z`}
            fill="url(#sg-leaf-mid)"
            stroke="#487045"
            strokeWidth="0.6"
          />
          <path
            d={`M ${x + dir * 2} ${soilY - 16} Q ${x + dir * 14 * dScale} ${soilY - 20 * dScale} ${x + dir * 24 * dScale} ${soilY - 20 * dScale}`}
            stroke="#BDE0B1"
            strokeWidth="0.65"
            fill="none"
          />
        </motion.g>
      ))}
    </g>
  )
}

/**
 * Species-authentic Stage 4 Bud & Stage 5 Layered Bloom Head.
 */
function SpeciesHead({ species, stage, tipX, tipY, calmMotion }) {
  if (stage < 4) return null

  const entryProps = calmMotion
    ? { initial: false, animate: { scale: 1, opacity: 1 } }
    : {
        initial: { scale: 0.72, opacity: 0.75 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
      }

  // STAGE 4: DISTINCT CLOSED / SWELLING BUD PER SPECIES
  if (stage === 4) {
    if (species === 'rose') {
      return (
        <motion.g
          transform={`translate(${tipX}, ${tipY})`}
          {...entryProps}
          style={{ transformOrigin: '0px 0px' }}
        >
          {/* Spiraled crimson-rose urn bud clasped by 5 pointed sepals */}
          <path d="M 0 3 C -8 -2, -9 -15, 0 -22 C 9 -15, 8 -2, 0 3 Z" fill="url(#sg-rose-inner)" />
          <path d="M -2 2 C -6 -5, -4 -14, 1 -20 C 5 -13, 4 -4, -2 2 Z" fill="url(#sg-rose-outer)" />
          <path d="M 0 4 C -9 1, -11 -8, -5 -16 C -4 -7, -2 -1, 0 4 Z" fill="#4D754A" />
          <path d="M 0 4 C 9 1, 11 -8, 5 -16 C 4 -7, 2 -1, 0 4 Z" fill="#4D754A" />
          <path d="M -4 4 Q 0 8 4 4 Z" fill="#3F633D" />
        </motion.g>
      )
    }

    if (species === 'sunflower') {
      return (
        <motion.g transform={`translate(${tipX}, ${tipY})`} {...entryProps}>
          <circle cx="0" cy="-6" r="11" fill="#638B52" />
          {[-45, -18, 12, 42].map((deg) => (
            <path
              key={deg}
              d="M -4 -2 L 0 -17 L 4 -2 Z"
              fill="#4C7341"
              transform={`rotate(${deg})`}
            />
          ))}
          <ellipse cx="0" cy="-7" rx="6.5" ry="4.5" fill="#E6AD38" />
        </motion.g>
      )
    }

    if (species === 'tulip') {
      return (
        <motion.g transform={`translate(${tipX}, ${tipY})`} {...entryProps}>
          <path d="M 0 3 C -9 -2, -8 -18, 0 -24 C 8 -18, 9 -2, 0 3 Z" fill="url(#sg-tulip-grad)" />
          <path d="M 0 3 C -6 -1, -6 -14, -2 -20 C -1 -11, 0 -4, 0 3 Z" fill="#89B17F" fillOpacity="0.58" />
        </motion.g>
      )
    }

    if (species === 'lavender') {
      return (
        <motion.g transform={`translate(${tipX}, ${tipY + 8})`} {...entryProps}>
          {[0, -6, -12, -18, -24].map((dy) => (
            <g key={dy}>
              <ellipse cx="-2.4" cy={dy} rx="2.6" ry="2" fill="#8A76B5" />
              <ellipse cx="2.4" cy={dy} rx="2.6" ry="2" fill="#7662A3" />
            </g>
          ))}
        </motion.g>
      )
    }

    if (species === 'orchid') {
      return (
        <motion.g transform={`translate(${tipX}, ${tipY})`} {...entryProps}>
          <ellipse cx="-7" cy="-4" rx="5.5" ry="6.5" fill="#F2BED9" stroke="#C478A3" strokeWidth="0.6" />
          <ellipse cx="6" cy="-11" rx="4.5" ry="5.2" fill="#F8D9EA" stroke="#C478A3" strokeWidth="0.6" />
        </motion.g>
      )
    }

    if (species === 'iris') {
      return (
        <motion.g transform={`translate(${tipX}, ${tipY})`} {...entryProps}>
          <path d="M 0 4 C -6 -4, -5 -19, 0 -26 C 5 -19, 6 -4, 0 4 Z" fill="#6872C4" />
          <path d="M -3 4 C -6 -3, -5 -12, -1 -16 L 2 4 Z" fill="#81A684" fillOpacity="0.82" />
        </motion.g>
      )
    }

    if (species === 'strelitzia') {
      return (
        <motion.g transform={`translate(${tipX - 6}, ${tipY})`} {...entryProps}>
          <path
            d="M -6 3 C 4 -4, 24 -7, 36 -11 C 25 2, 8 6, -6 3 Z"
            fill="#486E58"
            stroke="#9C4D60"
            strokeWidth="1"
          />
          <path d="M 8 -4 L 18 -15 L 15 -2 Z" fill="#F08030" />
        </motion.g>
      )
    }

    // Daisy Stage 4 button bud
    return (
      <motion.g transform={`translate(${tipX}, ${tipY})`} {...entryProps}>
        <ellipse cx="0" cy="-5" rx="7.5" ry="5.5" fill="#6A9162" />
        <ellipse cx="0" cy="-7" rx="5.5" ry="3.8" fill="#FAF7F0" />
      </motion.g>
    )
  }

  // STAGE 5: LAYERED SPECIES-SPECIFIC FULL BLOOM ARTWORK
  if (species === 'rose') {
    return (
      <motion.g transform={`translate(${tipX}, ${tipY - 2})`} {...entryProps}>
        {/* Reflexed green sepals */}
        <path d="M -12 5 Q 0 11 12 5 Q 0 7 -12 5 Z" fill="#4B7448" />
        {/* Outer cupped blush-rose guard petals */}
        {[0, 72, 144, 216, 288].map((deg) => (
          <path
            key={`o-${deg}`}
            d="M 0 0 C -13 -6, -15 -22, 0 -24 C 15 -22, 13 -6, 0 0 Z"
            fill="url(#sg-rose-outer)"
            transform={`rotate(${deg})`}
          />
        ))}
        {/* Middle overlapping velvet damask petals */}
        {[36, 108, 180, 252, 324].map((deg) => (
          <path
            key={`m-${deg}`}
            d="M 0 0 C -10 -4, -11 -16, 0 -18 C 11 -16, 10 -4, 0 0 Z"
            fill="url(#sg-rose-inner)"
            transform={`rotate(${deg})`}
          />
        ))}
        {/* Spiraled carmine rose heart & warm golden stamens */}
        <circle cx="0" cy="-3" r="6.8" fill="#9E3156" />
        <path
          d="M -4.5 -3 C -3 -7.5, 3.5 -7.5, 4.5 -2.5 C 3 1.5, -2.5 1.5, -3 -2"
          stroke="#FBE1EA"
          strokeWidth="1.15"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="0" cy="-3" r="1.8" fill="#F2C166" />
      </motion.g>
    )
  }

  if (species === 'sunflower') {
    return (
      <motion.g transform={`translate(${tipX}, ${tipY - 4})`} {...entryProps}>
        {/* Back ring of rich ochre-amber ray florets */}
        {Array.from({ length: 12 }, (_, idx) => idx * 30 + 15).map((deg) => (
          <path
            key={`b-${deg}`}
            d="M 0 -6 C -4.2 -15, -3.5 -25, 0 -30 C 3.5 -25, 4.2 -15, 0 -6 Z"
            fill="#DC9226"
            transform={`rotate(${deg})`}
          />
        ))}
        {/* Front ring of sunlit golden-yellow ray florets */}
        {Array.from({ length: 12 }, (_, idx) => idx * 30).map((deg) => (
          <path
            key={`f-${deg}`}
            d="M 0 -5 C -4 -14, -3.2 -24, 0 -29 C 3.2 -24, 4 -14, 0 -5 Z"
            fill="url(#sg-sunflower-petal)"
            transform={`rotate(${deg})`}
          />
        ))}
        {/* Fibonacci-textured sienna seed disc */}
        <circle cx="0" cy="0" r="10.2" fill="#4A2E20" stroke="#7A4E2D" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="7.2" fill="none" stroke="#C88A3B" strokeWidth="0.8" strokeDasharray="1.6 2.2" />
        <circle cx="-2.5" cy="-2.2" r="1.1" fill="#F0BD52" />
        <circle cx="2.6" cy="-1.8" r="1.1" fill="#F0BD52" />
        <circle cx="0" cy="2.6" r="1.1" fill="#F0BD52" />
      </motion.g>
    )
  }

  if (species === 'tulip') {
    return (
      <motion.g transform={`translate(${tipX}, ${tipY})`} {...entryProps}>
        {/* Back inner tepals */}
        <path d="M -9 1 C -14 -12, -10 -25, -4 -28 C 0 -22, 0 -10, -2 1 Z" fill="#D45B49" />
        <path d="M 9 1 C 14 -12, 10 -25, 4 -28 C 0 -22, 0 -10, 2 1 Z" fill="#D45B49" />
        {/* Left & Right cupped outer tepals */}
        <path d="M -2 2 C -16 -3, -17 -20, -7 -26 C -1 -19, 1 -9, -2 2 Z" fill="url(#sg-tulip-grad)" />
        <path d="M 2 2 C 16 -3, 17 -20, 7 -26 C 1 -19, -1 -9, 2 2 Z" fill="url(#sg-tulip-grad)" />
        {/* Center front overlapping cup tepal with cream base flare */}
        <path d="M 0 3 C -9 -2, -9.5 -21, 0 -29 C 9.5 -21, 9 -2, 0 3 Z" fill="url(#sg-tulip-front)" />
        <ellipse cx="0" cy="-2" rx="3.8" ry="4.5" fill="#FFF3CF" fillOpacity="0.68" />
      </motion.g>
    )
  }

  if (species === 'lavender') {
    return (
      <motion.g transform={`translate(${tipX}, ${tipY + 14})`} {...entryProps}>
        {/* Two delicate side flower spikes + central main spike */}
        {[-11, 11].map((sx) => (
          <g key={sx} transform={`translate(${sx}, 8) rotate(${sx > 0 ? 11 : -11})`}>
            <path d="M 0 12 V -16" stroke="#62845E" strokeWidth="1.2" />
            {[0, -5, -10, -15].map((dy) => (
              <g key={dy}>
                <ellipse cx="-2.4" cy={dy} rx="3" ry="2.1" fill="#8C73BE" />
                <ellipse cx="2.4" cy={dy} rx="3" ry="2.1" fill="#A58FD4" />
              </g>
            ))}
          </g>
        ))}
        {[2, -4, -10, -16, -22, -28, -33].map((dy, idx) => (
          <g key={dy}>
            <ellipse
              cx={idx === 6 ? 0 : -3.4 + idx * 0.32}
              cy={dy}
              rx="3.7"
              ry="2.4"
              transform={`rotate(-24 ${-3.4} ${dy})`}
              fill="#7A5FB2"
            />
            {idx < 6 && (
              <ellipse
                cx={3.4 - idx * 0.32}
                cy={dy}
                rx="3.7"
                ry="2.4"
                transform={`rotate(24 3.4 ${dy})`}
                fill="#A38AD3"
              />
            )}
          </g>
        ))}
      </motion.g>
    )
  }

  if (species === 'orchid') {
    return (
      <motion.g transform={`translate(${tipX}, ${tipY - 2})`} {...entryProps}>
        {/* Secondary bloom higher on arch */}
        <g transform="translate(12, -16) scale(0.68)">
          <ellipse cx="0" cy="-9" rx="6.5" ry="9" fill="#FCE5F1" />
          <ellipse cx="-10" cy="-1" rx="9.5" ry="7" fill="#F8CDE3" />
          <ellipse cx="10" cy="-1" rx="9.5" ry="7" fill="#F8CDE3" />
          <path d="M -4 2 Q 0 9 4 2 Q 0 -2 -4 2 Z" fill="#B53874" />
        </g>
        {/* Primary Phalaenopsis moth orchid flower */}
        <ellipse cx="-6.5" cy="7" rx="5.5" ry="8.5" transform="rotate(24 -6.5 7)" fill="#F9DAE9" />
        <ellipse cx="6.5" cy="7" rx="5.5" ry="8.5" transform="rotate(-24 6.5 7)" fill="#F9DAE9" />
        <ellipse cx="0" cy="-10.5" rx="7.2" ry="9.5" fill="#FFF0F7" stroke="#E7BBD2" strokeWidth="0.6" />
        {/* Broad lateral wing petals */}
        <path d="M -2 -1 C -15 -11, -21 -2, -16 6 C -11 10, -4 5, -2 -1 Z" fill="url(#sg-orchid-wing)" />
        <path d="M 2 -1 C 15 -11, 21 -2, 16 6 C 11 10, 4 5, 2 -1 Z" fill="url(#sg-orchid-wing)" />
        {/* Sculpted three-lobed labellum lip */}
        <path d="M -5 1 C -6 8, 6 8, 5 1 C 2 -2, -2 -2, -5 1 Z" fill="#AB2F6B" />
        <circle cx="0" cy="1.2" r="2.1" fill="#F3C35A" />
      </motion.g>
    )
  }

  if (species === 'iris') {
    return (
      <motion.g transform={`translate(${tipX}, ${tipY - 2})`} {...entryProps}>
        {/* 3 Cascading deep violet-indigo falls */}
        <path d="M -2 0 C -14 2, -21 12, -15 17 C -8 18, -3 9, -2 0 Z" fill="#4A509E" />
        <path d="M 2 0 C 14 2, 21 12, 15 17 C 8 18, 3 9, 2 0 Z" fill="#4A509E" />
        <path d="M 0 1 C -8 8, -7 20, 0 22 C 7 20, 8 8, 0 1 Z" fill="#3C428C" />
        {/* Golden iris beards */}
        <path d="M 0 2 V 10" stroke="#F4C44E" strokeWidth="2.2" strokeLinecap="round" />
        {/* 3 Upright domed periwinkle-violet standards */}
        <path d="M -2 0 C -13 -7, -11 -22, -2 -24 C 2 -18, 2 -8, -2 0 Z" fill="#7D86D9" />
        <path d="M 2 0 C 13 -7, 11 -22, 2 -24 C -2 -18, -2 -8, 2 0 Z" fill="#7D86D9" />
        <path d="M 0 1 C -8 -7, -8 -24, 0 -27 C 8 -24, 8 -7, 0 1 Z" fill="#929BE6" />
      </motion.g>
    )
  }

  if (species === 'strelitzia') {
    return (
      <motion.g transform={`translate(${tipX - 8}, ${tipY + 2})`} {...entryProps}>
        {/* Pointed blazing orange sepals rising in avian crest */}
        <path d="M 2 -3 L 9 -32 L 13 -5 Z" fill="#F26E22" />
        <path d="M 8 -4 L 22 -30 L 19 -5 Z" fill="#FA8B28" />
        <path d="M 13 -5 L 32 -23 L 24 -5 Z" fill="#F26E22" />
        {/* Cobalt-blue arrow petals */}
        <path d="M 9 -4 L 25 -17 L 20 -9 L 13 -4 Z" fill="#2B50AA" />
        <path d="M 14 -5 L 31 -12 L 24 -7 Z" fill="#3964C4" />
        {/* Boat-shaped green-and-crimson spathe bract */}
        <path
          d="M -8 4 C 3 -4, 24 -7, 40 -11 C 28 3, 9 7, -8 4 Z"
          fill="#436A53"
          stroke="#A63E58"
          strokeWidth="1.2"
        />
      </motion.g>
    )
  }

  // 4. OXEYE MEADOW DAISY: Double ring of crisp white ligulate petals + golden pollen dome
  return (
    <motion.g transform={`translate(${tipX}, ${tipY - 3})`} {...entryProps}>
      {Array.from({ length: 12 }, (_, idx) => idx * 30).map((deg) => (
        <ellipse
          key={deg}
          cx="0"
          cy="-12.5"
          rx="3.3"
          ry="8.4"
          fill="#FFFDF9"
          stroke="#E6DDD3"
          strokeWidth="0.55"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx="0" cy="0" r="6.4" fill="#E8AE42" stroke="#C88B28" strokeWidth="0.8" />
      <circle cx="-1.8" cy="-1.8" r="2.2" fill="#FCE59E" fillOpacity="0.82" />
    </motion.g>
  )
}

/**
 * Single rooted multi-part specimen in soil plot `spot`.
 */
function PlantedPlotSpecimen({
  spot,
  plant,
  isSelected,
  isPlantingHere,
  isMoist,
  calmMotion,
}) {
  const { x, soilY, windPeriod, windDelay } = spot

  if (!plant && !isPlantingHere) {
    // Open planting spot marker subtle enough never to clutter
    return (
      <g>
        {isSelected && (
          <ellipse
            cx={x}
            cy={soilY + 1}
            rx="24"
            ry="5"
            fill="#FFF7E6"
            fillOpacity="0.34"
            stroke="#E5C07B"
            strokeWidth="1.2"
            strokeDasharray="3 2.5"
          />
        )}
        <ellipse cx={x} cy={soilY + 1.5} rx="13" ry="2.8" fill="#52362D" fillOpacity="0.45" />
      </g>
    )
  }

  const species = plant?.species || 'rose'
  const stage = clampStage(plant?.growthStage ?? 0)
  const heights = SPECIES_HEIGHT[species] || SPECIES_HEIGHT.rose
  const stemHeight = heights[stage] || 0
  const lean = SPECIES_CURVE[species] || 0
  const tipX = x + (stage >= 2 ? lean * (stage / 5) : 0)
  const tipY = soilY - stemHeight
  const ctrlX = x + lean * 0.45
  const ctrlY = soilY - stemHeight * 0.56

  return (
    <g data-plot-index={spot.index} data-species={species} data-plant-stage={stage}>
      {/* Selected plot ground highlight ring */}
      {isSelected && (
        <ellipse
          cx={x}
          cy={soilY + 2}
          rx="27"
          ry="5.8"
          fill="#FFF8EC"
          fillOpacity="0.32"
          stroke="#E4BE7E"
          strokeWidth="1.35"
        />
      )}

      {/* Temporary darkened wet soil patch right around this plant's root zone */}
      {isMoist && (
        <motion.ellipse
          data-testid={`wet-soil-${spot.index}`}
          cx={x}
          cy={soilY + 2.4}
          rx="26"
          ry="5.8"
          fill="url(#sg-wet-loam)"
          initial={calmMotion ? false : { opacity: 0.25, scaleX: 0.7 }}
          animate={{ opacity: 0.9, scaleX: 1 }}
          transition={{ duration: 0.45 }}
          style={{ transformOrigin: `${x}px ${soilY + 2.4}px` }}
        />
      )}

      {/* Grounded contact shadow at soil collar — prevents floating */}
      <ellipse
        cx={x}
        cy={soilY + 2.2}
        rx={stage === 0 ? 9 : Math.min(20, 9 + stage * 2.1)}
        ry={stage === 0 ? 2.2 : 3.4}
        fill="#2E1B16"
        fillOpacity="0.42"
      />

      {/* Complete Planting Sequence: Furrow opening -> seed settling -> soil closing */}
      {isPlantingHere ? (
        <g data-testid={`planting-sequence-${spot.index}`}>
          <motion.ellipse
            cx={x}
            cy={soilY + 1}
            rx="14"
            ry="3.8"
            fill="#341F19"
            initial={calmMotion ? false : { scaleX: 0.2, opacity: 0.3 }}
            animate={{ scaleX: [0.25, 1, 1, 0.35], opacity: [0.4, 1, 1, 0.25] }}
            transition={{ duration: 0.85, times: [0, 0.25, 0.68, 1] }}
            style={{ transformOrigin: `${x}px ${soilY + 1}px` }}
          />
          <motion.g
            initial={calmMotion ? false : { y: -22, opacity: 0 }}
            animate={{ y: [-22, -2, 0], opacity: [0, 1, 1] }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            <ellipse
              cx={x}
              cy={soilY}
              rx="4.8"
              ry="3.3"
              transform={`rotate(-16 ${x} ${soilY})`}
              fill="url(#sg-seed-shell)"
            />
          </motion.g>
          <motion.path
            d={`M ${x - 14} ${soilY + 2} Q ${x} ${soilY - 4} ${x + 14} ${soilY + 2} Z`}
            fill="#7D5A4B"
            initial={calmMotion ? false : { opacity: 0 }}
            animate={{ opacity: [0, 0, 0.95] }}
            transition={{ duration: 0.85, times: [0, 0.58, 1] }}
          />
        </g>
      ) : stage === 0 ? (
        /* Stage 0: Seed tucked cleanly in warm soil mound */
        <g>
          <path
            d={`M ${x - 13} ${soilY + 2.2} Q ${x} ${soilY - 4.2} ${x + 13} ${soilY + 2.2} Z`}
            fill="#7C594A"
          />
          <ellipse
            cx={x}
            cy={soilY - 0.5}
            rx="4.4"
            ry="2.9"
            transform={`rotate(-14 ${x} ${soilY})`}
            fill="url(#sg-seed-shell)"
          />
          <ellipse cx={x - 1.2} cy={soilY - 1.4} rx="1.5" ry="0.8" fill="#F6DFB7" fillOpacity="0.65" />
        </g>
      ) : (
        /* Stage 1..5: Base-anchored multi-part stem + species foliage + bud/bloom */
        <motion.g
          animate={
            calmMotion
              ? undefined
              : {
                  rotate: [-0.85, 0.95, -0.55, -0.85],
                }
          }
          transition={{
            duration: windPeriod,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: windDelay,
          }}
          style={{ transformOrigin: `${x}px ${soilY}px` }}
        >
          {/* Progressively lengthening curved botanical stem + root-crown secondary shoot */}
          <motion.path
            key={`stem-${species}-${stage}`}
            d={`M ${x} ${soilY + 1} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`}
            stroke="#3D6642"
            strokeWidth={species === 'sunflower' ? 3.4 : species === 'daisy' || species === 'orchid' ? 2.1 : 2.6}
            strokeLinecap="round"
            fill="none"
            initial={calmMotion ? false : { pathLength: 0.72 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          {stage >= 3 && (
            <path
              d={`M ${x} ${soilY + 1} Q ${x + (stage % 2 === 0 ? -5 : 5)} ${soilY - 14} ${
                x + (stage % 2 === 0 ? -9 : 9)
              } ${soilY - 26}`}
              stroke="#3D6642"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Subtle rose thorns on mature rose stems */}
          {species === 'rose' && stage >= 3 && (
            <g fill="#486843">
              <path d={`M ${x - 1} ${soilY - 36} L ${x - 5} ${soilY - 38} L ${x - 1} ${soilY - 39} Z`} />
              <path d={`M ${x} ${soilY - 62} L ${x + 4.5} ${soilY - 64} L ${x} ${soilY - 65} Z`} />
            </g>
          )}

          {/* Species-authentic veined leaves attached along stem / basal crown */}
          <SpeciesFoliage
            species={species}
            stage={stage}
            x={x}
            soilY={soilY}
            tipX={tipX}
            tipY={tipY}
            calmMotion={calmMotion}
            windPeriod={windPeriod}
            windDelay={windDelay}
          />

          {/* Flower head / bud with slight independent nod timing */}
          <motion.g
            animate={calmMotion ? undefined : { rotate: [0.7, -0.9, 0.7] }}
            transition={{
              duration: windPeriod * 0.78,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: windDelay - 0.5,
            }}
            style={{ transformOrigin: `${tipX}px ${tipY}px` }}
          >
            <SpeciesHead
              species={species}
              stage={stage}
              tipX={tipX}
              tipY={tipY}
              calmMotion={calmMotion}
            />
          </motion.g>
        </motion.g>
      )}
    </g>
  )
}

/**
 * Targeted Brass & Rosewood Watering Can — positions & tilts toward the exact selected plant,
 * pours a slender stream separating into droplets landing at the plant's root collar with small
 * restrained splashes.
 */
function TargetedWateringCan({ spot, calmMotion }) {
  if (!spot) return null
  const { x, soilY } = spot
  // Place spout tip right at (x + 8, soilY - 62) angling cleanly to (x, soilY)
  const canOriginX = Math.min(626, x + 56)
  const canOriginY = soilY - 76

  return (
    <g className="sg-watering-can-scene" pointerEvents="none" data-testid="garden-watering-can">
      {/* Directed water stream separating into droplets aimed strictly at the plant base */}
      <motion.g
        initial={calmMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: [0, 0.95, 0.95, 0] }}
        transition={{ duration: 1.55, times: [0, 0.16, 0.8, 1] }}
      >
        <path
          d={`M ${canOriginX - 42} ${canOriginY + 13} Q ${x + 8} ${soilY - 36} ${x + 2} ${soilY - 18}`}
          stroke="url(#sg-water-stream)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M ${canOriginX - 44} ${canOriginY + 16} Q ${x + 4} ${soilY - 32} ${x - 2} ${soilY - 14}`}
          stroke="url(#sg-water-stream)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Separating droplets landing right on the plant's soil base */}
        {[-5, 0, 4].map((dx, i) => (
          <motion.circle
            key={dx}
            cx={x + dx}
            r="1.9"
            fill="#88BEDE"
            initial={calmMotion ? { cy: soilY - 4 } : { cy: soilY - 26, opacity: 0.95 }}
            animate={
              calmMotion
                ? { cy: soilY - 2, opacity: 0.85 }
                : { cy: [soilY - 26, soilY - 1], opacity: [0.95, 0.2] }
            }
            transition={{
              duration: 0.42,
              repeat: 2,
              delay: i * 0.12,
              ease: 'easeIn',
            }}
          />
        ))}

        {/* Small restrained splashes right at soil contact */}
        <motion.g
          initial={calmMotion ? false : { opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.75, 0] }}
          transition={{ duration: 1.35, delay: 0.18 }}
          stroke="#9AC9E4"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        >
          <path d={`M ${x - 3} ${soilY} Q ${x - 8} ${soilY - 5} ${x - 11} ${soilY - 1}`} />
          <path d={`M ${x + 3} ${soilY} Q ${x + 8} ${soilY - 5} ${x + 11} ${soilY - 1}`} />
        </motion.g>
      </motion.g>

      {/* Conservatory Brushed Brass & Rosewood Watering Can tilting cleanly */}
      <motion.g
        initial={
          calmMotion
            ? { x: canOriginX, y: canOriginY, rotate: -26, opacity: 1 }
            : { x: canOriginX + 18, y: canOriginY - 12, rotate: -4, opacity: 0 }
        }
        animate={
          calmMotion
            ? { x: canOriginX, y: canOriginY, rotate: -26, opacity: 1 }
            : {
                x: [canOriginX + 18, canOriginX, canOriginX, canOriginX + 14],
                y: [canOriginY - 12, canOriginY, canOriginY, canOriginY - 8],
                rotate: [-4, -27, -27, -4],
                opacity: [0, 1, 1, 0],
              }
        }
        transition={{ duration: 1.65, times: [0, 0.18, 0.8, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Long angled brass spout & rose sprinkler head */}
        <path d="M -14 2 L -41 -6 L -43 -2 L -12 8 Z" fill="url(#sg-brass-grad)" />
        <ellipse cx="-43" cy="-4" rx="2.6" ry="5.2" transform="rotate(-18 -43 -4)" fill="#D9B16E" />
        {/* Arch handle */}
        <path
          d="M -6 -10 C 4 -24, 24 -20, 22 -2 C 21 6, 17 10, 14 11"
          fill="none"
          stroke="url(#sg-brass-grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Vessel cylinder */}
        <path
          d="M -14 -9 L 15 -9 L 18 14 C 8 17, -6 17, -17 14 Z"
          fill="url(#sg-can-body)"
          stroke="#7B4860"
          strokeWidth="0.9"
        />
        <ellipse cx="0.5" cy="-9" rx="14.5" ry="3.2" fill="#E6C594" />
      </motion.g>
    </g>
  )
}

/**
 * Peaceful Curved-Path Butterfly — travels softly along curved keyframes, approaches
 * a real open bloom, hovers/rests briefly, and departs. Wing beats run independently!
 */
function VisitingGardenButterfly({
  targetX = 292,
  targetY = 92,
  side = 'left',
  delay = 0,
}) {
  const dir = side === 'right' ? -1 : 1
  return (
    <motion.g
      className={`sg-butterfly-flight sg-butterfly-${side}`}
      pointerEvents="none"
      animate={{
        x: [
          targetX - 118 * dir,
          targetX - 46 * dir,
          targetX + 8 * dir,
          targetX + 8 * dir,
          targetX + 68 * dir,
          targetX + 132 * dir,
        ],
        y: [targetY - 34, targetY - 12, targetY - 6, targetY - 5, targetY - 26, targetY - 42],
        opacity: [0, 0.95, 1, 1, 0.92, 0],
      }}
      transition={{
        duration: side === 'right' ? 15.2 : 13.5,
        delay,
        repeat: Infinity,
        repeatDelay: 2.5,
        times: [0, 0.24, 0.44, 0.66, 0.85, 1],
        ease: 'easeInOut',
      }}
    >
      <motion.g
        animate={{ scaleY: [1, 0.42, 1, 0.55, 1] }}
        transition={{
          duration: side === 'right' ? 0.66 : 0.72,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M 0 0 C -9 -11, -18 -5, -13 4 C -8 8, -3 4, 0 0 Z"
          fill="#F2A9C0"
          fillOpacity="0.92"
        />
        <path
          d="M 0 0 C 9 -11, 18 -5, 13 4 C 8 8, 3 4, 0 0 Z"
          fill="#FCE0C8"
          fillOpacity="0.92"
        />
      </motion.g>
      <path d="M 0 -3.5 V 4.5" stroke="#6E475B" strokeWidth="1.15" strokeLinecap="round" />
    </motion.g>
  )
}

const SanctuaryGardenSvg = ({
  stage = 1,
  progressPercent = 0,
  plots = null,
  selectedPlotIndex = 0,
  onSelectPlot = null,
  plantingPlotIndex = null,
  wateringPlotIndex = null,
  animationsPaused = false,
  reduceMotion = false,
  compact = false,
  interactivePreview = false,
  externalPreviewStage = undefined,
  onPreviewStageChange = undefined,
  isWatering = false,
}) => {
  const { t, i18n } = useTranslation()
  const containerRef = useRef(null)
  const [internalPreviewStage, setInternalPreviewStage] = useState(null)
  const [inViewport, setInViewport] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)
  const [bedCameraOverride, setBedCameraOverride] = useState('auto')

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return undefined
    const measure = () => {
      const nextWidth = Math.round(node.getBoundingClientRect().width || 0)
      setContainerWidth(nextWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setBedCameraOverride((prev) => (prev === 'all' ? 'all' : 'auto'))
  }, [selectedPlotIndex])

  const lowPowerDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    const isJsdom = /jsdom/i.test(navigator.userAgent || '')
    return (
      typeof navigator.hardwareConcurrency === 'number' &&
      (isJsdom ? navigator.hardwareConcurrency <= 1 : navigator.hardwareConcurrency < 4)
    )
  }, [])

  // Pause ambient animations when scrolled out of view or when browser tab is hidden
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const onVis = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVis)

    let observer = null
    if (typeof IntersectionObserver === 'function' && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]) setInViewport(entries[0].isIntersecting)
        },
        { threshold: 0.05 }
      )
      observer.observe(containerRef.current)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      observer?.disconnect()
    }
  }, [])

  const osReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const calmMotion = Boolean(
    reduceMotion || animationsPaused || osReducedMotion || !inViewport || !tabVisible
  )

  const previewStage =
    externalPreviewStage !== undefined ? externalPreviewStage : internalPreviewStage

  const effectivePlots = useMemo(() => {
    const basePlots = Array.isArray(plots)
      ? plots
      : buildFallbackPlotsFromOverallStage(stage)

    if (previewStage === null || previewStage === undefined) {
      return basePlots
    }

    // Non-consuming preview override: never alters persisted plot state!
    const mappedGrowth = Math.max(0, Math.min(5, previewStage))
    const sampleVarieties = ['rose', 'tulip', 'sunflower', 'daisy', 'orchid', 'strelitzia']
    return GARDEN_PLOT_SPOTS.map((sp, i) => {
      const existing = basePlots[i]
      if (existing) {
        return { ...existing, growthStage: mappedGrowth }
      }
      return i <= previewStage
        ? { id: `preview-${i}`, species: sampleVarieties[i], growthStage: mappedGrowth }
        : null
    })
  }, [plots, previewStage, stage])

  const activeWaterPlot =
    wateringPlotIndex !== null && wateringPlotIndex !== undefined
      ? wateringPlotIndex
      : isWatering
      ? selectedPlotIndex ?? 0
      : null

  const activeWaterSpot =
    activeWaterPlot !== null ? GARDEN_PLOT_SPOTS[activeWaterPlot] || GARDEN_PLOT_SPOTS[0] : null

  // Find a blooming plant for the visiting butterfly to approach peacefully
  const bloomingTarget = useMemo(() => {
    const foundIdx = effectivePlots.findIndex((p) => p && p.growthStage >= 4)
    if (foundIdx === -1) return null
    const spot = GARDEN_PLOT_SPOTS[foundIdx]
    const plant = effectivePlots[foundIdx]
    const h = (SPECIES_HEIGHT[plant.species] || SPECIES_HEIGHT.rose)[plant.growthStage] || 95
    return { x: spot.x, y: spot.soilY - h }
  }, [effectivePlots])

  const isNarrowGardenFrame = containerWidth > 0 && containerWidth < 460
  const focusPlotIndex =
    wateringPlotIndex !== null
      ? wateringPlotIndex
      : plantingPlotIndex !== null
      ? plantingPlotIndex
      : Number(selectedPlotIndex) || 0

  const effectiveCamera = !isNarrowGardenFrame
    ? 'all'
    : bedCameraOverride !== 'auto'
    ? bedCameraOverride
    : focusPlotIndex >= 3
    ? 'right'
    : 'left'

  const activeViewBox =
    effectiveCamera === 'left'
      ? '24 6 336 256'
      : effectiveCamera === 'right'
      ? '320 6 336 256'
      : '0 0 680 262'

  const isAmLocale = String(i18n.language || 'en').startsWith('am')
  const nowTs = Date.now()

  return (
    <div
      ref={containerRef}
      className={`hc-sanctuary-garden-wrap${compact ? ' is-compact' : ''}${
        activeWaterSpot ? ' is-watering' : ''
      }${calmMotion ? ' is-calm' : ''}${isNarrowGardenFrame ? ' is-narrow-frame' : ''}`}
      data-testid="sanctuary-garden-svg"
    >
      {isNarrowGardenFrame && (
        <div
          className="hc-garden-camera-bar"
          role="group"
          aria-label={isAmLocale ? 'የአትክልት ስፍራ እይታ' : 'Garden bed view'}
        >
          <button
            type="button"
            className={`hc-garden-camera-pill${effectiveCamera === 'left' ? ' is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setBedCameraOverride('left')
            }}
          >
            {isAmLocale ? 'መደብ 1–3' : 'Plots 1–3'}
          </button>
          <button
            type="button"
            className={`hc-garden-camera-pill${effectiveCamera === 'right' ? ' is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setBedCameraOverride('right')
            }}
          >
            {isAmLocale ? 'መደብ 4–6' : 'Plots 4–6'}
          </button>
          <button
            type="button"
            className={`hc-garden-camera-pill${effectiveCamera === 'all' ? ' is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setBedCameraOverride('all')
            }}
          >
            {isAmLocale ? 'ሁሉም (6)' : 'All 6'}
          </button>
        </div>
      )}

      {interactivePreview && !Array.isArray(plots) && (
        <div className="hc-garden-preview-bar" role="group" aria-label="Preview garden growth stages">
          {[1, 2, 3, 4, 5].map((num) => {
            const currentStage = previewStage !== null ? previewStage : stage
            const isSelected = currentStage === num
            return (
              <button
                key={num}
                type="button"
                className={`hc-garden-stage-dot${isSelected ? ' is-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  const next = num === stage ? null : num
                  if (onPreviewStageChange) onPreviewStageChange(next)
                  else setInternalPreviewStage(next)
                }}
              >
                {num === stage ? `S${num} •` : `S${num}`}
              </button>
            )
          })}
        </div>
      )}

      <svg
        viewBox={activeViewBox}
        preserveAspectRatio="xMidYMax meet"
        className="hc-sanctuary-garden-svg"
        role="img"
        aria-label={`Botanical sanctuary garden at stage ${stage} of 5`}
      >
        <defs>
          <clipPath id="sg-soil-mound-clip">
            <path d="M 0 215 Q 175 190 340 190 Q 505 190 680 215 L 680 262 L 0 262 Z" />
          </clipPath>

          {/* Consistent upper-left warm morning sunlight */}
          <radialGradient id="sg-morning-sun" cx="18%" cy="14%" r="72%">
            <stop offset="0%" stopColor="#FFF6DF" stopOpacity="0.96" />
            <stop offset="48%" stopColor="#FCEFF4" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#FFFDFB" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="sg-distant-meadow" x1="0" y1="176" x2="680" y2="218" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ADC69E" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#8EAD82" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#A9C29B" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="sg-earth-crust" x1="120" y1="190" x2="560" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#946D5A" />
            <stop offset="55%" stopColor="#7C5849" />
            <stop offset="100%" stopColor="#6D4C3F" />
          </linearGradient>

          <linearGradient id="sg-earth-loam" x1="0" y1="204" x2="680" y2="248" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6B4B3E" />
            <stop offset="50%" stopColor="#583B31" />
            <stop offset="100%" stopColor="#66463B" />
          </linearGradient>

          <linearGradient id="sg-earth-subsoil" x1="340" y1="230" x2="340" y2="262" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4A3029" />
            <stop offset="100%" stopColor="#39241F" />
          </linearGradient>

          <radialGradient id="sg-wet-loam" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2B1813" stopOpacity="0.88" />
            <stop offset="68%" stopColor="#3E251E" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#583B31" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="sg-seed-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6BA86" />
            <stop offset="55%" stopColor="#B87E4C" />
            <stop offset="100%" stopColor="#855432" />
          </linearGradient>

          {/* Naturalistic foliage shading */}
          <linearGradient id="sg-leaf-tender" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ACD094" />
            <stop offset="100%" stopColor="#67915E" />
          </linearGradient>
          <linearGradient id="sg-leaf-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86AE78" />
            <stop offset="100%" stopColor="#4A7448" />
          </linearGradient>
          <linearGradient id="sg-leaf-deep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#699264" />
            <stop offset="100%" stopColor="#355838" />
          </linearGradient>
          <linearGradient id="sg-leaf-glaucous" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8AB2A2" />
            <stop offset="100%" stopColor="#497065" />
          </linearGradient>

          {/* Species petal gradients */}
          <linearGradient id="sg-rose-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCE0EA" />
            <stop offset="58%" stopColor="#E68AA8" />
            <stop offset="100%" stopColor="#BD4F75" />
          </linearGradient>
          <linearGradient id="sg-rose-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5ACC4" />
            <stop offset="65%" stopColor="#CC557C" />
            <stop offset="100%" stopColor="#9B2F55" />
          </linearGradient>
          <linearGradient id="sg-sunflower-petal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE169" />
            <stop offset="70%" stopColor="#F0AC2B" />
            <stop offset="100%" stopColor="#CD7E1B" />
          </linearGradient>
          <linearGradient id="sg-tulip-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD2BC" />
            <stop offset="62%" stopColor="#E57B63" />
            <stop offset="100%" stopColor="#BD4E42" />
          </linearGradient>
          <linearGradient id="sg-tulip-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE4CF" />
            <stop offset="58%" stopColor="#EC8B70" />
            <stop offset="100%" stopColor="#C95949" />
          </linearGradient>
          <linearGradient id="sg-orchid-wing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF7FB" />
            <stop offset="65%" stopColor="#F5C6DF" />
            <stop offset="100%" stopColor="#DA8EB8" />
          </linearGradient>

          {/* Conservatory watering can materials */}
          <linearGradient id="sg-brass-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F3DCB3" />
            <stop offset="55%" stopColor="#C99E5C" />
            <stop offset="100%" stopColor="#997239" />
          </linearGradient>
          <linearGradient id="sg-can-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B87692" />
            <stop offset="65%" stopColor="#8F526F" />
            <stop offset="100%" stopColor="#6D3B53" />
          </linearGradient>
          <linearGradient id="sg-water-stream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BEE2F7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7BB7DC" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Warm upper-left morning sunlight */}
        <rect x="0" y="0" width="680" height="236" fill="url(#sg-morning-sun)" />

        {/* Soft meadow verge behind soil bed */}
        <path
          d="M 10 214 Q 170 184 340 187 Q 510 184 670 214 L 680 230 L 0 230 Z"
          fill="url(#sg-distant-meadow)"
        />

        {/* Grounded 3-layer organic loam bed */}
        <g>
          <path
            d="M 0 215 Q 175 190 340 190 Q 505 190 680 215 L 680 262 L 0 262 Z"
            fill="url(#sg-earth-crust)"
          />
          <path
            d="M 0 225 Q 190 205 340 205 Q 490 205 680 225 L 680 262 L 0 262 Z"
            fill="url(#sg-earth-loam)"
          />
          <path
            d="M 0 241 Q 340 228 680 241 L 680 262 L 0 262 Z"
            fill="url(#sg-earth-subsoil)"
          />
          {/* Subtle soil pebbles & organic grain */}
          <g fill="#8B6858" fillOpacity="0.34">
            <ellipse cx="64" cy="224" rx="5" ry="1.8" />
            <ellipse cx="238" cy="215" rx="4.2" ry="1.5" />
            <ellipse cx="442" cy="216" rx="5.5" ry="1.7" />
            <ellipse cx="618" cy="225" rx="4.6" ry="1.6" />
          </g>
        </g>

        {/* 6 Interactive Rooted Botanical Plots */}
        {GARDEN_PLOT_SPOTS.map((spot, idx) => {
          const plant = effectivePlots[idx]
          const isMoist =
            activeWaterPlot === idx || Boolean(plant?.moistUntil && plant.moistUntil > nowTs)
          return (
            <g
              key={spot.index}
              onClick={
                typeof onSelectPlot === 'function'
                  ? (e) => {
                      e.stopPropagation()
                      onSelectPlot(idx)
                    }
                  : undefined
              }
              style={{ cursor: typeof onSelectPlot === 'function' ? 'pointer' : 'default' }}
            >
              {/* Invisible generous touch target for selecting plot */}
              {typeof onSelectPlot === 'function' && (
                <rect
                  x={spot.x - 42}
                  y={spot.soilY - 125}
                  width="84"
                  height="145"
                  fill="transparent"
                />
              )}
              <PlantedPlotSpecimen
                spot={spot}
                plant={plant}
                isSelected={selectedPlotIndex === idx && typeof onSelectPlot === 'function'}
                isPlantingHere={plantingPlotIndex === idx}
                isMoist={isMoist}
                calmMotion={calmMotion}
              />
            </g>
          )
        })}

        {/* Targeted Watering Can over the active selected plant */}
        {activeWaterSpot && (
          <TargetedWateringCan spot={activeWaterSpot} calmMotion={calmMotion} />
        )}

        {/* Occasional peaceful butterflies on curved flight paths when in bloom & motion active */}
        {bloomingTarget && !calmMotion && (
          <>
            <VisitingGardenButterfly
              side="left"
              targetX={bloomingTarget.x}
              targetY={bloomingTarget.y}
            />
            {!lowPowerDevice && (
              <VisitingGardenButterfly
                side="right"
                targetX={Math.min(548, bloomingTarget.x + 176)}
                targetY={bloomingTarget.y + 8}
                delay={3.4}
              />
            )}
          </>
        )}

        {/* Restrained ambient morning motes (reduced automatically on low-power devices) */}
        {!calmMotion && (
          <g className="sg-sparkles" fill="#E3B773" pointerEvents="none">
            <circle cx="212" cy="96" r="1.5" />
            <circle cx="446" cy="84" r="1.6" />
            {!lowPowerDevice && <circle cx="338" cy="58" r="1.4" />}
          </g>
        )}
      </svg>
    </div>
  )
}

export default SanctuaryGardenSvg
