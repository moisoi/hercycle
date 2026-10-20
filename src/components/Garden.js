import React, { useId } from 'react'

// Accent palettes for cosmetic personalisation. Flowers and the sun take their colour from here.
export const ACCENTS = {
  berry: { flower: '#b0527f', petal: '#e7a6c0', leaf: '#5f9e7d', sun: '#ffd98a' },
  sage: { flower: '#5f9e7d', petal: '#bfe3cf', leaf: '#3f8a6a', sun: '#ffe2a6' },
  peach: { flower: '#e5896a', petal: '#ffd0bd', leaf: '#6fa67f', sun: '#ffd27d' },
  lavender: { flower: '#8b6fd0', petal: '#d9cbf5', leaf: '#6f9c8a', sun: '#ffe7b8' },
}

const STAGE_INDEX = { seedbed: 0, seedling: 1, sprout: 2, bud: 3, bloom: 4, grove: 5 }

const Flower = ({ x, y, r, color, petal }) => (
  <g>
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse key={angle} cx={x} cy={y - r * 0.9} rx={r * 0.5} ry={r * 0.95} fill={petal} transform={`rotate(${angle} ${x} ${y})`} opacity="0.95" />
    ))}
    <circle cx={x} cy={y} r={r * 0.42} fill={color} />
  </g>
)

const Leaf = ({ x, y, rotate, size, color }) => (
  <path
    d={`M0 0 C ${size * 0.5} ${-size * 0.6}, ${size * 1.2} ${-size * 0.2}, ${size * 1.3} 0 C ${size * 1.1} ${size * 0.35}, ${size * 0.4} ${size * 0.3}, 0 0 Z`}
    fill={color}
    transform={`translate(${x} ${y}) rotate(${rotate})`}
    opacity="0.92"
  />
)

/**
 * Garden drawn from SVG shapes. It only gets richer as milestones are reached: plants never
 * shrink, wilt, or die, and nothing is lost when someone skips a day.
 */
const Garden = ({ stage = 'seedbed', accent = 'berry', title = 'Your garden' }) => {
  const id = useId().replace(/:/g, '')
  const colours = ACCENTS[accent] || ACCENTS.berry
  const level = STAGE_INDEX[stage] ?? 0

  return (
    <svg className="garden" viewBox="0 0 320 210" role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8f3" />
          <stop offset="1" stopColor="#f4e4ea" />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor={colours.sun} stopOpacity="0.95" />
          <stop offset="0.5" stopColor={colours.sun} stopOpacity="0.35" />
          <stop offset="1" stopColor={colours.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4a684" />
          <stop offset="1" stopColor="#a8765a" />
        </linearGradient>
        <linearGradient id={`${id}-hillA`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcebdf" />
          <stop offset="1" stopColor="#c4dfcd" />
        </linearGradient>
        <linearGradient id={`${id}-hillB`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c0dccb" />
          <stop offset="1" stopColor="#a7cdb4" />
        </linearGradient>
      </defs>

      <rect width="320" height="210" fill={`url(#${id}-sky)`} />
      <circle cx="262" cy="44" r="58" fill={`url(#${id}-sun)`} />
      <circle cx="262" cy="44" r="16" fill={colours.sun} opacity="0.95" />
      {level >= 2 && (
        <g stroke={colours.sun} strokeWidth="2" strokeLinecap="round" opacity="0.55">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line key={angle} x1="262" y1="44" x2={262 + Math.cos((angle * Math.PI) / 180) * 30} y2={44 + Math.sin((angle * Math.PI) / 180) * 30} />
          ))}
        </g>
      )}
      {level >= 3 && (
        <g fill="#ffffff" opacity="0.85">
          <ellipse cx="78" cy="42" rx="26" ry="9" />
          <ellipse cx="96" cy="36" rx="17" ry="9" />
          <ellipse cx="190" cy="62" rx="20" ry="7" />
        </g>
      )}

      <path d="M0 132 Q80 96 160 124 T320 116 V210 H0 Z" fill={`url(#${id}-hillA)`} />
      <path d="M0 150 Q90 126 180 146 T320 140 V210 H0 Z" fill={`url(#${id}-hillB)`} />
      <path d="M0 168 Q120 156 200 170 T320 166 V210 H0 Z" fill={`url(#${id}-soil)`} />
      {level >= 3 && (
        <g fill="#f7f1ea" opacity="0.9">
          <ellipse cx="54" cy="184" rx="6" ry="3.5" />
          <ellipse cx="82" cy="192" rx="4" ry="2.6" />
          <ellipse cx="236" cy="186" rx="5" ry="3" />
        </g>
      )}

      {level === 0 && (
        <g>
          <ellipse cx="160" cy="178" rx="30" ry="6" fill="#8a5f47" opacity="0.5" />
          <circle cx="152" cy="176" r="3" fill="#6d4a37" />
          <circle cx="166" cy="174" r="2.4" fill="#6d4a37" />
          <path d="M160 170 q2 -6 6 -6" stroke={colours.leaf} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}

      {level >= 1 && (
        <g className="sway" style={{ transformOrigin: '160px 176px' }}>
          <path d="M160 178 Q158 150 160 124" stroke={colours.leaf} strokeWidth="3" fill="none" strokeLinecap="round" />
          <Leaf x={160} y={150} rotate={-40} size={16} color={colours.leaf} />
          <Leaf x={160} y={140} rotate={220} size={14} color="#7bb897" />
        </g>
      )}

      {level >= 2 && (
        <g className="sway" style={{ transformOrigin: '118px 180px' }}>
          <path d="M118 182 Q112 156 120 136" stroke={colours.leaf} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Leaf x={118} y={160} rotate={-150} size={12} color={colours.leaf} />
          <Leaf x={120} y={146} rotate={-20} size={11} color="#7bb897" />
        </g>
      )}

      {level >= 3 && (
        <g className="sway" style={{ transformOrigin: '206px 180px' }}>
          <path d="M206 182 Q210 150 200 128" stroke={colours.leaf} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <Leaf x={207} y={158} rotate={20} size={13} color={colours.leaf} />
          <Leaf x={204} y={142} rotate={170} size={12} color="#7bb897" />
        </g>
      )}

      {level >= 3 && <Flower x={200} y={118} r={level >= 4 ? 13 : 7} color={colours.flower} petal={colours.petal} />}

      {level >= 4 && (
        <g>
          <g className="sway" style={{ transformOrigin: '260px 180px' }}>
            <path d="M260 182 Q264 152 256 124" stroke={colours.leaf} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <Leaf x={261} y={156} rotate={-25} size={12} color={colours.leaf} />
          </g>
          <Flower x={120} y={130} r={level >= 4 ? 12 : 6} color={colours.flower} petal={colours.petal} />
          <Flower x={256} y={122} r={10} color={colours.flower} petal={colours.petal} />
        </g>
      )}

      {level >= 5 && (
        <g>
          <rect x="34" y="136" width="8" height="34" rx="3" fill="#8a6548" />
          <circle cx="38" cy="122" r="22" fill={colours.leaf} opacity="0.92" />
          <circle cx="28" cy="130" r="14" fill="#7bb897" opacity="0.9" />
          <circle cx="50" cy="128" r="12" fill="#6aa98a" opacity="0.9" />
          <Flower x={44} y={114} r={6} color={colours.flower} petal={colours.petal} />
          <path d="M92 150 q-6 -10 2 -14 q8 4 2 14" fill={colours.flower} opacity="0.85" className="sway" style={{ transformOrigin: '92px 150px' }} />
        </g>
      )}

      {level >= 4 && (
        <g fill="#fff7c2">
          <circle className="twinkle" cx="140" cy="106" r="2.2" />
          <circle className="twinkle b" cx="186" cy="150" r="1.9" />
          <circle className="twinkle" cx="232" cy="96" r="1.8" />
        </g>
      )}
    </svg>
  )
}

export default Garden

/** Ring progress toward the next garden stage. The stroke animates with a CSS transition. */
export const JourneyRing = ({ progress = 0, label, sublabel }) => {
  const size = 180
  const radius = 76
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)
  const angle = -Math.PI / 2 + Math.PI * 2 * clamped
  const knobX = size / 2 + radius * Math.cos(angle)
  const knobY = size / 2 + radius * Math.sin(angle)

  return (
    <div className="ring-wrap" role="img" aria-label={`${Math.round(clamped * 100)}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9a3bf" />
            <stop offset="0.5" stopColor="#b0527f" />
            <stop offset="1" stopColor="#6b2d5d" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth="14" />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {clamped > 0 && (
          <circle className="ring-glow" cx={knobX} cy={knobY} r="8" fill="#fff" stroke="#b0527f" strokeWidth="3" />
        )}
      </svg>
      <div className="ring-center">
        <strong>{label}</strong>
        <small>{sublabel}</small>
      </div>
    </div>
  )
}
