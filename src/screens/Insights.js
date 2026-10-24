import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { subDays } from 'date-fns'
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCompass,
  FiDownload,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiPlus,
  FiSun,
} from 'react-icons/fi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import CardBurst from '../components/CardBurst'
import { loadPreferences, loadUserCycles } from '../lib/care'
import { loadJourneyState, MILESTONE_CATALOG, recordJourneyActivity } from '../lib/journey'
import { averageCycleLength, formatShortDate } from '../lib/period'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

const supportsCanvas2D = () => {
  if (typeof document === 'undefined') return false
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) return false
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe && typeof probe.getContext === 'function' && probe.getContext('2d'))
  } catch {
    return false
  }
}

const RANGE_OPTIONS = [
  { key: '7d', days: 7, labelKey: 'range7d' },
  { key: '14d', days: 14, labelKey: 'range14d' },
  { key: '30d', days: 30, labelKey: 'range30d' },
  { key: '90d', days: 90, labelKey: 'range90d' },
  { key: 'all', days: null, labelKey: 'rangeAll' },
]

const FLOW_SCORE = {
  none: 0,
  spotting: 2,
  light: 4,
  medium: 6,
  heavy: 8,
}

const buildIllustrativePreviewEntries = () => {
  const specs = [
    { offset: 13, phase: 'menstrual', mood: 5, energy: 4, period: 'medium' },
    { offset: 11, phase: 'menstrual', mood: 6, energy: 5, period: 'light' },
    { offset: 9, phase: 'follicular', mood: 7, energy: 7, period: 'none' },
    { offset: 7, phase: 'follicular', mood: 8, energy: 8, period: 'none' },
    { offset: 5, phase: 'ovulatory', mood: 9, energy: 9, period: 'none' },
    { offset: 3, phase: 'luteal', mood: 7, energy: 6, period: 'none' },
    { offset: 1, phase: 'luteal', mood: 6, energy: 5, period: 'spotting' },
  ]
  const today = new Date()
  return specs.map((item, idx) => {
    const d = subDays(today, item.offset)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return {
      id: `preview-${idx}`,
      date: `${yyyy}-${mm}-${dd}`,
      phase: item.phase,
      mood: item.mood,
      energy: item.energy,
      period: item.period,
      isIllustrative: true,
    }
  })
}

const FallbackSvgChart = ({ cycles, locale, showMood, showEnergy, showFlow, moodLabel }) => {
  const width = 620
  const height = 215
  const padX = 36
  const padY = 24
  const usableW = width - padX * 2
  const usableH = height - padY * 2

  const pointFor = (idx, rawValue) => {
    const x =
      cycles.length === 1
        ? width / 2
        : padX + (idx / Math.max(1, cycles.length - 1)) * usableW
    const clamped = Math.min(10, Math.max(0, Number(rawValue) || 0))
    const y = padY + usableH - (clamped / 10) * usableH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  const moodPts = cycles.map((c, idx) => pointFor(idx, c.mood)).join(' ')
  const energyPts = cycles.map((c, idx) => pointFor(idx, c.energy)).join(' ')
  const flowPts = cycles
    .map((c, idx) => pointFor(idx, FLOW_SCORE[c.period] ?? 0))
    .join(' ')

  return (
    <div className="hc-svg-chart-wrap" data-testid="insights-svg-fallback">
      <svg viewBox={`0 0 ${width} ${height}`} className="hc-svg-chart" role="img" aria-label={moodLabel}>
        {[2, 5, 8, 10].map((val) => {
          const y = padY + usableH - (val / 10) * usableH
          return (
            <g key={val}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#F1E6EB" strokeDasharray="4 4" />
              <text x="10" y={y + 4} fill="#9C8A96" fontSize="10">
                {val}
              </text>
            </g>
          )
        })}

        {showFlow && (
          <polyline
            fill="none"
            stroke="#9F70B5"
            strokeWidth="2.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            points={flowPts}
          />
        )}
        {showMood && (
          <polyline
            fill="none"
            stroke="#BC627E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={moodPts}
          />
        )}
        {showEnergy && (
          <polyline
            fill="none"
            stroke="#5F8D65"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={energyPts}
          />
        )}

        {cycles.map((entry, idx) => {
          const [mx, my] = pointFor(idx, entry.mood).split(',')
          const [ex, ey] = pointFor(idx, entry.energy).split(',')
          return (
            <g key={entry.id || entry.date}>
              {showMood && <circle cx={mx} cy={my} r="4.3" fill="#BC627E" stroke="#FFFFFF" strokeWidth="1.6" />}
              {showEnergy && <circle cx={ex} cy={ey} r="4.1" fill="#5F8D65" stroke="#FFFFFF" strokeWidth="1.6" />}
              <text x={mx} y={height - 4} textAnchor="middle" fill="#8E7C88" fontSize="9.5">
                {formatShortDate(entry.date, locale)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const InsightStat = ({
  icon: Icon,
  label,
  badge,
  primaryValue,
  unit = '',
  isPlaceholder = false,
  progressPct = 0,
  subtext = '',
  accent = 'rose',
  onAction,
}) => (
  <article
    className={`insight-stat-card hc-insight-kpi-card hc-kpi-accent-${accent} hc-spotlight-card${
      isPlaceholder ? ' is-awaiting' : ''
    }`}
    onClick={onAction || undefined}
    style={onAction ? { cursor: 'pointer' } : undefined}
  >
    <div className="hc-insight-kpi-top">
      <div className={`insight-stat-icon insight-stat-icon-${accent}`}>
        <Icon aria-hidden="true" />
      </div>
      <div className="hc-insight-kpi-meta">
        <span className="hc-insight-kpi-label">{label}</span>
        {badge ? <i className="hc-insight-kpi-pill">{badge}</i> : null}
      </div>
    </div>

    <div className="hc-insight-kpi-figure-row">
      <strong className={`hc-insight-kpi-figure${isPlaceholder ? ' is-placeholder' : ''}`}>
        {primaryValue}
      </strong>
      {unit ? <span className="hc-insight-kpi-unit">{unit}</span> : null}
    </div>

    <div className="hc-kpi-meter" aria-hidden="true">
      <i className={`is-${accent}`} style={{ width: `${Math.max(12, progressPct)}%` }} />
    </div>

    {subtext ? <small className="hc-kpi-subtext">{subtext}</small> : null}
  </article>
)

const Insights = ({ session }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userId = session?.user?.id || null
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'

  const [cycles, setCycles] = useState([])
  const [prefs, setPrefs] = useState(() => loadPreferences())
  const [journeyState, setJourneyState] = useState(() => loadJourneyState(userId))
  const [range, setRange] = useState('30d')
  const [visibleSeries, setVisibleSeries] = useState({ mood: true, energy: true, flow: false })
  const [sampleMode, setSampleMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [cardBurstKey, setCardBurstKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const canvasReady = useMemo(() => supportsCanvas2D(), [])

  const refreshInsights = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await loadUserCycles(userId)
      setCycles(data)
      setJourneyState(loadJourneyState(userId))
      if (data.length >= 2) {
        setSampleMode(false)
      }
    } catch (err) {
      console.error('Could not load insights:', err)
      setError(t('errorGeneric'))
    } finally {
      setIsLoading(false)
    }
  }, [t, userId])

  useEffect(() => {
    refreshInsights()
    const onPrefs = () => setPrefs(loadPreferences())
    window.addEventListener('hercycle:preferences-changed', onPrefs)
    return () => window.removeEventListener('hercycle:preferences-changed', onPrefs)
  }, [refreshInsights])

  const sampleEntries = useMemo(() => buildIllustrativePreviewEntries(), [])

  const filteredRealAsc = useMemo(() => {
    const activeOpt = RANGE_OPTIONS.find((item) => item.key === range) || RANGE_OPTIONS[2]
    const cutoff = activeOpt.days ? subDays(new Date(), activeOpt.days) : null
    return [...cycles]
      .filter((entry) => {
        if (!entry?.date) return false
        if (!cutoff) return true
        return new Date(`${entry.date}T00:00:00`) >= cutoff
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  }, [cycles, range])

  const activeSeriesAsc = useMemo(
    () => (sampleMode ? sampleEntries : filteredRealAsc),
    [filteredRealAsc, sampleEntries, sampleMode]
  )

  useEffect(() => {
    if (activeSeriesAsc.length > 0) {
      setSelectedDate((prev) =>
        activeSeriesAsc.some((item) => item.date === prev)
          ? prev
          : activeSeriesAsc[activeSeriesAsc.length - 1].date
      )
    } else {
      setSelectedDate('')
    }
  }, [activeSeriesAsc])

  const moodAverage = useMemo(() => {
    const vals = activeSeriesAsc.map((c) => Number(c.mood)).filter((n) => Number.isFinite(n) && n > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [activeSeriesAsc])

  const energyAverage = useMemo(() => {
    const vals = activeSeriesAsc.map((c) => Number(c.energy)).filter((n) => Number.isFinite(n) && n > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [activeSeriesAsc])

  const cycleSpanAvg = useMemo(() => averageCycleLength(cycles), [cycles])

  const patternSynthesis = useMemo(() => {
    if (!activeSeriesAsc.length) return null
    const byPhase = {}
    activeSeriesAsc.forEach((entry) => {
      if (!entry.phase) return
      if (!byPhase[entry.phase]) byPhase[entry.phase] = { energy: [], mood: [] }
      if (Number.isFinite(Number(entry.energy))) byPhase[entry.phase].energy.push(Number(entry.energy))
      if (Number.isFinite(Number(entry.mood))) byPhase[entry.phase].mood.push(Number(entry.mood))
    })

    let brightestPhase = null
    let brightestVal = -1
    let gentlestPhase = null
    let gentlestVal = 99

    Object.entries(byPhase).forEach(([phaseKey, bucket]) => {
      if (!bucket.energy.length) return
      const avg = bucket.energy.reduce((a, b) => a + b, 0) / bucket.energy.length
      if (avg > brightestVal) {
        brightestVal = avg
        brightestPhase = phaseKey
      }
      if (avg < gentlestVal) {
        gentlestVal = avg
        gentlestPhase = phaseKey
      }
    })

    return {
      brightestPhase,
      brightestVal: brightestVal > 0 ? brightestVal.toFixed(1) : null,
      gentlestPhase,
      gentlestVal: gentlestVal < 99 ? gentlestVal.toFixed(1) : null,
    }
  }, [activeSeriesAsc])

  const selectedEntry = useMemo(
    () =>
      activeSeriesAsc.find((item) => item.date === selectedDate) ||
      activeSeriesAsc[activeSeriesAsc.length - 1] ||
      null,
    [activeSeriesAsc, selectedDate]
  )

  const reviewed = Boolean(journeyState.reviewedMonthlySummary)

  const handleMarkReviewed = () => {
    const result = recordJourneyActivity(userId, 'summary_review', {
      labelEn: 'Reviewed personal Insights summary',
      labelAm: 'የግንዛቤዎች ማጠቃለያ ታየ',
    })
    setJourneyState(result.state)
    setCardBurstKey((prev) => prev + 1)
  }

  const handleToggleSeries = (key) => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!next.mood && !next.energy && !next.flow) {
        return prev
      }
      return next
    })
  }

  const handleExportCsv = () => {
    if (!cycles.length) return
    const header = 'date,phase,mood,energy,flow\n'
    const rows = cycles
      .map((c) => `${c.date || ''},${c.phase || ''},${c.mood ?? ''},${c.energy ?? ''},${c.period || ''}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hercycle-insights-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setCardBurstKey((prev) => prev + 1)
  }

  const chartData = useMemo(() => {
    const datasets = []
    if (visibleSeries.mood) {
      datasets.push({
        label: t('mood'),
        data: activeSeriesAsc.map((c) => Number(c.mood) || 0),
        borderColor: '#BC627E',
        backgroundColor: 'rgba(188, 98, 126, 0.13)',
        pointBackgroundColor: '#BC627E',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6.5,
        borderWidth: 2.8,
        tension: 0.38,
        fill: true,
      })
    }
    if (visibleSeries.energy) {
      datasets.push({
        label: t('energy'),
        data: activeSeriesAsc.map((c) => Number(c.energy) || 0),
        borderColor: '#5F8D65',
        backgroundColor: 'rgba(95, 141, 101, 0.11)',
        pointBackgroundColor: '#5F8D65',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6.5,
        borderWidth: 2.6,
        tension: 0.38,
        fill: true,
      })
    }
    if (visibleSeries.flow) {
      datasets.push({
        label: t('periodFlow'),
        data: activeSeriesAsc.map((c) => FLOW_SCORE[c.period] ?? 0),
        borderColor: '#9F70B5',
        backgroundColor: 'rgba(159, 112, 181, 0.08)',
        borderDash: [5, 4],
        pointBackgroundColor: '#9F70B5',
        pointRadius: 3.8,
        borderWidth: 2,
        tension: 0.34,
        fill: false,
      })
    }
    return {
      labels: activeSeriesAsc.map((c) => formatShortDate(c.date, locale)),
      datasets,
    }
  }, [activeSeriesAsc, locale, t, visibleSeries])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      onClick: (_, elements) => {
        if (elements?.length) {
          const idx = elements[0].index
          if (activeSeriesAsc[idx]) setSelectedDate(activeSeriesAsc[idx].date)
        }
      },
      plugins: {
        // Custom interactive jewel legend key is rendered above the chart for crisp editorial UI/UX
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(65, 44, 57, 0.95)',
          padding: 12,
          cornerRadius: 12,
          titleFont: { size: 12, weight: '700' },
          bodyFont: { size: 11.5 },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, color: '#978592', font: { size: 11 } },
          grid: { color: 'rgba(232, 216, 224, 0.55)' },
        },
        x: {
          ticks: {
            color: '#8A7885',
            font: { size: 11 },
            autoSkip: true,
            maxTicksLimit:
              typeof window !== 'undefined' && window.innerWidth < 460
                ? 5
                : typeof window !== 'undefined' && window.innerWidth < 820
                ? 7
                : 11,
            maxRotation: 0,
          },
          grid: { display: false },
        },
      },
    }),
    [activeSeriesAsc, locale, t]
  )

  const recordedCount = sampleMode ? activeSeriesAsc.length : filteredRealAsc.length

  return (
    <div className="insights-page">
      {/* Single, non-redundant Editorial Callout ("Curiosity, not certainty.") */}
      <motion.section
        className="insight-explainer hc-curiosity-callout hc-spotlight-card"
        style={{ position: 'relative' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <div className="hc-curiosity-medallion" aria-hidden="true">
          <FiCompass />
        </div>

        <div className="hc-curiosity-body">
          <div className="hc-curiosity-kicker-row">
            <span className="eyebrow-label">{t('insightsBodyLensEyebrow')}</span>{' '}
            {sampleMode && (
              <span className="hc-preview-mode-pill">{t('insightsSamplePreviewBadge')}</span>
            )}
          </div>
          <h3>{t('curiosityNotCertainty')}</h3>
          <p>{t('curiosityCalloutBody')}</p>
        </div>

        <div className="hc-curiosity-actions">
          {filteredRealAsc.length < 2 && (
            <button
              type="button"
              className={`hc-sample-toggle-btn${sampleMode ? ' is-active' : ''}`}
              onClick={() => {
                setSampleMode((prev) => !prev)
                setCardBurstKey((prev) => prev + 1)
              }}
            >
              <FiEye aria-hidden="true" />
              <span>
                {sampleMode ? t('insightsShowSavedData') : t('insightsPreviewSampleBtn')}
              </span>
            </button>
          )}
          <button
            type="button"
            className="hc-curiosity-luna-link"
            onClick={() => navigate('/luna')}
          >
            <FiMessageCircle aria-hidden="true" />
            <span>{t('luna')}</span>
          </button>
        </div>
      </motion.section>

      {error && (
        <Alert severity="warning" className="dashboard-alert">
          {error}
        </Alert>
      )}

      {/* Time-Window & Export Deck */}
      <section className="hc-insights-toolbar" aria-label={t('rangeFilterLabel')}>
        <div className="hc-range-filter-bar" role="group" aria-label={t('rangeFilterLabel')}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`scale-chip hc-spotlight-btn${range === opt.key ? ' is-selected' : ''}`}
              aria-pressed={range === opt.key}
              onClick={() => setRange(opt.key)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        {cycles.length > 0 && (
          <div className="hc-series-toggle-group">
            <button
              type="button"
              className="hc-export-csv-btn"
              onClick={handleExportCsv}
              title={t('exportCsvBtn')}
            >
              <FiDownload aria-hidden="true" />
              <span>{t('exportCsvBtn')}</span>
            </button>
          </div>
        )}
      </section>

      {/* 4-Card Redesigned Luxury Wellness Metric Strip */}
      <div className="insights-summary-grid hc-insights-kpi-grid">
        <InsightStat
          icon={FiActivity}
          label={t('averageMood')}
          badge={moodAverage ? t('kpiStatusLive') : t('kpiStatusReady')}
          primaryValue={moodAverage ? moodAverage.toFixed(1) : t('kpiAwaitingShort')}
          unit={moodAverage ? '/ 10' : ''}
          isPlaceholder={!moodAverage}
          progressPct={moodAverage ? Math.round(moodAverage * 10) : 16}
          subtext={
            moodAverage
              ? moodAverage >= 7
                ? t('insightsMoodBrightSub')
                : t('insightsMoodGentleSub')
              : t('kpiMoodEmptyHint')
          }
          accent="rose"
          onAction={!moodAverage ? () => navigate('/log') : undefined}
        />

        <InsightStat
          icon={FiSun}
          label={t('averageEnergy')}
          badge={energyAverage ? t('kpiStatusLive') : t('kpiStatusReady')}
          primaryValue={energyAverage ? energyAverage.toFixed(1) : t('kpiAwaitingShort')}
          unit={energyAverage ? '/ 10' : ''}
          isPlaceholder={!energyAverage}
          progressPct={energyAverage ? Math.round(energyAverage * 10) : 16}
          subtext={
            energyAverage
              ? energyAverage >= 6.5
                ? t('insightsEnergyHighSub')
                : t('insightsEnergyRestSub')
              : t('kpiEnergyEmptyHint')
          }
          accent="sage"
          onAction={!energyAverage ? () => navigate('/log') : undefined}
        />

        <InsightStat
          icon={FiHeart}
          label={t('checkInCount')}
          badge={sampleMode ? t('kpiStatusSample') : t('kpiStatusCalm')}
          primaryValue={`${recordedCount}`}
          unit={recordedCount === 1 ? t('kpiEntrySingle') : t('kpiEntryPlural')}
          progressPct={Math.max(14, Math.min(100, recordedCount * 14))}
          subtext={t('kpiCheckinsEmptyHint')}
          accent="lilac"
        />

        <InsightStat
          icon={FiCalendar}
          label={t('typicalCycleSpan')}
          badge={cycleSpanAvg ? t('kpiStatusPersonal') : t('kpiStatusBaseline')}
          primaryValue={cycleSpanAvg ? `${cycleSpanAvg}` : '~28'}
          unit={t('days')}
          progressPct={cycleSpanAvg ? Math.min(100, Math.round((cycleSpanAvg / 35) * 100)) : 52}
          subtext={cycleSpanAvg ? t('insightsCycleSpanLoggedSub') : t('kpiCycleBaselineHint')}
          accent="gold"
        />
      </div>

      {/* Main Interactive Spline Chart & Custom Interactive Legend Key Bar */}
      <section className="insight-chart-card hc-spotlight-card" style={{ position: 'relative' }}>
        <CardBurst burstKey={cardBurstKey} disabled={Boolean(prefs.reduceMotion)} />

        <div className="insight-card-heading">
          <div className="insight-card-heading-copy">
            <span className="eyebrow-label">{t('yourPatterns')}</span>
            <h2>{t('recentMood')}</h2>
          </div>

          <div className="hc-chart-heading-actions">
            {prefs.journeyEnabled !== false && (
              <button
                type="button"
                className={`hc-insight-review-btn hc-spotlight-btn${reviewed ? ' is-reviewed' : ''}`}
                onClick={handleMarkReviewed}
              >
                {reviewed ? <FiCheck aria-hidden="true" /> : <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />}
                <span>{reviewed ? t('summaryReviewedDone') : t('markSummaryReviewed')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bespoke Jewel Legend Key Bar replacing cramped Chart.js default canvas legend */}
        <div
          className="hc-rhythm-legend-bar"
          role="group"
          aria-label={t('recentMood')}
          data-testid="rhythm-legend-key"
        >
          <button
            type="button"
            className={`hc-rhythm-legend-item is-mood${visibleSeries.mood ? ' is-active' : ''}`}
            aria-pressed={visibleSeries.mood}
            onClick={() => handleToggleSeries('mood')}
          >
            <span className="hc-rhythm-legend-swatch is-mood" aria-hidden="true">
              <i />
            </span>
            <span className="hc-rhythm-legend-copy">
              <strong>{t('mood')}</strong>
              <small>
                {moodAverage
                  ? t('legendAvgValue', { value: moodAverage.toFixed(1) })
                  : t('legendScaleLabel')}
              </small>
            </span>
            <span className="hc-rhythm-legend-state" aria-hidden="true">
              {visibleSeries.mood ? t('legendShown') : t('legendHidden')}
            </span>
          </button>

          <button
            type="button"
            className={`hc-rhythm-legend-item is-energy${visibleSeries.energy ? ' is-active' : ''}`}
            aria-pressed={visibleSeries.energy}
            onClick={() => handleToggleSeries('energy')}
          >
            <span className="hc-rhythm-legend-swatch is-energy" aria-hidden="true">
              <i />
            </span>
            <span className="hc-rhythm-legend-copy">
              <strong>{t('energy')}</strong>
              <small>
                {energyAverage
                  ? t('legendAvgValue', { value: energyAverage.toFixed(1) })
                  : t('legendScaleLabel')}
              </small>
            </span>
            <span className="hc-rhythm-legend-state" aria-hidden="true">
              {visibleSeries.energy ? t('legendShown') : t('legendHidden')}
            </span>
          </button>

          <button
            type="button"
            className={`hc-rhythm-legend-item is-flow${visibleSeries.flow ? ' is-active' : ''}`}
            aria-pressed={visibleSeries.flow}
            onClick={() => handleToggleSeries('flow')}
          >
            <span className="hc-rhythm-legend-swatch is-flow" aria-hidden="true">
              <i />
            </span>
            <span className="hc-rhythm-legend-copy">
              <strong>{t('periodFlow')}</strong>
              <small>{t('legendFlowOverlay')}</small>
            </span>
            <span className="hc-rhythm-legend-state" aria-hidden="true">
              {visibleSeries.flow ? t('legendShown') : t('legendOverlayOff')}
            </span>
          </button>
        </div>

        {isLoading ? (
          <Skeleton height={230} />
        ) : activeSeriesAsc.length >= 2 ? (
          <>
            {canvasReady ? (
              <div className="hc-chartjs-box" data-testid="insights-chartjs">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <FallbackSvgChart
                cycles={activeSeriesAsc}
                locale={locale}
                showMood={visibleSeries.mood}
                showEnergy={visibleSeries.energy}
                showFlow={visibleSeries.flow}
                moodLabel={t('mood')}
              />
            )}

            <div className="hc-day-inspector">
              <div className="hc-day-pill-strip" role="tablist" aria-label={t('inspectLoggedDay')}>
                {activeSeriesAsc.map((entry) => {
                  const active = selectedEntry?.date === entry.date
                  return (
                    <button
                      key={entry.id || entry.date}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`hc-day-select-pill${active ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSelectedDate(entry.date)
                        setCardBurstKey((prev) => prev + 1)
                      }}
                    >
                      {formatShortDate(entry.date, locale)}
                    </button>
                  )
                })}
              </div>

              {selectedEntry && (
                <div className="hc-day-detail-bar">
                  <span className="hc-day-phase-chip">
                    {selectedEntry.phase ? t(`phase.${selectedEntry.phase}`) : '—'}
                  </span>
                  <span>
                    {t('mood')}: <strong>{selectedEntry.mood}/10</strong>
                  </span>
                  <span>
                    {t('energy')}: <strong>{selectedEntry.energy}/10</strong>
                  </span>
                  <span>
                    {t('periodFlow')}:{' '}
                    <strong>
                      {selectedEntry.period ? t(`flow_${selectedEntry.period}`) : t('flow_none')}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <p className="chart-caption">{t('chartCaption')}</p>
          </>
        ) : (
          <div className="insight-empty-state hc-premium-empty-state">
            <div className="hc-empty-insight-orb" aria-hidden="true">
              <InsightsRoundedIcon sx={{ fontSize: 28 }} />
            </div>
            <h3>{t('chartEmptyTitle')}</h3>
            <p>{t('chartEmptyBody')}</p>
            <div className="hc-empty-insight-cta-row">
              <Button
                variant="contained"
                disableElevation
                className="form-submit-button hc-spotlight-btn"
                startIcon={<FiPlus aria-hidden="true" />}
                onClick={() => navigate('/log')}
              >
                {t('startFirstCheckIn')}
              </Button>
              <button
                type="button"
                className="hc-sample-toggle-btn"
                onClick={() => {
                  setSampleMode(true)
                  setCardBurstKey((prev) => prev + 1)
                }}
              >
                <FiEye aria-hidden="true" />
                <span>{t('insightsPreviewSampleBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Editorial Pattern Synthesis Cards */}
      <section className="pattern-note-grid hc-pattern-editorial-grid">
        <article className="pattern-note hc-spotlight-card">
          <div className="pattern-note-top">
            <span className="pattern-note-seal">01</span>
            <span className="pattern-note-badge">
              <FiSun aria-hidden="true" />
              <span>{t('energyPatterns')}</span>
            </span>
          </div>
          <h3>{t('patternNote1Title')}</h3>
          <p>{t('energyPatternsBody')}</p>
          {patternSynthesis?.brightestPhase && (
            <div className="hc-pattern-live-callout">
              <span>
                {t('insightsBrightestWindowLabel')}{' '}
                <strong>
                  {t(`phase.${patternSynthesis.brightestPhase}`)} ({patternSynthesis.brightestVal}/10)
                </strong>
              </span>
            </div>
          )}
          <button
            type="button"
            className="hc-pattern-card-link"
            onClick={() => navigate('/journey')}
          >
            <span>{t('insightsExploreEnergyGuide')}</span>
            <FiArrowRight aria-hidden="true" />
          </button>
        </article>

        <article className="pattern-note pattern-note-sage hc-spotlight-card">
          <div className="pattern-note-top">
            <span className="pattern-note-seal is-sage">02</span>
            <span className="pattern-note-badge pattern-note-badge-sage">
              <FiHeart aria-hidden="true" />
              <span>{t('bodyAwareness')}</span>
            </span>
          </div>
          <h3>{t('patternNote2Title')}</h3>
          <p>{t('bodyAwarenessBody')}</p>
          {patternSynthesis?.gentlestPhase && (
            <div className="hc-pattern-live-callout is-sage">
              <span>
                {t('insightsGentlestPhaseLabel')}{' '}
                <strong>
                  {t(`phase.${patternSynthesis.gentlestPhase}`)} ({patternSynthesis.gentlestVal}/10)
                </strong>
              </span>
            </div>
          )}
          <button
            type="button"
            className="hc-pattern-card-link is-sage"
            onClick={() => navigate('/luna')}
          >
            <span>{t('insightsReflectWithLuna')}</span>
            <FiArrowRight aria-hidden="true" />
          </button>
        </article>
      </section>
    </div>
  )
}

export default Insights
