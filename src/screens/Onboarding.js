import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LuHeart, LuMoonStar, LuSparkles, LuWaves } from 'react-icons/lu'

import Logo from '../components/Logo'
import LangToggle from '../components/LangToggle'
import AuthPanel from '../components/AuthPanel'
import { Slider, SelectCard } from '../components/Controls'
import { celebrate } from '../lib/celebrate'
import { saveProfile, getProfile } from '../lib/repo'
import { toDateKey } from '../lib/cycle'
import { useSession } from '../lib/session'
import { pushProfile } from '../lib/sync'

const TONES = [
  { key: 'playful', tint: '#e07a2e', icon: <LuSparkles />, pattern: 'sparkle' },
  { key: 'balanced', tint: '#c26c95', icon: <LuHeart />, pattern: 'petal' },
  { key: 'serious', tint: '#6b5ba0', icon: <LuMoonStar />, pattern: 'drop' },
]

const STEPS = 3

/** First run: welcome, cycle basics (both optional), and tone. Accounts are offered, never forced. */
const Onboarding = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useSession()
  const existing = getProfile()

  const [step, setStep] = useState(0)
  const [isAdult, setIsAdult] = useState(false)
  const [lastPeriodStart, setLastPeriodStart] = useState(existing.lastPeriodStart || '')
  const [unsure, setUnsure] = useState(!existing.lastPeriodStart)
  const [cycleLength, setCycleLength] = useState(existing.cycleLength)
  const [periodLength, setPeriodLength] = useState(existing.periodLength)
  const [tone, setTone] = useState(existing.tone || 'balanced')
  const [showAccount, setShowAccount] = useState(false)
  const [error, setError] = useState('')

  const today = toDateKey(new Date())
  const dateError = useMemo(() => {
    if (unsure) return ''
    if (!lastPeriodStart) return t('onboarding.dateRequired')
    if (lastPeriodStart > today) return t('onboarding.dateFuture')
    return ''
  }, [unsure, lastPeriodStart, today, t])

  const finish = async () => {
    setError('')
    const profile = saveProfile({
      onboarded: true,
      lastPeriodStart: unsure ? null : lastPeriodStart,
      cycleLength,
      periodLength,
      tone,
    })
    if (session?.user?.id) {
      try {
        await pushProfile(session.user.id, profile)
      } catch (failure) {
        setError(failure.message)
        return
      }
    }
    celebrate('burst', { x: window.innerWidth / 2, y: window.innerHeight / 3, pattern: 'sparkle', count: 22 })
    navigate('/', { replace: true })
  }

  const next = () => setStep((value) => Math.min(STEPS - 1, value + 1))
  const back = () => setStep((value) => Math.max(0, value - 1))

  return (
    <div className="shell">
      <div className="shell-body" style={{ minHeight: '100vh' }}>
        <header className="topbar">
          <span className="brand" aria-hidden="true">
            <span className="brand-logo">
              <Logo />
            </span>
            <span className="brand-name">{t('app.name')}</span>
          </span>
          <LangToggle />
        </header>

        <main className="main" style={{ maxWidth: 620 }}>
          <div className="stack" aria-live="polite">
            <div role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} aria-label={t('onboarding.progress')} className="bar">
              <i style={{ '--w': `${((step + 1) / STEPS) * 100}%`, display: 'block', height: '100%', width: `${((step + 1) / STEPS) * 100}%`, background: 'linear-gradient(90deg, var(--berry), #d68aa7)', transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={step}
                className="stack"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && (
                  <>
                    <p className="card-kicker">{t('onboarding.kicker')}</p>
                    <h1 className="hero-title">{t('onboarding.welcomeTitle')}</h1>
                    <p className="muted" style={{ fontSize: '1.05rem' }}>{t('onboarding.welcomeBody')}</p>
                    <div className="card stack">
                      <p>{t('onboarding.privacy')}</p>
                      <label className="switch">
                        <input type="checkbox" checked={isAdult} onChange={(event) => setIsAdult(event.target.checked)} />
                        <span className="track" aria-hidden="true" />
                        <span className="switch-label">
                          <strong>{t('onboarding.ageLabel')}</strong>
                          <small>{t('onboarding.ageHelp')}</small>
                        </span>
                      </label>
                    </div>
                    <div className="row">
                      <button type="button" className="btn" onClick={next} disabled={!isAdult}>
                        {t('onboarding.start')}
                      </button>
                      <button type="button" className="btn ghost" onClick={() => setShowAccount((value) => !value)} aria-expanded={showAccount}>
                        {t('onboarding.haveAccount')}
                      </button>
                    </div>
                    {showAccount && (
                      <div className="card">
                        <AuthPanel />
                      </div>
                    )}
                  </>
                )}

                {step === 1 && (
                  <>
                    <h2>{t('onboarding.cycleTitle')}</h2>
                    <p className="muted">{t('onboarding.cycleBody')}</p>
                    <div className="card stack">
                      <label className="field">
                        <span>{t('onboarding.lastPeriod')}</span>
                        <input
                          className="input"
                          type="date"
                          max={today}
                          value={lastPeriodStart}
                          disabled={unsure}
                          onChange={(event) => setLastPeriodStart(event.target.value)}
                          aria-invalid={Boolean(dateError)}
                          aria-describedby="onboarding-date-help"
                        />
                        <small id="onboarding-date-help" className={dateError ? 'field-error' : ''}>
                          {dateError || t('onboarding.dateHelp')}
                        </small>
                      </label>
                      <label className="switch">
                        <input type="checkbox" checked={unsure} onChange={(event) => setUnsure(event.target.checked)} />
                        <span className="track" aria-hidden="true" />
                        <span className="switch-label">
                          <strong>{t('onboarding.unsure')}</strong>
                          <small>{t('onboarding.unsureHint')}</small>
                        </span>
                      </label>
                      <Slider id="cycle-length" label={t('onboarding.cycleLength')} value={cycleLength} min={21} max={40} unit={t('units.days')} onChange={setCycleLength} tint="var(--berry)" lowLabel="21" highLabel="40" pattern="sparkle" />
                      <Slider id="period-length" label={t('onboarding.periodLength')} value={periodLength} min={2} max={10} unit={t('units.days')} onChange={setPeriodLength} tint="#c15b70" lowLabel="2" highLabel="10" pattern="drop" />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2>{t('onboarding.toneTitle')}</h2>
                    <p className="muted">{t('onboarding.toneBody')}</p>
                    <div className="grid-2">
                      {TONES.map((item) => (
                        <SelectCard
                          key={item.key}
                          pressed={tone === item.key}
                          onSelect={() => setTone(item.key)}
                          icon={item.icon}
                          title={t(`tones.${item.key}.title`)}
                          hint={t(`tones.${item.key}.hint`)}
                          tint={item.tint}
                          pattern={item.pattern}
                        />
                      ))}
                    </div>
                    <div className="card stack">
                      <p className="card-kicker">{t('onboarding.backupTitle')}</p>
                      <p className="muted">{t('onboarding.backupBody')}</p>
                      {session?.user ? (
                        <p>{t('onboarding.alreadySignedIn')}</p>
                      ) : (
                        <AuthPanel />
                      )}
                    </div>
                    {error && (
                      <div className="notice warn" role="alert">
                        {error}
                      </div>
                    )}
                  </>
                )}
              </motion.section>
            </AnimatePresence>

            {step > 0 && (
              <div className="between">
                <button type="button" className="btn quiet" onClick={back}>
                  {t('onboarding.back')}
                </button>
                {step === 1 ? (
                  <button type="button" className="btn" onClick={next} disabled={Boolean(dateError)}>
                    {t('onboarding.next')}
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={finish}>
                    <LuWaves aria-hidden="true" /> {t('onboarding.finish')}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Onboarding
