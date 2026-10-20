import React from 'react'

// Premium range slider. The filled track and bubble follow the value, and motion is CSS only.
const Slider = ({ id, label, min = 1, max = 10, step = 1, value, onChange, format, hint, tone = 'berry' }) => {
  const percent = ((Number(value) - min) / (max - min)) * 100
  const display = format ? format(value) : value
  return (
    <div className={`slider slider-${tone}`} style={{ '--fill': `${percent}%` }}>
      <div className="slider-head">
        <label htmlFor={id} className="slider-label">{label}</label>
        <output htmlFor={id} className="slider-bubble" aria-live="polite">{display}</output>
      </div>
      <input
        id={id}
        className="slider-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <p className="slider-hint">{hint}</p>}
    </div>
  )
}

export default Slider
