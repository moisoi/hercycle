import React from 'react'

// Card-level sparkle that replays each time its key changes. Context keys the palette, so a
// burst for one feeling or vibe looks different from another.
const CardBurst = ({ burstKey, context = 'default' }) => {
  if (!burstKey) return null
  return (
    <span key={burstKey} className={`card-burst burst-${context}`} aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ '--i': index }} />)}
    </span>
  )
}

export default CardBurst
