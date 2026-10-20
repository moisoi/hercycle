import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { subDays, format, parseISO } from 'date-fns'

import { celebrate } from '../lib/celebrate'
import { eligibleMilestones } from '../lib/journey'
import { toDateKey } from '../lib/cycle'
import { awardMilestone, DEFAULT_JOURNEY, getPrefs } from '../lib/repo'
import { KEYS, useStoredJson } from '../lib/store'

const RANGES = [7, 30, 90, 'all']
const EMPTY = Object.freeze({})

const average = (values) => (values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null)

/** Line chart of mood and energy across the selected range. Drawn in SVG, no chart library. */
function TrendChart({ points, labels, ariaLabel }) {
  const width = 640
  const height = 220
  const pad = 28
  const toX = (index) => pad + (points.length <= 1 ? (width - pad * 2) / 2 : (index / (points.length - 1)) * (width - pad * 2))
  const toY = (value) => pad + ((10 - value) / 9) * (height - pad * 2)
  const line = (key) => {
    const valid = points.map((point, index) => ({ x: toX(index), y: point[key] == null ? null : toY(point[key]) }))
    let path = ''
    let pen = false
    for (const item of valid) {
      if (item.y == null) {
        pen = false
        continue
      }
      path += `${pen ? 'L' : 'M'}${item.x.toFixed(1)} ${item.y.toFixed(1)} `
      pen = true
    }
    return { path: path.trim(), dots: valid.filter((item) => item.y != null) }
  }
  const mood = line('mood')
  const energy = line('energy')

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      {[2, 4, 6, 8, 10].map((value) => (
        <line key={value} className="grid-line" x1={pad} x2={width - pad} y1={toY(value)} y2={toY(value)} />
      ))}
      {mood.path && <path className="line-mood" d={mood.path} />}
      {energy.path && <path className="line-energy" d={energy.path} />}
      {mood.dots.map((dot, index) => (
        <circle key={`m${index}`} className="dot-mood" cx={dot.x} cy={dot.y} r="3.5" />
      ))}
      {energy.dots.map((dot, index) => (
        <circle key={`e${index}`} className="dot-energy" cx={dot.x} cy={dot.y} r="3" />
      ))}
      {labels.length > 0 && (
        <>
          <text x={pad} y={height - 6} fontSize="12" fill="#7d7280">{labels[0]}</text>
          <text x={width - pad} y={height - 6} fontSize="12" fill="#7d7280" textAnchor="end">{labels[labels.length - 1]}</text>
        </>
      )}
    </svg>
  )
}

/**
 * Insights. One load of check-ins; the range filter works in memory. Nothing here scores the
 * user, and intimacy logs are never shown on this screen.
 */
const Insights = () => {
  const { t } = useTranslation()
  const checkins = useStoredJson(KEYS.checkins, EMPTY)
  const journey = useStoredJson(KEYS.journey, DEFAULT_JOURNEY)
  const prefs = getPrefs()
  const [range, setRange] = useState(30)

  const allDates = useMemo(() => Object.keys(checkins).sort(), [checkins])

  const filtered = useMemo(() => {
    if (range === 'all') return allDates
    const since = toDateKey(subDays(new Date(), range - 1))
    return allDates.filter((key) => key >= since)
  }, [allDates, range])

  const points = filtered.map((key) => ({ key, mood: checkins[key].mood ?? null, energy: checkins[key].energy ?? null }))
  const moods = points.map((point) => point.mood).filter((value) => value != null)
  const energies = points.map((point) => point.energy).filter((value) => value != null)

  const last30 = allDates.filter((key) => key >= toDateKey(subDays(new Date(), 29))).length

  // Reviewing a month counts as a monthly review, once, when there is enough to review.
  useEffect(() => {
    if (!prefs.gamification) return
    if (last30 >= 7 && !journey.milestones.monthly_review) {
      const eligible = eligibleMilestones({ reviewedMonth: true })
      if (eligible.some((key) => awardMilestone(key))) celebrate('milestone', { pattern: 'sparkle', color: '#c26c95' })
    }
  }, [last30, journey.milestones.monthly_review, prefs.gamification])

  const labels = points.length
    ? [format(parseISO(points[0].key), 'd MMM'), format(parseISO(points[points.length - 1].key), 'd MMM')]
    : []

  const rangeLabel = (value) => (value === 'all' ? t('insights.rangeAll') : t('insights.rangeDays', { count: value }))

  return (
    <div className="section-gap">
      <header>
        <p className="card-kicker">{t('insights.kicker')}</p>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.9rem, 5vw, 2.5rem)', marginTop: 6 }}>{t('insights.title')}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{t('insights.intro')}</p>
      </header>

      <div className="seg" role="group" aria-label={t('insights.rangeLabel')}>
        {RANGES.map((value) => (
          <button key={value} type="button" aria-pressed={range === value} onClick={() => setRange(value)}>
            {rangeLabel(value)}
          </button>
        ))}
      </div>

      <section className="grid-2">
        <div className="card stat">
          <span className="card-kicker">{t('insights.daysLogged')}</span>
          <strong>{points.length}</strong>
          <small>{t('insights.daysLoggedHint')}</small>
        </div>
        <div className="card stat">
          <span className="card-kicker">{t('insights.averageMood')}</span>
          <strong>{average(moods) ?? '–'}</strong>
          <small>{t('insights.outOfTen')}</small>
        </div>
        <div className="card stat">
          <span className="card-kicker">{t('insights.averageEnergy')}</span>
          <strong>{average(energies) ?? '–'}</strong>
          <small>{t('insights.outOfTen')}</small>
        </div>
        <div className="card stat">
          <span className="card-kicker">{t('insights.last30')}</span>
          <strong>{last30}</strong>
          <small>{t('insights.last30Hint')}</small>
        </div>
      </section>

      <section className="card stack" aria-labelledby="trend-title">
        <div className="between">
          <h2 id="trend-title" style={{ fontSize: '1.2rem' }}>{t('insights.trendTitle')}</h2>
          <div className="row" style={{ gap: 14, fontSize: '0.86rem' }}>
            <span><span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--berry)', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} />{t('checkIn.mood')}</span>
            <span><span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 3, background: 'var(--follicular)', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} />{t('checkIn.energy')}</span>
          </div>
        </div>
        {points.length === 0 ? (
          <p className="muted">{t('insights.empty')}</p>
        ) : (
          <TrendChart points={points} labels={labels} ariaLabel={t('insights.trendAria', { count: points.length })} />
        )}
        <p className="muted" style={{ fontSize: '0.86rem' }}>{t('insights.rangeNote')}</p>
      </section>
    </div>
  )
}

export default Insights
