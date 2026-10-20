import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiCheck, FiPause, FiPlay, FiTrash2 } from 'react-icons/fi'

import CardBurst from '../components/CardBurst'
import { useBurst } from '../lib/celebrate'
import { runAwards, setFlag } from '../lib/awards'
import { LESSONS } from '../lib/lessons'
import { GARDEN_ACCENTS, GARDEN_STAGES, MILESTONES, awardedCount, gardenStageFor, levelFor, recordQuiz, ringProgress, scoreQuiz } from '../lib/journey'
import { useJourney, savePrefs, updateJourney, usePrefs } from '../lib/store'

const MAX_GOAL_LENGTH = 80

const Ring = ({ progress, count, total }) => (
  <div className="ring-wrap">
    <svg viewBox="0 0 200 200" className="journey-ring" role="img" aria-label={`${count} / ${total}`}>
      <defs>
        <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ring-a)" />
          <stop offset="100%" stopColor="var(--ring-b)" />
        </linearGradient>
      </defs>
      <g className="ring-offset">
        <circle cx="100" cy="100" r="82" className="ring-track" />
        <circle cx="100" cy="100" r="82" className="ring-value" pathLength="100" strokeDasharray={`${Math.round(progress * 100)} 100`} />
        <circle cx="100" cy="100" r="62" className="ring-inner" />
      </g>
    </svg>
    <div className="ring-center">
      <strong>{count}</strong>
      <span>/ {total}</span>
    </div>
  </div>
)

// The garden only grows. It never wilts, and it shows no countdown to the next stage.
const Garden = ({ milestones, accent }) => {
  const stage = gardenStageFor(milestones)
  return (
    <figure className={`garden garden-${stage.id} accent-${accent}`}>
      <svg viewBox="0 0 320 200" role="img" aria-label={stage.id}>
        <ellipse cx="160" cy="176" rx="150" ry="18" className="garden-ground" />
        <g className="garden-plant">
          {stage.id === 'seed' && <ellipse cx="160" cy="168" rx="7" ry="5" className="garden-seed" />}
          {stage.id === 'sprout' && (
            <>
              <path d="M160 170 V140" className="garden-stem" />
              <ellipse cx="150" cy="138" rx="10" ry="5" className="garden-leaf" transform="rotate(-25 150 138)" />
              <ellipse cx="170" cy="134" rx="10" ry="5" className="garden-leaf" transform="rotate(25 170 134)" />
            </>
          )}
          {stage.id === 'sapling' && (
            <>
              <path d="M160 172 V110" className="garden-stem" />
              <ellipse cx="146" cy="120" rx="14" ry="7" className="garden-leaf" transform="rotate(-30 146 120)" />
              <ellipse cx="174" cy="112" rx="14" ry="7" className="garden-leaf" transform="rotate(30 174 112)" />
              <ellipse cx="160" cy="100" rx="12" ry="6" className="garden-leaf" />
            </>
          )}
          {stage.id === 'bloom' && (
            <>
              <path d="M160 172 V90" className="garden-stem" />
              <circle cx="160" cy="82" r="22" className="garden-canopy" />
              <circle cx="140" cy="108" r="14" className="garden-canopy" />
              <circle cx="180" cy="104" r="14" className="garden-canopy" />
              <circle cx="160" cy="80" r="6" className="garden-blossom" />
              <circle cx="132" cy="102" r="4" className="garden-blossom" />
              <circle cx="186" cy="98" r="4" className="garden-blossom" />
            </>
          )}
          {stage.id === 'grove' && (
            <>
              {[[90, 118, 0.85], [160, 92, 1], [230, 118, 0.85], [125, 140, 0.7], [195, 140, 0.7]].map(([x, y, s], index) => (
                <g key={index} transform={`translate(${x} ${y}) scale(${s})`}>
                  <path d="M0 40 V0" className="garden-stem" />
                  <circle cx="0" cy="-8" r="26" className="garden-canopy" />
                  <circle cx="-12" cy="6" r="10" className="garden-canopy" />
                  <circle cx="12" cy="4" r="10" className="garden-canopy" />
                </g>
              ))}
            </>
          )}
        </g>
      </svg>
      <figcaption>
        <strong>{stage.id}</strong>
      </figcaption>
    </figure>
  )
}

const Journey = () => {
  const { t } = useTranslation()
  const journey = useJourney()
  const prefs = usePrefs()
  const [goalDraft, setGoalDraft] = useState('')
  const [openLesson, setOpenLesson] = useState(null)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState({})
  const [burstKey, fireBurst] = useBurst()
  const [accentBurst, fireAccent] = useBurst()
  const gamified = prefs.gamification

  const count = awardedCount(journey.milestones)
  const progress = ringProgress(journey.milestones)
  const level = levelFor(journey.milestones)
  const stage = gardenStageFor(journey.milestones)

  const milestoneRows = useMemo(() => MILESTONES.map((item) => ({ ...item, awardedAt: journey.milestones[item.key] || null })), [journey.milestones])

  const addGoal = (event) => {
    event.preventDefault()
    const label = goalDraft.trim().slice(0, MAX_GOAL_LENGTH)
    if (!label) return
    updateJourney({ intentions: [...journey.intentions, { id: `g${Date.now()}`, label, status: 'active' }] })
    setGoalDraft('')
    fireBurst('claim')
    runAwards(t)
  }

  const updateGoal = (id, patch) => {
    updateJourney({ intentions: journey.intentions.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)) })
  }

  const removeGoal = (id) => {
    updateJourney({ intentions: journey.intentions.filter((goal) => goal.id !== id) })
  }

  const chooseAccent = (accent) => {
    updateJourney({ accent })
    setFlag('accentChosen')
    fireAccent('vibe')
    runAwards(t)
  }

  const checkLesson = (lesson) => {
    const chosen = answers[lesson.id] || []
    const result = scoreQuiz(lesson.answers.map((answer) => ({ answer })), lesson.answers.map((_, index) => chosen[index]))
    setResults((current) => ({ ...current, [lesson.id]: { ...result, checked: true } }))
    updateJourney({ quizzes: recordQuiz(journey.quizzes, lesson.id, result) })
    if (result.percent >= 67) fireBurst('progress')
    runAwards(t)
  }

  const retryLesson = (lessonId) => {
    setAnswers((current) => ({ ...current, [lessonId]: [] }))
    setResults((current) => ({ ...current, [lessonId]: null }))
  }

  const toggleGamification = () => {
    savePrefs({ gamification: !gamified })
  }

  return (
    <div className={`page journey-page accent-${journey.accent}`}>
      {gamified ? (
        <section className="journey-hero card spot glow-radial">
          <Ring progress={progress} count={count} total={MILESTONES.length} />
          <div className="journey-hero-copy">
            <span className="eyebrow-label">{t('journey.kicker')}</span>
            <h2>{t(`garden.stages.${stage.id}`)}</h2>
            <p>{t('journey.heroCopy')}</p>
            <span className="level-chip">{t('journey.level', { level })}</span>
            <button type="button" className="ghost-button" onClick={toggleGamification}>{t('journey.turnOff')}</button>
          </div>
        </section>
      ) : (
        <section className="card journey-off">
          <h2 className="card-title">{t('journey.offTitle')}</h2>
          <p className="card-copy">{t('journey.offCopy')}</p>
          <button type="button" className="primary-button spot" onClick={toggleGamification}>{t('journey.turnOn')}</button>
        </section>
      )}

      {gamified && (
        <section className="card garden-card" aria-labelledby="garden-heading">
          <h3 id="garden-heading" className="card-title">{t('garden.heading')}</h3>
          <p className="card-copy">{t('garden.copy')}</p>
          <Garden milestones={journey.milestones} accent={journey.accent} />
          <div className="accent-row" role="radiogroup" aria-label={t('garden.colour')}>
            {GARDEN_ACCENTS.map((accent) => (
              <button key={accent} type="button" role="radio" aria-checked={journey.accent === accent} className={`accent-swatch accent-${accent}${journey.accent === accent ? ' is-selected' : ''} spot`} onClick={() => chooseAccent(accent)} aria-label={t(`garden.accent.${accent}`)}>
                {journey.accent === accent && <FiCheck aria-hidden="true" />}
              </button>
            ))}
            <CardBurst burstKey={accentBurst} context={journey.accent} />
          </div>
          <p className="card-footnote">{t('garden.neverDies')}</p>
          <ol className="garden-stage-list">
            {GARDEN_STAGES.map((item) => (
              <li key={item.id} className={count >= item.min ? 'is-reached' : ''}>{t(`garden.stages.${item.id}`)}</li>
            ))}
          </ol>
        </section>
      )}

      {gamified && (
        <section className="card" aria-labelledby="milestones-heading">
          <h3 id="milestones-heading" className="card-title">{t('milestonesHeading')}</h3>
          <p className="card-copy">{t('milestonesCopy')}</p>
          <ul className="milestone-list">
            {milestoneRows.map((item) => (
              <li key={item.key} className={`milestone${item.awardedAt ? ' is-awarded' : ''}`}>
                <span className="milestone-mark" aria-hidden="true">{item.awardedAt ? '✿' : '○'}</span>
                <div>
                  <strong>{t(`milestones.${item.key}.title`)}</strong>
                  <p>{item.awardedAt ? t(`milestones.${item.key}.copy`) : t('milestones.notYet')}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="goals-heading">
        <h3 id="goals-heading" className="card-title">{t('goals.heading')}</h3>
        <p className="card-copy">{t('goals.copy')}</p>
        <form className="goal-form" onSubmit={addGoal}>
          <label htmlFor="goal-input" className="sr-only">{t('goals.addLabel')}</label>
          <input id="goal-input" maxLength={MAX_GOAL_LENGTH} value={goalDraft} placeholder={t('goals.placeholder')} onChange={(event) => setGoalDraft(event.target.value)} />
          <button type="submit" className="primary-button spot" disabled={!goalDraft.trim()}>{t('goals.add')}</button>
          <CardBurst burstKey={burstKey} context="claim" />
        </form>
        <ul className="goal-list">
          {journey.intentions.length === 0 && <li className="goal-empty">{t('goals.empty')}</li>}
          {journey.intentions.map((goal) => (
            <li key={goal.id} className={`goal${goal.status === 'paused' ? ' is-paused' : ''}`}>
              <label htmlFor={`goal-${goal.id}`} className="sr-only">{t('goals.editLabel')}</label>
              <input id={`goal-${goal.id}`} maxLength={MAX_GOAL_LENGTH} value={goal.label} onChange={(event) => updateGoal(goal.id, { label: event.target.value })} />
              <span className="goal-status">{goal.status === 'paused' ? t('goals.paused') : t('goals.active')}</span>
              <button type="button" className="icon-button spot" aria-label={goal.status === 'paused' ? t('goals.resume') : t('goals.pause')} onClick={() => updateGoal(goal.id, { status: goal.status === 'paused' ? 'active' : 'paused' })}>
                {goal.status === 'paused' ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
              </button>
              <button type="button" className="icon-button spot" aria-label={t('goals.remove')} onClick={() => removeGoal(goal.id)}>
                <FiTrash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <p className="card-footnote">{t('goals.privacy')}</p>
      </section>

      <section className="card" aria-labelledby="learn-heading">
        <h3 id="learn-heading" className="card-title">{t('learn.heading')}</h3>
        <p className="card-copy">{t('learn.copy')}</p>
        <div className="lesson-list">
          {LESSONS.map((lesson) => {
            const questions = t(`lessons.${lesson.id}.questions`, { returnObjects: true })
            const list = Array.isArray(questions) ? questions : []
            const isOpen = openLesson === lesson.id
            const result = results[lesson.id]
            const best = journey.quizzes[lesson.id]?.bestPercent
            return (
              <article key={lesson.id} className="lesson card-inset">
                <div className="lesson-head">
                  <div>
                    <strong>{t(`lessons.${lesson.id}.title`)}</strong>
                    {best !== undefined && <small>{t('learn.best', { percent: best })}</small>}
                  </div>
                  <button type="button" className="ghost-button spot" aria-expanded={isOpen} onClick={() => setOpenLesson(isOpen ? null : lesson.id)}>
                    {isOpen ? t('learn.close') : t('learn.open')}
                  </button>
                </div>
                {isOpen && (
                  <div className="lesson-body">
                    <p>{t(`lessons.${lesson.id}.body`)}</p>
                    {list.map((question, qIndex) => (
                      <fieldset key={qIndex} className="quiz-question">
                        <legend>{question.question}</legend>
                        {question.options.map((option, oIndex) => (
                          <label key={option} className={`quiz-option${answers[lesson.id]?.[qIndex] === oIndex ? ' is-selected' : ''}`}>
                            <input
                              type="radio"
                              name={`${lesson.id}-${qIndex}`}
                              checked={answers[lesson.id]?.[qIndex] === oIndex}
                              onChange={() => setAnswers((current) => {
                                const row = [...(current[lesson.id] || [])]
                                row[qIndex] = oIndex
                                return { ...current, [lesson.id]: row }
                              })}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                        {result?.checked && (
                          <p className={`quiz-explain${answers[lesson.id]?.[qIndex] === lesson.answers[qIndex] ? ' is-right' : ''}`}>{question.explain}</p>
                        )}
                      </fieldset>
                    ))}
                    <div className="lesson-actions">
                      <button type="button" className="primary-button spot" onClick={() => checkLesson(lesson)} disabled={!(answers[lesson.id]?.length === lesson.answers.length)}>
                        {t('learn.check')}
                      </button>
                      <button type="button" className="ghost-button" onClick={() => retryLesson(lesson.id)}>{t('learn.retry')}</button>
                    </div>
                    {result?.checked && <p className="save-state is-saved" role="status">{t('learn.result', { correct: result.correct, total: result.total })}</p>}
                  </div>
                )}
              </article>
            )
          })}
        </div>
        <p className="card-footnote">{t('learn.disclaimer')}</p>
      </section>
      {gamified && <p className="card-footnote">{t('journey.neverLocked')}</p>}
    </div>
  )
}

export default Journey
