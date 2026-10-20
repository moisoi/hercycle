import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import { FiActivity, FiHeart, FiInfo, FiSun } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

import { supabase } from '../lib/supabase'

const Insights = ({ session }) => {
  const { t } = useTranslation()
  const [cycles, setCycles] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(session?.user?.id))
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadCycles = async () => {
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const { data, error: queryError } = await supabase
        .from('cycles')
        .select('id, mood, energy, libido, phase, date')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .limit(14)

      if (!isMounted) return
      if (queryError) {
        setError(queryError.message || t('errorGeneric'))
      } else {
        setCycles((data || []).reverse())
      }
      setIsLoading(false)
    }

    loadCycles().catch((queryError) => {
      if (isMounted) {
        setError(queryError.message || t('errorGeneric'))
        setIsLoading(false)
      }
    })

    return () => { isMounted = false }
  }, [session?.user?.id, t])

  const moodAverage = useMemo(() => average(cycles, 'mood'), [cycles])
  const energyAverage = useMemo(() => average(cycles, 'energy'), [cycles])
  const moodPoints = useMemo(() => makePoints(cycles, 'mood'), [cycles])
  const energyPoints = useMemo(() => makePoints(cycles, 'energy'), [cycles])

  return (
    <div className="insights-page">
      <section className="insight-explainer">
        <div className="insight-explainer-icon"><FiInfo aria-hidden="true" /></div>
        <div><strong>Curiosity, not certainty.</strong><p>{t('insightsDescription')}</p></div>
      </section>

      {error && <Alert severity="warning" className="dashboard-alert">{error}</Alert>}

      <div className="insights-summary-grid">
        <InsightStat icon={FiActivity} label={t('averageMood')} value={moodAverage ? `${moodAverage.toFixed(1)} / 10` : '—'} accent="rose" />
        <InsightStat icon={FiSun} label={t('averageEnergy')} value={energyAverage ? `${energyAverage.toFixed(1)} / 10` : '—'} accent="sage" />
        <InsightStat icon={FiHeart} label={t('checkInCount')} value={cycles.length} accent="lilac" />
      </div>

      <motion.section className="insight-chart-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="insight-card-heading">
          <div><span className="eyebrow-label">THE LAST TWO WEEKS</span><h2>{t('recentMood')}</h2></div>
          <span className="chart-legend"><i />{t('mood')}</span>
        </div>
        {isLoading ? (
          <Skeleton height={190} />
        ) : cycles.length >= 2 ? (
          <ResponsiveChart moodPoints={moodPoints} energyPoints={energyPoints} cycles={cycles} />
        ) : (
          <div className="insight-empty-state">
            <span className="insight-empty-art">✧</span>
            <strong>{t('noInsightsYet')}</strong>
            <p>{t('needMoreData')}</p>
          </div>
        )}
        {cycles.length >= 2 && <p className="chart-caption">Your scores are shown from oldest to newest. Patterns need time; every check-in is optional.</p>}
      </motion.section>

      <section className="pattern-note-grid">
        <article className="pattern-note pattern-note-rose">
          <span className="pattern-note-number">01</span>
          <h3>Small patterns can be meaningful.</h3>
          <p>Notice what supports you, without judging the days that feel different.</p>
        </article>
        <article className="pattern-note pattern-note-sage">
          <span className="pattern-note-number">02</span>
          <h3>Your experience is the expert.</h3>
          <p>Cycle phase can offer context, not a rule for how you should feel.</p>
        </article>
      </section>
    </div>
  )
}

const InsightStat = ({ icon: Icon, label, value, accent }) => (
  <article className={`insight-stat-card insight-stat-${accent}`}>
    <span className="insight-stat-icon"><Icon aria-hidden="true" /></span>
    <span className="insight-stat-label">{label}</span>
    <strong>{value}</strong>
  </article>
)

const ResponsiveChart = ({ moodPoints, energyPoints, cycles }) => (
  <div className="chart-wrap">
    <svg className="insight-chart" viewBox="0 0 700 190" role="img" aria-label="Mood and energy ratings across recent check-ins">
      {[1, 3, 5, 7, 10].map((line) => {
        const y = 158 - ((line - 1) / 9) * 131
        return <g key={line}><line x1="36" x2="686" y1={y} y2={y} className="chart-grid-line" /><text x="12" y={y + 4} className="chart-axis-label">{line}</text></g>
      })}
      {moodPoints && <polyline points={moodPoints} className="chart-line chart-line-mood" />}
      {energyPoints && <polyline points={energyPoints} className="chart-line chart-line-energy" />}
      {cycles.map((cycle, index) => {
        const x = 44 + (index * 630) / Math.max(cycles.length - 1, 1)
        const mood = Number(cycle.mood)
        const y = mood > 0 ? 158 - ((Math.min(mood, 10) - 1) / 9) * 131 : null
        return y === null ? null : <circle key={cycle.id} cx={x} cy={y} r="4.5" className="chart-point" />
      })}
    </svg>
    <div className="chart-axis-dates">
      <span>{cycles[0]?.date}</span>
      <span>{cycles[cycles.length - 1]?.date}</span>
    </div>
    <div className="chart-legend-row"><span><i className="legend-dot legend-dot-mood" />Mood</span><span><i className="legend-dot legend-dot-energy" />Energy</span></div>
  </div>
)

const average = (records, key) => {
  const values = records.map((record) => Number(record[key])).filter((value) => Number.isFinite(value) && value > 0)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const makePoints = (records, key) => {
  const available = records.map((record, index) => ({ index, value: Number(record[key]) })).filter((item) => Number.isFinite(item.value) && item.value > 0)
  if (available.length < 2) return ''
  const maxIndex = Math.max(records.length - 1, 1)
  return available.map(({ index, value }) => {
    const x = 44 + (index * 630) / maxIndex
    const y = 158 - ((Math.min(Math.max(value, 1), 10) - 1) / 9) * 131
    return `${x},${y}`
  }).join(' ')
}

export default Insights
