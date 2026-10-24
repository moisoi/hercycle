import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { useTranslation } from 'react-i18next'

const FULLSCREEN_SPARKLES = [
  { x: '7%', y: '14%', size: 22, color: '#F6C973', delay: 0.02 },
  { x: '15%', y: '34%', size: 15, color: '#F39CB8', delay: 0.14 },
  { x: '11%', y: '68%', size: 20, color: '#FCE2A6', delay: 0.22 },
  { x: '23%', y: '20%', size: 26, color: '#FFD88A', delay: 0.08 },
  { x: '28%', y: '52%', size: 16, color: '#D9A7E6', delay: 0.28 },
  { x: '34%', y: '78%', size: 18, color: '#F4A9C1', delay: 0.12 },
  { x: '42%', y: '15%', size: 24, color: '#FFE099', delay: 0.05 },
  { x: '48%', y: '38%', size: 19, color: '#FFF4D4', delay: 0.19 },
  { x: '56%', y: '18%', size: 27, color: '#F7C978', delay: 0.09 },
  { x: '63%', y: '46%', size: 16, color: '#F29AB7', delay: 0.24 },
  { x: '68%', y: '74%', size: 21, color: '#A8CE9F', delay: 0.16 },
  { x: '75%', y: '22%', size: 25, color: '#FFE2A1', delay: 0.06 },
  { x: '82%', y: '56%', size: 18, color: '#DFB3EC', delay: 0.2 },
  { x: '89%', y: '17%', size: 23, color: '#F9CF82', delay: 0.11 },
  { x: '92%', y: '44%', size: 17, color: '#F5A6BE', delay: 0.27 },
  { x: '86%', y: '76%', size: 21, color: '#FFE3A4', delay: 0.15 },
  { x: '19%', y: '84%', size: 17, color: '#A8CE9F', delay: 0.25 },
  { x: '52%', y: '64%', size: 22, color: '#FFD98E', delay: 0.13 },
]

const BUTTERFLY_FLIGHTS = [
  { id: 'bf-1', startX: '-6vw', midX: '28vw', endX: '64vw', startY: '72vh', midY: '34vh', endY: '14vh', wingA: '#F59BB8', wingB: '#FFE1B5', scale: 1.2, delay: 0.04, dur: 3.6 },
  { id: 'bf-2', startX: '104vw', midX: '68vw', endX: '30vw', startY: '68vh', midY: '28vh', endY: '12vh', wingA: '#D9B2EE', wingB: '#FBD2E0', scale: 1.15, delay: 0.12, dur: 3.8 },
  { id: 'bf-3', startX: '8vw', midX: '44vw', endX: '84vw', startY: '86vh', midY: '48vh', endY: '22vh', wingA: '#F7B58D', wingB: '#FFF0CE', scale: 0.98, delay: 0.2, dur: 3.9 },
  { id: 'bf-4', startX: '92vw', midX: '54vw', endX: '14vw', startY: '82vh', midY: '44vh', endY: '20vh', wingA: '#F094B2', wingB: '#FCE3EC', scale: 1.05, delay: 0.26, dur: 3.7 },
  { id: 'bf-5', startX: '24vw', midX: '50vw', endX: '76vw', startY: '62vh', midY: '24vh', endY: '8vh', wingA: '#B6D9AC', wingB: '#FFF4D6', scale: 0.92, delay: 0.16, dur: 3.5 },
]

const SWALLOW_BIRDS = [
  { id: 'bird-1', x0: '-8vw', x1: '46vw', x2: '106vw', y0: '42vh', y1: '18vh', y2: '10vh', flip: 1, delay: 0.1, dur: 3.4 },
  { id: 'bird-2', x0: '108vw', x1: '54vw', x2: '-8vw', y0: '48vh', y1: '24vh', y2: '13vh', flip: -1, delay: 0.34, dur: 3.7 },
]

const DRIFTING_PETALS = [
  { left: '12%', color: '#F8BED1', drift: 42, delay: 0.04 },
  { left: '26%', color: '#FFF0D8', drift: -36, delay: 0.14 },
  { left: '39%', color: '#E2C4F0', drift: 34, delay: 0.09 },
  { left: '53%', color: '#F6A7C1', drift: -40, delay: 0.18 },
  { left: '67%', color: '#B7D6AE', drift: 30, delay: 0.07 },
  { left: '81%', color: '#FAD0B6', drift: -34, delay: 0.15 },
  { left: '91%', color: '#F7B8CC', drift: -26, delay: 0.22 },
]

const CelebrationOverlay = ({ celebration, reduceMotion = false, onDismiss }) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (!celebration) return undefined
    const timer = window.setTimeout(() => {
      if (typeof onDismiss === 'function') onDismiss()
    }, 5200)
    return () => window.clearTimeout(timer)
  }, [celebration, onDismiss])

  return (
    <AnimatePresence>
      {celebration ? (
        <motion.div
          className="hc-celebration-overlay"
          role="status"
          aria-live="polite"
          data-testid="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Whole-Screen Luminous Botanical Aurora & Golden Light Wash */}
          <motion.div
            className="hc-celebration-screen-glow"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: reduceMotion ? 0.45 : [0, 0.96, 0.72, 0] }}
            transition={{ duration: reduceMotion ? 0.4 : 4.6, ease: 'easeOut' }}
          />

          {!reduceMotion ? (
            <div className="hc-celebration-particles" aria-hidden="true">
              {/* Twinkling 4-point starlight sparkles lighting up the entire viewport */}
              {FULLSCREEN_SPARKLES.map((sp, idx) => (
                <motion.svg
                  key={`${celebration.id || idx}-sp-${idx}`}
                  viewBox="0 0 24 24"
                  width={sp.size}
                  height={sp.size}
                  className="hc-celebration-star"
                  style={{ left: sp.x, top: sp.y, color: sp.color }}
                  initial={{ opacity: 0, scale: 0.2, rotate: -30 }}
                  animate={{
                    opacity: [0, 1, 0.65, 1, 0],
                    scale: [0.25, 1.35, 0.85, 1.2, 0.2],
                    rotate: [-30, 15, 45],
                  }}
                  transition={{
                    duration: 3.4,
                    delay: sp.delay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <path
                    d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z"
                    fill="currentColor"
                  />
                </motion.svg>
              ))}

              {/* Fluttering SVG Butterflies flying across the screen */}
              {BUTTERFLY_FLIGHTS.map((bf) => (
                <motion.div
                  key={`${celebration.id}-${bf.id}`}
                  className="hc-celebration-fauna"
                  initial={{ x: bf.startX, y: bf.startY, opacity: 0, scale: bf.scale * 0.65 }}
                  animate={{
                    x: [bf.startX, bf.midX, bf.endX],
                    y: [bf.startY, bf.midY, bf.endY],
                    opacity: [0, 1, 0.96, 0],
                    scale: [bf.scale * 0.65, bf.scale, bf.scale * 0.9],
                  }}
                  transition={{
                    duration: bf.dur,
                    delay: bf.delay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <svg width="42" height="36" viewBox="-22 -18 44 36" className="hc-fauna-butterfly-svg">
                    <path d="M 0 0 C -11 -14, -22 -6, -15 6 C -10 11, -3 6, 0 0 Z" fill={bf.wingA} />
                    <path d="M 0 0 C 11 -14, 22 -6, 15 6 C 10 11, 3 6, 0 0 Z" fill={bf.wingB} />
                    <path d="M 0 -5 V 6" stroke="#6B475C" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </motion.div>
              ))}

              {/* Graceful SVG Songbirds gliding across the sky */}
              {SWALLOW_BIRDS.map((bird) => (
                <motion.div
                  key={`${celebration.id}-${bird.id}`}
                  className="hc-celebration-fauna"
                  initial={{ x: bird.x0, y: bird.y0, opacity: 0 }}
                  animate={{
                    x: [bird.x0, bird.x1, bird.x2],
                    y: [bird.y0, bird.y1, bird.y2],
                    opacity: [0, 0.95, 0.92, 0],
                  }}
                  transition={{ duration: bird.dur, delay: bird.delay, ease: 'easeInOut' }}
                >
                  <svg
                    width="48"
                    height="34"
                    viewBox="-24 -18 48 36"
                    style={{ transform: `scaleX(${bird.flip})` }}
                  >
                    <path d="M -2 2 C -11 -2, -19 1, -23 7 C -15 7, -8 5, -2 2 Z" fill="#88A890" />
                    <ellipse cx="1" cy="2" rx="9" ry="5" transform="rotate(-12)" fill="#9AB89F" />
                    <path d="M -3 0 C -11 -15, 0 -17, 5 -2 Z" fill="#E39BB5" />
                    <circle cx="9" cy="-1" r="4" fill="#88A890" />
                    <path d="M 12.5 -1.2 L 19 -3" stroke="#C59258" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </motion.div>
              ))}

              {/* Floating Lily & Rose Petals */}
              {DRIFTING_PETALS.map((petal, idx) => (
                <motion.svg
                  key={`${celebration.id}-petal-${idx}`}
                  width="20"
                  height="26"
                  viewBox="-10 -13 20 26"
                  className="hc-celebration-glyph"
                  style={{ left: petal.left }}
                  initial={{ opacity: 0, y: '86vh', x: 0, rotate: -20 }}
                  animate={{
                    opacity: [0, 0.96, 0.88, 0],
                    y: ['86vh', '10vh'],
                    x: [0, petal.drift, -petal.drift * 0.45],
                    rotate: [-20, 45, 115],
                  }}
                  transition={{ duration: 3.6, delay: petal.delay, ease: [0.22, 1, 0.36, 1] }}
                >
                  <path d="M 0 11 C -8 3, -7 -7, 0 -12 C 7 -7, 8 3, 0 11 Z" fill={petal.color} />
                </motion.svg>
              ))}
            </div>
          ) : null}

          <motion.div
            className="hc-celebration-banner hc-spotlight-card"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="hc-celebration-icon" aria-hidden="true">
              {celebration.icon || <AutoAwesomeRoundedIcon fontSize="small" />}
            </span>
            <div className="hc-celebration-copy">
              <span className="eyebrow-label">{t('gardenHomeEyebrow')}</span>
              <strong>{celebration.title}</strong>
              {celebration.description ? <p>{celebration.description}</p> : null}
            </div>
            <button
              type="button"
              className="hc-celebration-close"
              onClick={onDismiss}
            >
              {t('celebrationDismiss')}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default CelebrationOverlay
