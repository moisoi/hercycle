import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { runAwards, setFlag } from '../lib/awards'
import { parseDateKey, toDateKey } from '../lib/cycle'
import { formatDate, formatNumber } from '../lib/i18n'
import { useCheckins } from '../lib/store'

// Ranges are applied in memory from one load of the device cache. Changing the range never refetches.
const RANGES = [
  { key: 7, label: 'range7' },
  { key: 30, label: 'range30' },
  { key: 90, label: 'range90' },
  { key: 'all', label: 'rangeAll' },
]

const PHASE_KEYS = ['menstrual', 'follicular', 'ovulatory', 'luteal']

const average = (values) => {
  const numbers = values.filter(Number.isFinite)
  if (!numbers.length) return null
  return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10
}

const Sparkline = ({ values, label }) => {
  const points = values.filter((item) => Number.isFinite(item.value))
  if (points.length < 2) return <p className="card-copy">{label}</p>
  const width = 320
  const height = 110
  const step = width / (points.length - 1)
  const path = points.map((item, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${(height - ((item.value - 1) / 9) * (height - 16) - 8).toFixed(1)}`).join(' ')
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={path} className="sparkline-line" />
      {points.map((item, index) => (
        <circle key={item.date} cx={index * step} cy={height - ((item.value - 1) / 9) * (height - 16) - 8} r="3.5" className="sparkline-dot" />
      ))}
    </svg>
  )
}

const Insights = () => {
  const { t, i18n } = useTranslation()
  const checkins = useCheckins()
  const [range, setRange] = useState(30)

  // Viewing insights is a private reflection. It is recorded once, and it never shows a score.
  // Idempotent: the flag and milestone are each written once, so re-running on a language change is safe.
  useEffect(() => {
    setFlag('reflection')
    runAwards(t)
  }, [t])

  const chooseRange = (key) => {
    setRange(key)
    if (key === 30 || key === 90 || key === 'all') {
      setFlag('reviewedMonth')
      runAwards(t)
    }
  }

  const stats = useMemo(() => {
    const today = new Date()
    const cutoff = range === 'all' ? null : toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (range - 1)))
    const today0 = toDateKey(today)
    const entries = Object.entries(checkins)
      .filter(([date]) => parseDateKey(date) && date <= today0 && (!cutoff || date >= cutoff))
      .sort(([a], [b]) => (a < b ? -1 : 1))

    const values = entries.map(([, entry]) => entry)
    const phaseCounts = PHASE_KEYS.reduce((acc, key) => ({ ...acc, [key]: values.filter((item) => item.phase === key).length }), {})
    const phaseTotal = Object.values(phaseCounts).reduce((sum, value) => sum + value, 0)
    return {
      days: entries.length,
      mood: average(values.map((item) => item.mood)),
      energy: average(values.map((item) => item.energy)),
      periodDays: values.filter((item) => item.period).length,
      phaseCounts,
      phaseTotal,
      moodSeries: entries.map(([date, entry]) => ({ date, value: entry.mood })),
      energySeries: entries.map(([date, entry]) => ({ date, value: entry.energy })),
    }
  }, [checkins, range])

  const none = stats.days === 0

  return (
    <div className="page insights-page">
      <section className="card">
        <h2 className="card-title">{t('insights.rangeHeading')}</h2>
        <div className="segmented" role="radiogroup" aria-label={t('insights.rangeHeading')}>
          {RANGES.map(({ key, label }) => (
            <button key={key} type="button" role="radio" aria-checked={range === key} className={`segment${range === key ? ' is-selected' : ''} spot`} onClick={() => chooseRange(key)}>
              {t(`insights.${label}`)}
            </button>
          ))}
        </div>
      </section>

      {none ? (
        <section className="card empty-card">
          <h2 className="card-title">{t('insights.emptyTitle')}</h2>
          <p className="card-copy">{t('insights.emptyCopy')}</p>
        </section>
      ) : (
        <>
          <section className="stat-grid" aria-label={t('insights.summary')}>
            <div className="stat-card spot"><span>{t('insights.daysLogged')}</span><strong>{formatNumber(stats.days, i18n.language)}</strong></div>
            <div className="stat-card spot"><span>{t('insights.averageMood')}</span><strong>{stats.mood ?? '–'}</strong></div>
            <div className="stat-card spot"><span>{t('insights.averageEnergy')}</span><strong>{stats.energy ?? '–'}</strong></div>
            <div className="stat-card spot"><span>{t('insights.periodDays')}</span><strong>{formatNumber(stats.periodDays, i18n.language)}</strong></div>
          </section>

          <section className="card">
            <h2 className="card-title">{t('insights.moodTrend')}</h2>
            <Sparkline values={stats.moodSeries} label={t('insights.moodTrend')} />
            <p className="card-footnote">{t('insights.trendNote')}</p>
          </section>

          <section className="card">
            <h2 className="card-title">{t('insights.energyTrend')}</h2>
            <Sparkline values={stats.energySeries} label={t('insights.energyTrend')} />
          </section>

          <section className="card">
            <h2 className="card-title">{t('insights.phaseMix')}</h2>
            <ul className="phase-bars">
              {PHASE_KEYS.map((key) => {
                const count = stats.phaseCounts[key]
                const percent = stats.phaseTotal ? Math.round((count / stats.phaseTotal) * 100) : 0
                return (
                  <li key={key} className={`phase-bar phase-${key}`}>
                    <span>{t(`phase.${key}`)}</span>
                    <div className="phase-bar-track" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
                    <strong>{count}</strong>
                  </li>
                )
              })}
            </ul>
            <p className="card-footnote">{t('insights.phaseNote')}</p>
          </section>
        </>
      )}
      <p className="card-footnote">{t('insights.updated', { date: formatDate(new Date(), { day: 'numeric', month: 'long' }) })}</p>
    </div>
  )
}

export default Insights
