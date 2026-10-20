// Personal Journey: private milestones, a garden that only grows, and optional lessons.
// Milestones describe what someone did (reflected, learned, planned). They never score
// health, regularity, symptoms, fertility, or intimacy, and they are never removed.

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

export const MILESTONE_KEYS = MILESTONES.map((item) => item.key)

// Garden stages are reached by milestone count. Counts only go up, so a plant never shrinks.
export const STAGES = [
  { id: 'seedbed', min: 0 },
  { id: 'seedling', min: 1 },
  { id: 'sprout', min: 2 },
  { id: 'bud', min: 4 },
  { id: 'bloom', min: 6 },
  { id: 'grove', min: 8 },
]

export const LESSON_IDS = ['cycleBasics', 'whatIsNormal', 'talkingToClinician']

const milestoneCount = (awarded) => {
  const keys = Array.isArray(awarded) ? awarded : Object.keys(awarded || {})
  return keys.filter((key) => MILESTONE_KEYS.includes(key)).length
}

export function stageFor(awarded) {
  const count = milestoneCount(awarded)
  return [...STAGES].reverse().find((stage) => count >= stage.min) || STAGES[0]
}

export function nextStageFor(awarded) {
  const count = milestoneCount(awarded)
  return STAGES.find((stage) => stage.min > count) || null
}

/** 0 to 1 progress toward the next garden stage. Full at the top stage. */
export function ringProgress(awarded) {
  const count = milestoneCount(awarded)
  const current = stageFor(awarded)
  const next = nextStageFor(awarded)
  if (!next) return 1
  const span = next.min - current.min
  return Math.min(1, Math.max(0, (count - current.min) / span))
}

/**
 * Which milestones the current state has earned. Awarding is idempotent in repo.awardMilestone,
 * so calling this often is safe. Nothing here rewards cycle regularity, symptoms, fertility,
 * or intimacy: intimacy logs are never an input.
 */
export function eligibleMilestones({
  checkinDays = 0,
  hasReflection = false,
  intentionCount = 0,
  lessonsDone = 0,
  reviewedMonth = false,
  accentChosen = false,
} = {}) {
  const keys = []
  if (checkinDays >= 1) keys.push('first_checkin')
  if (checkinDays >= 5) keys.push('five_check_ins')
  if (hasReflection) keys.push('first_reflection')
  if (intentionCount >= 1) keys.push('first_intention')
  if (lessonsDone >= 1) keys.push('first_lesson')
  if (lessonsDone >= LESSON_IDS.length) keys.push('learning_milestone')
  if (reviewedMonth) keys.push('monthly_review')
  if (accentChosen) keys.push('make_it_yours')
  return keys
}

/** Counts correct answers. Retries are free, so this only reports the result for one attempt. */
export function scoreQuiz(questions = [], answers = []) {
  const total = questions.length
  const correct = questions.reduce((sum, question, index) => (answers[index] === question.answer ? sum + 1 : sum), 0)
  return { correct, total }
}

export const lessonsCompleted = (quizResults = {}) =>
  LESSON_IDS.filter((id) => quizResults[id] && quizResults[id].attempts > 0).length
