import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Bespoke curved trajectories: graceful wing-beating butterflies, soaring songbirds,
// multi-point star sparkles, and silk blossom petals radiating from the card itself.
const BUTTERFLY_ARCS = [
  {
    id: 'bf-rose-left',
    x: [-10, -56, -112],
    y: [4, -44, -92],
    rotate: [-16, -8, -22],
    scale: [0.42, 1.04, 0.78],
    wingUpper: '#E56B92',
    wingLower: '#F6A6BE',
    body: '#6B3348',
    delay: 0.02,
    duration: 1.24,
  },
  {
    id: 'bf-gold-right',
    x: [12, 66, 124],
    y: [2, -52, -98],
    rotate: [18, 10, 24],
    scale: [0.4, 1.06, 0.8],
    wingUpper: '#EAA24E',
    wingLower: '#FAD28C',
    body: '#6E4823',
    delay: 0.07,
    duration: 1.28,
  },
  {
    id: 'bf-orchid-crest',
    x: [-4, 18, 6],
    y: [-8, -68, -118],
    rotate: [6, -10, 8],
    scale: [0.38, 0.96, 0.72],
    wingUpper: '#BA6EC8',
    wingLower: '#E4B3EE',
    body: '#563162',
    delay: 0.12,
    duration: 1.32,
  },
]

const SONGBIRD_ARCS = [
  {
    id: 'bird-glide-right',
    x: [-6, 52, 134],
    y: [-6, -42, -74],
    rotate: [-8, -14, -6],
    scale: [0.38, 0.94, 0.74],
    color: '#D4839D',
    wing: '#F2B8CA',
    delay: 0.05,
    duration: 1.18,
  },
  {
    id: 'bird-glide-left',
    x: [8, -48, -128],
    y: [-4, -36, -66],
    rotate: [10, 15, 7],
    scale: [0.36, 0.88, 0.68],
    flip: true,
    color: '#D99B52',
    wing: '#F7D098',
    delay: 0.11,
    duration: 1.22,
  },
]

const STAR_SPARKLES = [
  { x: [0, -78, -96], y: [0, -22, -30], color: '#F0B44C', size: 17, delay: 0.01 },
  { x: [0, 84, 104], y: [0, -26, -34], color: '#E26D94', size: 18, delay: 0.04 },
  { x: [0, -44, -56], y: [0, -74, -90], color: '#F5C96B', size: 15, delay: 0.06 },
  { x: [0, 48, 62], y: [0, -76, -94], color: '#C674D4', size: 16, delay: 0.08 },
  { x: [0, -92, -114], y: [0, 26, 36], color: '#EA90AC', size: 14, delay: 0.05 },
  { x: [0, 92, 114], y: [0, 24, 34], color: '#F0B44C', size: 15, delay: 0.09 },
  { x: [0, -26, -34], y: [0, 56, 70], color: '#79AF85', size: 13, delay: 0.1 },
  { x: [0, 30, 40], y: [0, 54, 68], color: '#E26D94', size: 14, delay: 0.12 },
]

const SILK_PETALS = [
  { x: [-8, -64, -84], y: [-2, 14, 42], rotate: [0, 68, 138], color: '#F4A6BE', delay: 0.04 },
  { x: [10, 68, 90], y: [-4, 12, 38], rotate: [0, -64, -132], color: '#F9C99A', delay: 0.08 },
  { x: [-14, -36, -46], y: [-12, -52, -72], rotate: [12, -48, -96], color: '#E5B2EE', delay: 0.1 },
  { x: [14, 38, 50], y: [-10, -48, -68], rotate: [-14, 52, 108], color: '#F4A6BE', delay: 0.13 },
]

const ButterflyGlyph = ({ wingUpper, wingLower, body }) => (
  <svg width="26" height="24" viewBox="0 0 28 26" fill="none" aria-hidden="true">
    <path
      d="M13.4 12.6C10.2 5.4 3.4 2.4 1.6 6.8C0.2 10.2 4.8 14.2 12.8 13.8Z"
      fill={wingUpper}
      fillOpacity="0.92"
    />
    <path
      d="M14.6 12.6C17.8 5.4 24.6 2.4 26.4 6.8C27.8 10.2 23.2 14.2 15.2 13.8Z"
      fill={wingUpper}
      fillOpacity="0.92"
    />
    <path
      d="M13.2 14.2C8.4 14.8 3.8 18.2 5.6 21.6C7.1 24.2 11.4 22.1 13.5 15.6Z"
      fill={wingLower}
      fillOpacity="0.9"
    />
    <path
      d="M14.8 14.2C19.6 14.8 24.2 18.2 22.4 21.6C20.9 24.2 16.6 22.1 14.5 15.6Z"
      fill={wingLower}
      fillOpacity="0.9"
    />
    <rect x="13.3" y="8.2" width="1.4" height="10.4" rx="0.7" fill={body} />
    <path
      d="M13.6 8.6C12.3 6.4 10.8 5.5 9.8 5.4M14.4 8.6C15.7 6.4 17.2 5.5 18.2 5.4"
      stroke={body}
      strokeWidth="0.9"
      strokeLinecap="round"
    />
  </svg>
)

const SongbirdGlyph = ({ color, wing, flip = false }) => (
  <svg
    width="24"
    height="19"
    viewBox="0 0 26 20"
    fill="none"
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
    aria-hidden="true"
  >
    <path
      d="M2.2 13.8C6.6 13.2 9.8 10.6 12.8 7.8C15.8 5.1 19.6 5.2 23.4 7.6C20.6 8.5 18.8 10.2 17.4 12.4C14.1 15.6 8.4 16.8 2.2 13.8Z"
      fill={color}
    />
    <path
      d="M11.6 9.4C10.2 4.6 6.8 1.8 3.6 1.4C6.1 4.8 7.6 7.8 8.2 10.8Z"
      fill={wing}
    />
    <path d="M23.1 7.5L25.6 8.3L23.2 9.2Z" fill={color} />
  </svg>
)

const StarSparkleGlyph = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 1.2L14.3 9.7L22.8 12L14.3 14.3L12 22.8L9.7 14.3L1.2 12L9.7 9.7L12 1.2Z"
      fill={color}
    />
    <circle cx="12" cy="12" r="2.1" fill="#FFFDF9" />
  </svg>
)

const SilkPetalGlyph = ({ color }) => (
  <svg width="13" height="16" viewBox="0 0 14 18" fill="none" aria-hidden="true">
    <path
      d="M7 1C11.2 4.6 13 9.2 11.4 13.4C9.9 17 4.1 17 2.6 13.4C1 9.2 2.8 4.6 7 1Z"
      fill={color}
      fillOpacity="0.88"
    />
  </svg>
)

const CardBurst = ({ burstKey = 0, disabled = false }) => {
  if (disabled || !burstKey) return null

  return (
    <AnimatePresence>
      <div
        key={burstKey}
        className="hc-card-burst-layer"
        aria-hidden="true"
        data-testid="card-fauna-burst"
      >
        {/* Soft satin aura wash strictly inside the card boundary (zero circles, zero full-screen overlay) */}
        <motion.span
          className="hc-card-burst-sheen"
          initial={{ opacity: 0.72, scale: 0.96 }}
          animate={{ opacity: 0, scale: 1.03 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Fluttering butterflies along curved trajectories */}
        {BUTTERFLY_ARCS.map((bf) => (
          <motion.span
            key={bf.id}
            className="hc-card-burst-particle hc-card-burst-butterfly"
            data-fauna="butterfly"
            initial={{ x: 0, y: 0, scale: 0.28, opacity: 0, rotate: bf.rotate[0] }}
            animate={{
              x: bf.x,
              y: bf.y,
              scale: bf.scale,
              rotate: bf.rotate,
              opacity: [0, 1, 0.96, 0],
            }}
            transition={{
              duration: bf.duration,
              delay: bf.delay,
              ease: [0.19, 1, 0.22, 1],
            }}
          >
            <motion.span
              className="hc-card-burst-wingbeat"
              animate={{ scaleX: [1, 0.34, 1, 0.38, 1, 0.44, 1] }}
              transition={{ duration: bf.duration, ease: 'easeInOut' }}
            >
              <ButterflyGlyph
                wingUpper={bf.wingUpper}
                wingLower={bf.wingLower}
                body={bf.body}
              />
            </motion.span>
          </motion.span>
        ))}

        {/* Soaring miniature songbirds */}
        {SONGBIRD_ARCS.map((bird) => (
          <motion.span
            key={bird.id}
            className="hc-card-burst-particle hc-card-burst-bird"
            data-fauna="songbird"
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 0, rotate: bird.rotate[0] }}
            animate={{
              x: bird.x,
              y: bird.y,
              scale: bird.scale,
              rotate: bird.rotate,
              opacity: [0, 0.98, 0.9, 0],
            }}
            transition={{
              duration: bird.duration,
              delay: bird.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <SongbirdGlyph color={bird.color} wing={bird.wing} flip={bird.flip} />
          </motion.span>
        ))}

        {/* Radiant multi-point star sparkles */}
        {STAR_SPARKLES.map((sp, idx) => (
          <motion.span
            key={`star-${idx}`}
            className="hc-card-burst-particle hc-card-burst-star"
            data-sparkle="star"
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: -24 }}
            animate={{
              x: sp.x,
              y: sp.y,
              scale: [0.2, 1.18, 0.85, 0],
              rotate: [-24, 18, 52],
              opacity: [0, 1, 0.92, 0],
            }}
            transition={{
              duration: 1.02,
              delay: sp.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <StarSparkleGlyph color={sp.color} size={sp.size} />
          </motion.span>
        ))}

        {/* Drifting silk blossom petals */}
        {SILK_PETALS.map((petal, idx) => (
          <motion.span
            key={`petal-${idx}`}
            className="hc-card-burst-particle hc-card-burst-petal"
            data-fauna="petal"
            initial={{ x: 0, y: 0, scale: 0.32, opacity: 0, rotate: 0 }}
            animate={{
              x: petal.x,
              y: petal.y,
              scale: [0.32, 1, 0.72],
              rotate: petal.rotate,
              opacity: [0, 0.94, 0],
            }}
            transition={{
              duration: 1.16,
              delay: petal.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <SilkPetalGlyph color={petal.color} />
          </motion.span>
        ))}
      </div>
    </AnimatePresence>
  )
}

export default CardBurst
