import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCloud, LuFlame, LuHeart, LuMoon, LuSmile } from 'react-icons/lu'

import { SaveButton, SelectCard, Slider, Switch } from '../components/Controls'
import { celebrate } from '../lib/celebrate'
import { cycleDayFor, normalizeCycleLength, phaseFor, toDateKey } from '../lib/cycle'
import { eligibleMilestones } from '../lib/journey'
import { getCheckins, getProfile, awardMilestone, saveCheckin } from '../lib/repo'
import { PHASE_TINTS } from '../lib/phases'
import { pushCheckin } from '../lib/sync'
import { useSession } from '../lib/session'

const MOODS = [
  { key: 'calm', tint: '#7b5cc4', icon: <LuMoon />, pattern: 'drop' },
  { key: 'happy', tint: '#e07a2e', icon: <LuSmile />, pattern: 'sparkle' },
  { key: 'energised', tint: '#3f9a78', icon: <LuFlame />, pattern: 'ember' },
  { key: 'tired', tint: '#6f7f9a', icon: <LuCloud />, pattern: 'petal' },
  { key: 'sensitive', tint: '#c26c95', icon: <LuHeart />, pattern: 'petal' },
]

const NOTE_MIN_FOR_REFLECTION = 12

/**
 * Daily check-in. Choices animate in context: mood cards burst in their own colour, the
 * aura behind the form takes on the chosen mood, and sliders spark when released.
 */
const CheckIn = () => {
  const { t, i18n } = useTranslation()
  const { session } = useSession()
  const profile = getProfile()
  const cycleLength = normalizeCycleLength(profile.cycleLength)
  const today = new Date()
  const todayKey = toDateKey(today)
  const day = cycleDayFor(today, profile.lastPeriodStart, cycleLength)
  const phase = phaseFor(day, { cycleLength, periodLength: profile.periodLength })

  const existing = getCheckins()[todayKey] || {}
  const [moodCard, setMoodCard] = useState(existing.moodCard || null)
  const [mood, setMood] = useState(existing.mood ?? 5)
  const [energy, setEnergy] = useState(existing.energy ?? 5)
  const [period, setPeriod] = useState(Boolean(existing.period))
  const [note, setNote] = useState(existing.note || '')

  const selected = MOODS.find((item) => item.key === moodCard)
  const aura = selected?.tint || PHASE_TINTS[phase] || '#c26c95'
  const energyTint = `color-mix(in srgb, #3f9a78 ${Math.round(20 + energy * 8)}%, #b9a7bd)`
  const dateLabel = new Intl.DateTimeFormat(i18n.language === 'am' ? 'am-ET' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)

  const save = async () => {
    const entry = { mood, energy, moodCard, period, note: note.trim(), phase: phase || 'unknown', day }
    saveCheckin(todayKey, entry)

    const checkins = getCheckins()
    const newlyAwarded = eligibleMilestones({
      checkinDays: Object.keys(checkins).length,
      hasReflection: entry.note.length >= NOTE_MIN_FOR_REFLECTION,
    }).filter((key) => awardMilestone(key))

    if (session?.user?.id) {
      try {
        await pushCheckin(session.user.id, todayKey, entry)
      } catch (failure) {
        throw new Error(t('checkIn.syncFailed', { message: failure.message }))
      }
    }

    if (newlyAwarded.length) {
      celebrate('milestone', { color: '#c26c95', pattern: 'sparkle' })
    } else {
      celebrate('progress', { x: window.innerWidth / 2, y: window.innerHeight / 2, color: aura, count: 12 })
    }
  }

  return (
    <div className="section-gap">
      <header>
        <p className="card-kicker">{dateLabel}</p>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginTop: 6 }}>
          {t('checkIn.title')}
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>{t('checkIn.intro')}</p>
      </header>

      <section className="card" style={{ '--accent': aura, background: `radial-gradient(520px circle at 85% -10%, color-mix(in srgb, ${aura} 16%, transparent), transparent 60%), var(--surface)`, transition: 'background 420ms cubic-bezier(0.22, 1, 0.36, 1)' }} aria-labelledby="mood-cards-title">
        <h2 id="mood-cards-title" style={{ fontSize: '1.2rem' }}>{t('checkIn.moodCardsTitle')}</h2>
        <p className="muted" style={{ marginBottom: 14, fontSize: '0.92rem' }}>{t('checkIn.moodCardsBody')}</p>
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {MOODS.map((item) => (
            <SelectCard
              key={item.key}
              pressed={moodCard === item.key}
              onSelect={() => setMoodCard(item.key)}
              icon={item.icon}
              title={t(`checkIn.moods.${item.key}.title`)}
              hint={t(`checkIn.moods.${item.key}.hint`)}
              tint={item.tint}
              pattern={item.pattern}
            />
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="sliders-title">
        <h2 id="sliders-title" style={{ fontSize: '1.2rem' }}>{t('checkIn.slidersTitle')}</h2>
        <Slider
          id="mood-slider"
          label={t('checkIn.mood')}
          value={mood}
          min={1}
          max={10}
          onChange={setMood}
          tint={aura}
          lowLabel={t('checkIn.moodLow')}
          highLabel={t('checkIn.moodHigh')}
          pattern="petal"
        />
        <Slider
          id="energy-slider"
          label={t('checkIn.energy')}
          value={energy}
          min={1}
          max={10}
          onChange={setEnergy}
          tint={energyTint}
          lowLabel={t('checkIn.energyLow')}
          highLabel={t('checkIn.energyHigh')}
          pattern="sparkle"
        />
      </section>

      <section className="card stack">
        <Switch id="period-toggle" checked={period} onChange={setPeriod} label={t('checkIn.periodLabel')} hint={t('checkIn.periodHint')} />
        <label className="field">
          <span>{t('checkIn.noteLabel')}</span>
          <textarea
            className="textarea"
            value={note}
            maxLength={600}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('checkIn.notePlaceholder')}
            aria-describedby="note-help"
          />
          <small id="note-help">{t('checkIn.noteHelp')}</small>
        </label>
        <SaveButton
          onSave={save}
          idleLabel={t('checkIn.save')}
          savingLabel={t('checkIn.saving')}
          savedLabel={t('checkIn.saved')}
          savedText={session?.user ? t('checkIn.savedAccount') : t('checkIn.savedDevice')}
          statusText={session?.user ? '' : t('checkIn.deviceHint')}
        />
      </section>
    </div>
  )
}

export default CheckIn
