import { LESSON_IDS, eligibleMilestones, lessonsCompleted, nextStageFor, ringProgress, scoreQuiz, stageFor } from './journey'

describe('eligibleMilestones', () => {
  test('rewards logging and reflecting, not cycle or body outcomes', () => {
    expect(eligibleMilestones({ checkinDays: 1 })).toEqual(['first_checkin'])
    expect(eligibleMilestones({ checkinDays: 5 })).toEqual(['first_checkin', 'five_check_ins'])
    expect(eligibleMilestones({ hasReflection: true })).toEqual(['first_reflection'])
  })

  test('learning milestone needs every lesson, not just one', () => {
    expect(eligibleMilestones({ lessonsDone: 1 })).toContain('first_lesson')
    expect(eligibleMilestones({ lessonsDone: 1 })).not.toContain('learning_milestone')
    expect(eligibleMilestones({ lessonsDone: LESSON_IDS.length })).toContain('learning_milestone')
  })

  test('nothing is awarded for an empty state', () => {
    expect(eligibleMilestones({})).toEqual([])
  })
})

describe('garden stages only move forward', () => {
  test('a new journey starts as a seedbed', () => {
    expect(stageFor([]).id).toBe('seedbed')
    expect(stageFor({}).id).toBe('seedbed')
  })

  test('stages advance with milestone count', () => {
    expect(stageFor(['first_checkin']).id).toBe('seedling')
    expect(stageFor(['a', 'b', 'first_checkin', 'five_check_ins']).id).toBe('sprout')
    const eight = ['first_checkin', 'five_check_ins', 'first_reflection', 'first_intention', 'first_lesson', 'learning_milestone', 'monthly_review', 'make_it_yours']
    expect(stageFor(eight).id).toBe('grove')
    expect(nextStageFor(eight)).toBeNull()
  })

  test('ring progress is a fraction toward the next stage and is full at the top', () => {
    expect(ringProgress([])).toBe(0)
    expect(ringProgress(['first_checkin'])).toBe(0)
    expect(ringProgress(['first_checkin', 'five_check_ins', 'first_reflection'])).toBeCloseTo(0.5)
    const all = ['first_checkin', 'five_check_ins', 'first_reflection', 'first_intention', 'first_lesson', 'learning_milestone', 'monthly_review', 'make_it_yours']
    expect(ringProgress(all)).toBe(1)
  })

  test('unknown keys do not change the garden', () => {
    expect(stageFor(['not_a_milestone'])).toEqual({ id: 'seedbed', min: 0 })
  })
})

describe('quizzes and lessons', () => {
  const questions = [{ answer: 1 }, { answer: 0 }, { answer: 2 }]

  test('scores correct answers without penalising wrong ones', () => {
    expect(scoreQuiz(questions, [1, 1, 2])).toEqual({ correct: 2, total: 3 })
    expect(scoreQuiz(questions, [])).toEqual({ correct: 0, total: 3 })
  })

  test('learning milestone needs every lesson attempted at least once', () => {
    expect(lessonsCompleted({})).toBe(0)
    expect(lessonsCompleted({ [LESSON_IDS[0]]: { attempts: 1 } })).toBe(1)
    const all = Object.fromEntries(LESSON_IDS.map((id) => [id, { attempts: 2 }]))
    expect(lessonsCompleted(all)).toBe(LESSON_IDS.length)
  })
})
