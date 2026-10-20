import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  LuBookOpen,
  LuCalendarHeart,
  LuCheck,
  LuGraduationCap,
  LuHeartHandshake,
  LuNotebookPen,
  LuPalette,
  LuPause,
  LuPlay,
  LuPlus,
  LuSparkles,
  LuTarget,
  LuTrash2,
} from 'react-icons/lu'

import Garden, { ACCENTS, JourneyRing } from '../components/Garden'
import { celebrate } from '../lib/celebrate'
import { LESSON_IDS, MILESTONES, eligibleMilestones, lessonsCompleted, nextStageFor, ringProgress, scoreQuiz, stageFor } from '../lib/journey'
import {
  DEFAULT_JOURNEY,
  awardMilestone,
  getCheckins,
  getJourney,
  getPrefs,
  recordQuiz,
  savePrefs,
  setAccent,
  setIntentions,
} from '../lib/repo'
import { KEYS, useStoredJson } from '../lib/store'

const EMPTY = Object.freeze({})

const MILESTONE_ICONS = {
  first_checkin: <LuCalendarHeart />,
  five_check_ins: <LuCheck />,
  first_reflection: <LuNotebookPen />,
  first_intention: <LuTarget />,
  first_lesson: <LuBookOpen />,
  learning_milestone: <LuGraduationCap />,
  monthly_review: <LuSparkles />,
  make_it_yours: <LuPalette />,
}

const MILESTONE_TINTS = {
  first_checkin: '#c26c95',
  five_check_ins: '#3f9a78',
  first_reflection: '#7b5cc4',
  first_intention: '#e07a2e',
  first_lesson: '#2f7f9a',
  learning_milestone: '#6b5ba0',
  monthly_review: '#b0527f',
  make_it_yours: '#8fa84a',
}

const INTENTION_PRESETS = ['reflect', 'learn', 'calm', 'connect']

/** Awards each milestone once. A celebration plays only when something new was earned. */
const awardAndCelebrate = (keys) => {
  const fresh = keys.filter((key) => awardMilestone(key))
  if (fresh.length) celebrate('milestone', { color: '#c26c95', pattern: 'sparkle' })
  return fresh
}

const formatDate = (iso, lng) => {
  try {
    return new Intl.DateTimeFormat(lng === 'am' ? 'am-ET' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
  } catch {
    return ''
  }
}

const isAnswered = (answers, count) => Array.from({ length: count }, (_, index) => answers[index]).every((value) => value !== undefined && value !== null)

/** Your Journey: a garden that only grows, gentle milestones, intentions, and optional lessons. */
const Journey = () => {
  const { t, i18n } = useTranslation()
  const journey = { ...DEFAULT_JOURNEY, ...useStoredJson(KEYS.journey, EMPTY) }
  const prefs = { ...getPrefs(), ...useStoredJson(KEYS.prefs, EMPTY) }
  const stage = stageFor(journey.milestones)
  const next = nextStageFor(journey.milestones)
  const progress = ringProgress(journey.milestones)
  const intentions = journey.intentions || []
  const enabled = prefs.gamification

  const [openLesson, setOpenLesson] = useState(null)
  const [quizzes, setQuizzes] = useState({})
  const [customIntention, setCustomIntention] = useState('')

  const quizState = (id) => quizzes[id] || { answers: [], submitted: false, result: null }
  const setQuizState = (id, value) => setQuizzes((current) => ({ ...current, [id]: value }))

  const addIntention = (presetId) => {
    const next = [...intentions, { id: `${presetId}-${Date.now()}`, label: t(`journey.intentions.${presetId}`), status: 'active' }]
    setIntentions(next)
    awardAndCelebrate(eligibleMilestones({ intentionCount: next.length }))
  }

  const addCustom = (event) => {
    event.preventDefault()
    const label = customIntention.trim().slice(0, 80)
    if (!label) return
    const next = [...intentions, { id: `custom-${Date.now()}`, label, status: 'active' }]
    setIntentions(next)
    setCustomIntention('')
    awardAndCelebrate(eligibleMilestones({ intentionCount: next.length }))
  }

  const toggleIntention = (id) => {
    setIntentions(intentions.map((item) => (item.id === id ? { ...item, status: item.status === 'paused' ? 'active' : 'paused' } : item)))
  }

  const removeIntention = (id) => setIntentions(intentions.filter((item) => item.id !== id))

  const submitQuiz = (lessonId, questions) => {
    const state = quizState(lessonId)
    const result = scoreQuiz(questions, state.answers)
    recordQuiz(lessonId, result)
    setQuizState(lessonId, { ...state, submitted: true, result })
    const fresh = getJourney()
    awardAndCelebrate(
      eligibleMilestones({
        lessonsDone: lessonsCompleted(fresh.quizzes),
        checkinDays: Object.keys(getCheckins()).length,
        intentionCount: intentions.length,
      })
    )
  }

  const chooseAccent = (key) => {
    setAccent(key)
    awardAndCelebrate(eligibleMilestones({ accentChosen: true }))
  }

  const lessonsDone = lessonsCompleted(journey.quizzes)
  const earned = MILESTONES.filter((item) => journey.milestones[item.key]).length

  return (
    <div className="section-gap">
      <header>
        <p className="card-kicker">{t('journey.kicker')}</p>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.9rem, 5vw, 2.6rem)', marginTop: 6 }}>{t('journey.title')}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{t('journey.intro')}</p>
      </header>

      {!enabled && (
        <section className="notice info stack" role="status" style={{ gap: 10 }}>
          <strong>{t('journey.offTitle')}</strong>
          <span>{t('journey.offBody')}</span>
          <div>
            <button type="button" className="btn ghost" onClick={() => savePrefs({ gamification: true })}>
              <LuPlay aria-hidden="true" /> {t('journey.turnOn')}
            </button>
          </div>
        </section>
      )}

      {enabled && (
        <section className="card" aria-labelledby="garden-title" style={{ background: 'radial-gradient(640px circle at 100% 0%, rgba(212, 163, 178, 0.22), transparent 60%), var(--surface)' }}>
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div className="stack">
              <div>
                <p className="card-kicker">{t('journey.gardenKicker')}</p>
                <h2 id="garden-title" style={{ fontSize: '1.6rem' }}>{t(`garden.stage.${stage.id}`)}</h2>
                <p className="muted" style={{ marginTop: 6 }}>{t(`garden.desc.${stage.id}`)}</p>
              </div>
              <Garden stage={stage.id} accent={journey.accent} title={t(`garden.stage.${stage.id}`)} />
            </div>
            <div className="stack" style={{ justifyItems: 'center', textAlign: 'center' }}>
              <JourneyRing
                progress={progress}
                label={next ? `${Math.round(progress * 100)}%` : '✿'}
                sublabel={next ? t('journey.ringNext', { stage: t(`garden.stage.${next.id}`) }) : t('journey.ringTop')}
              />
              <p className="muted" style={{ fontSize: '0.9rem' }}>{t('journey.earned', { count: earned, total: MILESTONES.length })}</p>
            </div>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            <p className="card-kicker">{t('journey.accentTitle')}</p>
            <div className="row" role="group" aria-label={t('journey.accentTitle')}>
              {Object.keys(ACCENTS).map((key) => (
                <button key={key} type="button" className="chip" aria-pressed={journey.accent === key} onClick={() => chooseAccent(key)}>
                  <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: ACCENTS[key].flower, display: 'inline-block' }} />
                  {t(`journey.accents.${key}`)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {enabled && (
        <section className="stack" aria-labelledby="milestones-title">
          <h2 id="milestones-title" style={{ fontSize: '1.35rem' }}>{t('journey.milestonesTitle')}</h2>
          <p className="muted" style={{ fontSize: '0.92rem' }}>{t('journey.milestonesBody')}</p>
          <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {MILESTONES.map((item) => {
              const done = Boolean(journey.milestones[item.key])
              return (
                <article key={item.key} className={`milestone spot ${done ? 'done' : ''}`} style={{ '--tint': MILESTONE_TINTS[item.key] }}>
                  <div className="badge" aria-hidden="true">{MILESTONE_ICONS[item.key]}</div>
                  <strong>{t(`journey.milestones.${item.key}.title`)}</strong>
                  <small>
                    {done ? t('journey.awardedOn', { date: formatDate(journey.milestones[item.key], i18n.language) }) : t(`journey.milestones.${item.key}.hint`)}
                  </small>
                  {item.badge && <small className="card-kicker" style={{ fontSize: '0.66rem' }}>{t('journey.badge')}</small>}
                </article>
              )
            })}
          </div>
        </section>
      )}

      <section className="card stack" aria-labelledby="intentions-title">
        <div>
          <h2 id="intentions-title" style={{ fontSize: '1.35rem' }}>{t('journey.intentionsTitle')}</h2>
          <p className="muted" style={{ fontSize: '0.92rem' }}>{t('journey.intentionsBody')}</p>
        </div>
        <div className="row" role="group" aria-label={t('journey.addIntention')}>
          {INTENTION_PRESETS.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => addIntention(id)}>
              <LuPlus aria-hidden="true" /> {t(`journey.intentions.${id}`)}
            </button>
          ))}
        </div>
        <form className="row" onSubmit={addCustom} style={{ flexWrap: 'nowrap' }}>
          <label className="sr-only" htmlFor="custom-intention">{t('journey.customLabel')}</label>
          <input id="custom-intention" className="input" maxLength={80} value={customIntention} onChange={(event) => setCustomIntention(event.target.value)} placeholder={t('journey.customPlaceholder')} />
          <button type="submit" className="btn ghost" disabled={!customIntention.trim()}>{t('journey.addCustom')}</button>
        </form>
        {intentions.length === 0 && <p className="muted">{t('journey.noIntentions')}</p>}
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
          {intentions.map((item) => (
            <li key={item.id} className="between" style={{ padding: '10px 14px', borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <span style={{ opacity: item.status === 'paused' ? 0.6 : 1 }}>
                <LuHeartHandshake aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 8, color: 'var(--berry)' }} />
                {item.label}
                {item.status === 'paused' && <small className="muted"> · {t('journey.paused')}</small>}
              </span>
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="btn quiet" onClick={() => toggleIntention(item.id)} aria-label={item.status === 'paused' ? t('journey.resume') : t('journey.pause')}>
                  {item.status === 'paused' ? <LuPlay aria-hidden="true" /> : <LuPause aria-hidden="true" />}
                </button>
                <button type="button" className="btn quiet" onClick={() => removeIntention(item.id)} aria-label={t('journey.remove')}>
                  <LuTrash2 aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: '0.86rem' }}>{t('journey.noPenalty')}</p>
      </section>

      <section className="stack" aria-labelledby="lessons-title">
        <div>
          <h2 id="lessons-title" style={{ fontSize: '1.35rem' }}>{t('journey.lessonsTitle')}</h2>
          <p className="muted" style={{ fontSize: '0.92rem' }}>{t('journey.lessonsBody', { done: lessonsDone, total: LESSON_IDS.length })}</p>
        </div>
        {LESSON_IDS.map((id) => {
          const lesson = t(`journey.lessons.${id}`, { returnObjects: true })
          const questions = Array.isArray(lesson.questions) ? lesson.questions : []
          const attempt = journey.quizzes[id]
          const open = openLesson === id
          const state = quizState(id)
          return (
            <article key={id} className="card stack" aria-labelledby={`lesson-${id}`}>
              <div className="between">
                <div>
                  <p className="card-kicker">{t('journey.lessonKicker')}</p>
                  <h3 id={`lesson-${id}`} style={{ fontSize: '1.2rem', marginTop: 4 }}>{lesson.title}</h3>
                </div>
                {attempt && (
                  <span className="chip">
                    <LuCheck aria-hidden="true" /> {t('journey.completed')}
                  </span>
                )}
              </div>
              <p>{lesson.body}</p>
              {!open && (
                <div>
                  <button type="button" className="btn ghost" aria-expanded={false} onClick={() => setOpenLesson(id)}>
                    <LuBookOpen aria-hidden="true" /> {attempt ? t('journey.retry') : t('journey.startQuiz')}
                  </button>
                </div>
              )}
              {open && (
                <form
                  className="stack"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!state.submitted && isAnswered(state.answers, questions.length)) submitQuiz(id, questions)
                  }}
                >
                  {questions.map((question, qIndex) => (
                    <fieldset key={question.q} className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
                      <legend style={{ fontWeight: 600, marginBottom: 8 }}>{question.q}</legend>
                      {question.options.map((option, oIndex) => {
                        const chosen = state.answers[qIndex] === oIndex
                        const correct = state.submitted && question.answer === oIndex
                        const wrong = state.submitted && chosen && !correct
                        return (
                          <label
                            key={option}
                            className="chip"
                            style={{
                              borderRadius: 14,
                              justifyContent: 'flex-start',
                              background: correct ? 'rgba(63, 154, 120, 0.14)' : wrong ? 'rgba(176, 58, 82, 0.08)' : undefined,
                              borderColor: correct ? '#3f9a78' : undefined,
                            }}
                          >
                            <input
                              type="radio"
                              name={`${id}-${qIndex}`}
                              checked={chosen}
                              disabled={state.submitted}
                              onChange={() => {
                                const answers = [...state.answers]
                                answers[qIndex] = oIndex
                                setQuizState(id, { ...state, answers })
                              }}
                              style={{ accentColor: 'var(--berry)' }}
                            />
                            {option}
                          </label>
                        )
                      })}
                      {state.submitted && <small className="muted">{question.explain}</small>}
                    </fieldset>
                  ))}
                  {state.submitted && state.result && (
                    <div className="notice" role="status">
                      {t('journey.result', { correct: state.result.correct, total: state.result.total })}
                    </div>
                  )}
                  <div className="row">
                    {!state.submitted ? (
                      <button type="submit" className="btn" disabled={!isAnswered(state.answers, questions.length)}>
                        {t('journey.check')}
                      </button>
                    ) : (
                      <button type="button" className="btn ghost" onClick={() => setQuizState(id, { answers: [], submitted: false, result: null })}>
                        {t('journey.tryAgain')}
                      </button>
                    )}
                    <button type="button" className="btn quiet" onClick={() => setOpenLesson(null)}>
                      {t('journey.close')}
                    </button>
                  </div>
                </form>
              )}
            </article>
          )
        })}
        <p className="muted" style={{ fontSize: '0.84rem' }}>{t('journey.disclaimer')}</p>
      </section>

      <p className="muted" style={{ fontSize: '0.86rem' }}>
        {t('journey.privacyNote')} <Link to="/settings">{t('journey.managePrefs')}</Link>
      </p>
    </div>
  )
}

export default Journey
