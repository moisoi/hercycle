import { celebrate } from './celebrate'
import { getCheckins, getJourney, awardMilestone, updateJourney } from './store'
import { MILESTONES, eligibleMilestones, gardenStageFor, levelFor, lessonsTried } from './journey'

/** Records a one-way private flag, such as "viewed insights". Flags never cost anything or lock features. */
export const setFlag = (flag) => {
  const journey = getJourney()
  if (journey.flags[flag]) return false
  updateJourney({ flags: { ...journey.flags, [flag]: true } })
  return true
}

/**
 * Awards whatever the user has now earned, once each. Returns the keys awarded plus any stage or
 * level change, and celebrates them when rewards are on. Feedback never blocks the action itself.
 */
export function runAwards(t) {
  const journey = getJourney()
  const activeIntentions = journey.intentions.length
  const earned = eligibleMilestones({
    checkinDays: Object.keys(getCheckins()).length,
    hasReflection: Boolean(journey.flags.reflection),
    intentionCount: activeIntentions,
    lessonsTried: lessonsTried(journey.quizzes),
    reviewedMonth: Boolean(journey.flags.reviewedMonth),
    accentChosen: Boolean(journey.flags.accentChosen),
  })

  const beforeStage = gardenStageFor(journey.milestones).id
  const beforeLevel = levelFor(journey.milestones)
  const awarded = earned.filter((key) => awardMilestone(key))
  const after = getJourney().milestones
  const afterStage = gardenStageFor(after)
  const afterLevel = levelFor(after)

  if (t) {
    awarded.forEach((key) => {
      celebrate('milestone', { title: t(`milestones.${key}.title`), body: t(`milestones.${key}.copy`) })
    })
    if (afterStage.id !== beforeStage) {
      celebrate('stage', { stage: afterStage.id, title: t(`garden.stages.${afterStage.id}`), body: t('garden.stageCopy') })
    }
    if (afterLevel > beforeLevel) {
      celebrate('level', { title: t('levelUp', { level: afterLevel }), body: t('levelCopy') })
    }
  }

  return { awarded, stageChanged: afterStage.id !== beforeStage, levelChanged: afterLevel > beforeLevel, total: MILESTONES.length }
}
