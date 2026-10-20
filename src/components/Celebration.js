import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Logo from './Logo'
import { CELEBRATE_EVENT } from '../lib/celebrate'

const DURATIONS = { milestone: 2600, level: 2600, stage: 3200 }
const PIECES = { milestone: 64, level: 64, stage: 110 }

// Full-screen celebration for milestones, stage-ups, and level-ups. It never takes focus or clicks.
const Celebration = () => {
  const { t } = useTranslation()
  const [item, setItem] = useState(null)

  useEffect(() => {
    let timer = null
    const onCelebrate = (event) => {
      const { kind, title, body, stage } = event.detail || {}
      if (!DURATIONS[kind]) return
      setItem({ id: Date.now(), kind, title, body, stage })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setItem(null), DURATIONS[kind])
    }
    window.addEventListener(CELEBRATE_EVENT, onCelebrate)
    return () => {
      window.removeEventListener(CELEBRATE_EVENT, onCelebrate)
      window.clearTimeout(timer)
    }
  }, [])

  if (!item) return null
  const pieces = Array.from({ length: PIECES[item.kind] || 64 }, (_, index) => index)
  return (
    <div className={`celebration celebration-${item.kind}`} key={item.id} aria-hidden="true">
      <div className="celebration-pieces">
        {pieces.map((index) => (
          <span
            key={index}
            className={`celebration-piece piece-${index % 6}`}
            style={{
              '--x': `${(index * 37) % 100}%`,
              '--delay': `${(index % 12) * 60}ms`,
              '--drift': `${((index * 13) % 40) - 20}px`,
            }}
          />
        ))}
      </div>
      <div className="celebration-card">
        <Logo size={64} />
        <strong>{item.title || t(`celebrate.${item.kind}`)}</strong>
        {item.body && <span>{item.body}</span>}
      </div>
    </div>
  )
}

export default Celebration
