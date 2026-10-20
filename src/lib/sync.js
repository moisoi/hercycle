import { supabase } from './supabase'
import { getCheckins, getIntimacy, getJourney, getProfile, saveProfile } from './repo'
import { KEYS, readJson, writeJson } from './store'

/**
 * Merges guest data with account data, keyed by date.
 * When both have the same day, the account's entry wins. Days only on this device are kept
 * and reported as `imported`, so they can be uploaded.
 */
export function mergeByDate(local = {}, remote = {}) {
  const merged = { ...local, ...remote }
  const imported = Object.keys(local).filter((key) => !(key in remote))
  return { merged, imported }
}

export function mergeMilestones(local = {}, remote = {}) {
  const merged = { ...remote }
  for (const [key, awardedAt] of Object.entries(local)) {
    if (!merged[key]) merged[key] = awardedAt
  }
  return merged
}

const checkinRow = (userId, dateKey, entry) => ({
  user_id: userId,
  date: dateKey,
  phase: entry.phase || 'unknown',
  mood: entry.mood ?? null,
  energy: entry.energy ?? null,
  period: Boolean(entry.period),
})

const intimacyRow = (userId, dateKey, entry) => ({
  user_id: userId,
  date: dateKey,
  libido: entry.libido ?? null,
  intimacy_level: entry.intimacyLevel ?? null,
  traffic_light: entry.trafficLight ?? null,
  preferred_terms: entry.preferredTerms ?? [],
})

function requireClient() {
  if (!supabase) {
    throw new Error('Accounts are not set up on this deployment. Your data stays on this device.')
  }
  return supabase
}

/**
 * Pulls the account's data, imports guest-only days, and pushes them up. Throws with a readable
 * message when the backend is missing or a request fails, so the UI can say so.
 */
export async function syncAccount(userId) {
  const client = requireClient()

  const [cycles, intimacy, milestones, settings] = await Promise.all([
    client.from('cycles').select('date, phase, mood, energy, period').eq('user_id', userId),
    client.from('intimacy_logs').select('date, libido, intimacy_level, traffic_light, preferred_terms').eq('user_id', userId),
    client.from('journey_milestones').select('milestone_key, awarded_at').eq('user_id', userId),
    client.from('user_settings').select('last_period_start, cycle_length, period_length, tone_preference, font_size').eq('user_id', userId).maybeSingle(),
  ])
  for (const result of [cycles, intimacy, milestones, settings]) {
    if (result.error) throw new Error(result.error.message)
  }

  // Check-ins: account wins for the same day.
  const remoteCheckins = Object.fromEntries(
    (cycles.data || []).map((row) => [row.date, { phase: row.phase, mood: row.mood, energy: row.energy, period: row.period }])
  )
  const checkins = mergeByDate(getCheckins(), remoteCheckins)
  writeJson(KEYS.checkins, checkins.merged)

  const remoteIntimacy = Object.fromEntries(
    (intimacy.data || []).map((row) => [
      row.date,
      { libido: row.libido, intimacyLevel: row.intimacy_level, trafficLight: row.traffic_light, preferredTerms: row.preferred_terms || [] },
    ])
  )
  const intimacyMerge = mergeByDate(getIntimacy(), remoteIntimacy)
  writeJson(KEYS.intimacy, intimacyMerge.merged)

  const remoteMilestones = Object.fromEntries((milestones.data || []).map((row) => [row.milestone_key, row.awarded_at]))
  const journey = getJourney()
  writeJson(KEYS.journey, { ...journey, milestones: mergeMilestones(journey.milestones, remoteMilestones) })

  if (settings.data) {
    saveProfile({
      lastPeriodStart: settings.data.last_period_start || getProfile().lastPeriodStart,
      cycleLength: settings.data.cycle_length || getProfile().cycleLength,
      periodLength: settings.data.period_length || getProfile().periodLength,
      tone: settings.data.tone_preference || getProfile().tone,
      fontSize: settings.data.font_size || getProfile().fontSize,
    })
  }

  // Upload guest-only days so they are not lost.
  const localOnlyCheckins = checkins.imported.map((key) => checkinRow(userId, key, getCheckins()[key]))
  const localOnlyIntimacy = intimacyMerge.imported.map((key) => intimacyRow(userId, key, getIntimacy()[key]))
  if (localOnlyCheckins.length) {
    const { error } = await client.from('cycles').upsert(localOnlyCheckins, { onConflict: 'user_id,date' })
    if (error) throw new Error(error.message)
  }
  if (localOnlyIntimacy.length) {
    const { error } = await client.from('intimacy_logs').upsert(localOnlyIntimacy, { onConflict: 'user_id,date' })
    if (error) throw new Error(error.message)
  }

  return { importedCheckins: localOnlyCheckins.length, importedIntimacy: localOnlyIntimacy.length }
}

/** Saves one milestone. The table's unique key makes repeat awards a no-op on the server too. */
export async function pushMilestone(userId, key, awardedAt) {
  const client = requireClient()
  const { error } = await client
    .from('journey_milestones')
    .upsert({ user_id: userId, milestone_key: key, awarded_at: awardedAt }, { onConflict: 'user_id,milestone_key', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export async function pushProfile(userId, profile) {
  const client = requireClient()
  const { error } = await client.from('user_settings').upsert(
    {
      user_id: userId,
      onboarding_completed: Boolean(profile.onboarded),
      last_period_start: profile.lastPeriodStart,
      cycle_length: profile.cycleLength,
      period_length: profile.periodLength,
      tone_preference: profile.tone,
      font_size: profile.fontSize,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
}

export const readStoredCheckins = () => readJson(KEYS.checkins, {})
