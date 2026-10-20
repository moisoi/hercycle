import React, { useId } from 'react'

/**
 * HerCycle mark: a lotus bud. Drawn as SVG so it scales cleanly for the splash, the header,
 * and favicons. Hover glow comes from CSS drop-shadow, so it follows the silhouette.
 */
const Logo = ({ className = '', title = 'HerCycle' }) => {
  const id = useId().replace(/:/g, '')
  return (
    <span className={`logo-mark ${className}`.trim()} role="img" aria-label={title}>
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-petal`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3c6d6" />
            <stop offset="0.55" stopColor="#c26c95" />
            <stop offset="1" stopColor="#6b2d5d" />
          </linearGradient>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffe8e1" />
            <stop offset="1" stopColor="#d4a3b2" />
          </linearGradient>
        </defs>
        <path d="M32 41 C21 39 14 27 16 13 C27 19 31 30 32 41 Z" fill={`url(#${id}-petal)`} opacity="0.92" />
        <path d="M32 41 C43 39 50 27 48 13 C37 19 33 30 32 41 Z" fill={`url(#${id}-petal)`} opacity="0.92" />
        <path d="M32 43 C23 36 21 21 32 7 C43 21 41 36 32 43 Z" fill={`url(#${id}-petal)`} />
        <path d="M32 30 C29 26 29 21 32 16 C35 21 35 26 32 30 Z" fill="#fff6f2" opacity="0.7" />
        <path d="M12 46 Q32 58 52 46 Q42 52 32 52 Q22 52 12 46 Z" fill={`url(#${id}-base)`} />
      </svg>
    </span>
  )
}

export default Logo
