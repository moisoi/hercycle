// Learning lessons. Wording lives in the locale files. This file only holds the correct answer for
// each question. Quizzes are for learning and never replace medical advice.
export const LESSONS = [
  { id: 'cycleBasics', answers: [1, 1, 1] },
  { id: 'whatIsNormal', answers: [1, 1, 1] },
  { id: 'talkingToClinician', answers: [1, 1, 1] },
]

export const lessonById = (id) => LESSONS.find((lesson) => lesson.id === id) || null
