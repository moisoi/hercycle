// Gamification rules. Milestones reflect what the user chose to do. They never score health,
// cycle regularity, symptoms, fertility, or intimacy, and nothing is ever removed.

export const MILESTONES = [
  { key: 'first_checkin', badge: false },
  { key: 'five_check_ins', badge: false },
  { key: 'first_reflection', badge: true },
  { key: 'first_intention', badge: false },
  { key: 'first_lesson', badge: false },
  { key: 'learning_milestone', badge: true },
  { key: 'monthly_review', badge: true },
  { key: 'make_it_yours', badge: false },
]

// Garden stages depend on how many milestones are kept. The garden only moves forward.
export const GARDEN_STAGES = [
  { id: 'seed', min: 0 },
  { id: 'sprout', min: 1 },
  { id: 'sapling', min: 3 },
  { id: 'bloom', min: 5 },
  { id: 'grove', min: 7 },
]

export const LESSON_IDS = ['cycleBasics', 'whatIsNormal', 'talkingToClinician']

export const GARDEN_ACCENTS = ['berry', 'sage', 'peach', 'lavender']

export const awardedCount = (milestones = {}) => MILESTONES.filter((item) => milestones[item.key]).length

export const gardenStageFor = (milestones = {}) => {
  const count = awardedCount(milestones)
  return [...GARDEN_STAGES].reverse().find((stage) => count >= stage.min) || GARDEN_STAGES[0]
}

export const nextGardenStage = (milestones = {}) => {
  const count = awardedCount(milestones)
  return GARDEN_STAGES.find((stage) => stage.min > count) || null
}

/** 0 to 1 progress across all milestones, used by the journey ring. */
export const ringProgress = (milestones = {}) => awardedCount(milestones) / MILESTONES.length

/** Which milestones the user has now earned, given their activity. Keys only; the caller awards them. */
export function eligibleMilestones({
  checkinDays = 0,
  hasReflection = false,
  intentionCount = 0,
  lessonsTried = 0,
  reviewedMonth = false,
  accentChosen = false,
} = {}) {
  const earned = []
  if (checkinDays >= 1) earned.push('first_checkin')
  if (checkinDays >= 5) earned.push('five_check_ins')
  if (hasReflection) earned.push('first_reflection')
  if (intentionCount >= 1) earned.push('first_intention')
  if (lessonsTried >= 1) earned.push('first_lesson')
  if (lessonsTried >= LESSON_IDS.length) earned.push('learning_milestone')
  if (reviewedMonth) earned.push('monthly_review')
  if (accentChosen) earned.push('make_it_yours')
  return earned
}

/** Scores one quiz attempt. Retries are always allowed and the best result is kept. */
export function scoreQuiz(questions = [], answers = []) {
  const total = questions.length
  const correct = questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0)
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0 }
}

export const recordQuiz = (quizzes = {}, lessonId, result) => {
  const previous = quizzes[lessonId] || { bestPercent: 0, attempts: 0 }
  return {
    ...quizzes,
    [lessonId]: {
      bestPercent: Math.max(previous.bestPercent, result.percent),
      attempts: previous.attempts + 1,
    },
  }
}

export const lessonsTried = (quizzes = {}) => LESSON_IDS.filter((id) => quizzes[id]?.attempts > 0).length

// Level-up is a learning rhythm: two milestones per level, up to level 5. It never decreases.
export const LEVEL_MAX = 5
export const levelFor = (milestones = {}) => Math.min(LEVEL_MAX, Math.floor(awardedCount(milestones) / 2) + 1)
