import React, { useEffect, useRef, useState } from 'react'
import { LuCheck, LuCircleCheck, LuCircleAlert } from 'react-icons/lu'
import { celebrate } from '../lib/celebrate'

const burstAt = (el, detail) => {
  if (!el) return
  const rect = el.getBoundingClientRect()
  celebrate('burst', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, ...detail })
}

/**
 * Premium slider. A real range input (keyboard and screen-reader friendly) with a gradient
 * fill, a value bubble that follows the thumb, and a small burst when the user lets go.
 */
export const Slider = ({ id, label, value, min, max, step = 1, onChange, tint = 'var(--berry)', unit = '', lowLabel, highLabel, pattern = 'sparkle', valueText }) => {
  const percent = ((value - min) / (max - min)) * 100
  const trackRef = useRef(null)
  const display = valueText ?? `${value}${unit}`

  const release = () => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    celebrate('burst', {
      x: rect.left + (rect.width * percent) / 100,
      y: rect.top + rect.height / 2,
      color: tint,
      pattern,
      count: 8,
      kind: 'progress',
    })
  }

  return (
    <div className="slider" style={{ '--p': `${percent}%`, '--tint': tint }} ref={trackRef}>
      <div className="slider-head">
        <label htmlFor={id} className="field-label" style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>
          {label}
        </label>
        <span className="slider-value" aria-hidden="true">
          {value}
          {unit && <small>{unit}</small>}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <span className="slider-bubble" aria-hidden="true">
          {display}
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={display}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerUp={release}
          onKeyUp={release}
        />
      </div>
      {(lowLabel || highLabel) && (
        <div className="slider-ends">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  )
}

/** Selection card with pressed state and a context-matched burst on select. */
export const SelectCard = ({ pressed, onSelect, icon, title, hint, tint, pattern = 'sparkle', burstCount = 14, burstKind = 'burst', className = '' }) => {
  const ref = useRef(null)
  return (
    <button
      ref={ref}
      type="button"
      className={`select-card ${className}`.trim()}
      aria-pressed={pressed}
      style={{ '--tint': tint }}
      onClick={() => {
        onSelect()
        if (burstCount > 0) burstAt(ref.current, { color: tint, pattern, count: burstCount, kind: burstKind })
      }}
    >
      <span className="sc-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="sc-title">{title}</span>
      {hint && <span className="sc-hint">{hint}</span>}
      <span className="sc-check" aria-hidden="true">
        <LuCheck />
      </span>
    </button>
  )
}

export const Switch = ({ id, checked, onChange, label, hint }) => (
  <label className="switch" htmlFor={id}>
    <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="track" aria-hidden="true" />
    <span className="switch-label">
      <strong>{label}</strong>
      {hint && <small>{hint}</small>}
    </span>
  </label>
)

/**
 * Save button with idle, saving, saved, and error states. It is announced to screen readers,
 * and the status text stays visible long enough to read.
 */
export const SaveButton = ({ onSave, idleLabel, savingLabel, savedLabel, errorLabel, statusText, savedText, disabled = false, variant = '' }) => {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const run = async () => {
    setStatus('saving')
    setMessage('')
    try {
      await onSave()
      setStatus('saved')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setStatus('idle'), 2600)
    } catch (error) {
      setStatus('error')
      setMessage(error?.message || errorLabel)
    }
  }

  return (
    <div className="save-row">
      <button type="button" className={`btn save-btn ${variant}`.trim()} onClick={run} disabled={disabled || status === 'saving'} aria-busy={status === 'saving'}>
        <span className="sb-icon" aria-hidden="true">
          {status === 'saving' && <span className="spinner" />}
          {status === 'saved' && <LuCircleCheck />}
          {status === 'error' && <LuCircleAlert />}
        </span>
        {status === 'saving' ? savingLabel : status === 'saved' ? savedLabel : idleLabel}
      </button>
      <span className="save-status" role="status" aria-live="polite">
        {status === 'saved' && (
          <span className="ok">
            {savedText}
          </span>
        )}
        {status === 'error' && <span className="err">{message}</span>}
        {status === 'idle' && statusText && <span>{statusText}</span>}
      </span>
    </div>
  )
}
