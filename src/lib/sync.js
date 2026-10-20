// Account sync. The device store is a cache. For a signed-in user the account is the source of
// truth, so a same-day account entry always wins over a guest entry from this device.
// Every function returns { ok, error } so screens can show a saved or error state.

import { KEYS, getCheckins, getIntimacy, getJourney, getPrefs, getProfile, writeJson } from './store'

const ok = (extra = {}) => ({ ok: true, ...extra })
const fail = (error) => ({ ok: false, error: error?.message || String(error || 'Unknown error') })

const toCheckinRow = (userId, date, entry) => ({
  user_id: userId,
  date,
  phase: entry.phase || 'menstrual',
  mood: entry.mood ?? null,
  energy: entry.energy ?? null,
  period: Boolean(entry.period),
  period_start_date: entry.periodStart || null,
  period_duration_days: entry.periodDuration ?? null,
})

const fromCheckinRow = (row) => ({
  phase: row.phase,
  mood: row.mood,
  energy: row.energy,
  period: Boolean(row.period),
  periodStart: row.period_start_date || null,
  periodDuration: row.period_duration_days ?? null,
  updatedAt: row.updated_at || row.created_at || null,
})

const toIntimacyRow = (userId, date, entry) => ({
  user_id: userId,
  date,
  feeling: entry.feeling || 'warm',
  openness: entry.openness || 'maybe',
  comfort: entry.comfort ?? 5,
  desire_vibe: entry.vibe || 'tender',
})

const fromIntimacyRow = (row) => ({
  feeling: row.feeling || 'warm',
  openness: row.openness || 'maybe',
  comfort: row.comfort ?? 5,
  vibe: row.desire_vibe || 'tender',
  updatedAt: row.updated_at || row.created_at || null,
})

/** Loads the account and merges it into the device cache. The account wins for any day it holds. */
export async function pullAccount(client, userId) {
  if (!client || !userId) return fail('Not signed in.')
  try {
    const [cycles, intimacy, settings, milestones] = await Promise.all([
      client.from('cycles').select('date, phase, mood, energy, period, period_start_date, period_duration_days, created_at').eq('user_id', userId),
      client.from('intimacy_logs').select('date, feeling, openness, comfort, desire_vibe, created_at').eq('user_id', userId),
      client.from('user_settings').select('last_period_start, cycle_length, period_length, tone_preference, phase_selected, theme_preference, font_size, hide_intimacy, language_preference, gamification_enabled, show_rewards, celebrate, notifications_enabled').eq('user_id', userId).maybeSingle(),
      client.from('journey_milestones').select('milestone_key, awarded_at').eq('user_id', userId),
    ])
    const firstError = cycles.error || intimacy.error || settings.error || milestones.error
    if (firstError) throw firstError

    const checkins = { ...getCheckins() }
    for (const row of cycles.data || []) checkins[row.date] = fromCheckinRow(row)
    writeJson(KEYS.checkins, checkins)

    const intimacyCache = { ...getIntimacy() }
    for (const row of intimacy.data || []) intimacyCache[row.date] = fromIntimacyRow(row)
    writeJson(KEYS.intimacy, intimacyCache)

    if (settings.data) {
      const row = settings.data
      writeJson(KEYS.profile, {
        ...getProfile(),
        lastPeriodStart: row.last_period_start || getProfile().lastPeriodStart,
        cycleLength: row.cycle_length || getProfile().cycleLength,
        periodLength: row.period_length || getProfile().periodLength,
        tone: row.tone_preference || getProfile().tone,
        phaseSelected: row.phase_selected || getProfile().phaseSelected,
      })
      writeJson(KEYS.prefs, {
        ...getPrefs(),
        theme: row.theme_preference || getPrefs().theme,
        fontSize: row.font_size || getPrefs().fontSize,
        hideIntimacy: row.hide_intimacy ?? getPrefs().hideIntimacy,
        gamification: row.gamification_enabled ?? getPrefs().gamification,
        showRewards: row.show_rewards ?? getPrefs().showRewards,
        celebrate: row.celebrate ?? getPrefs().celebrate,
        notifications: row.notifications_enabled ?? getPrefs().notifications,
      })
    }

    const journey = getJourney()
    const remoteMilestones = { ...journey.milestones }
    for (const row of milestones.data || []) {
      if (!remoteMilestones[row.milestone_key]) remoteMilestones[row.milestone_key] = row.awarded_at
    }
    writeJson(KEYS.journey, { ...journey, milestones: remoteMilestones })
    return ok()
  } catch (error) {
    console.error('Unable to load your account data:', error)
    return fail(error)
  }
}

/**
 * Copies guest entries from this device into the account when the account has no entry for that
 * day. Same-day account entries are kept, and the device copy is then refreshed from the account.
 */
export async function importGuestData(client, userId) {
  if (!client || !userId) return fail('Not signed in.')
  try {
    const localCheckins = getCheckins()
    const localIntimacy = getIntimacy()
    const [cycles, intimacy] = await Promise.all([
      client.from('cycles').select('date').eq('user_id', userId),
      client.from('intimacy_logs').select('date').eq('user_id', userId),
    ])
    if (cycles.error) throw cycles.error
    if (intimacy.error) throw intimacy.error

    const haveCycle = new Set((cycles.data || []).map((row) => row.date))
    const haveIntimacy = new Set((intimacy.data || []).map((row) => row.date))

    const checkinRows = Object.entries(localCheckins)
      .filter(([date]) => !haveCycle.has(date))
      .map(([date, entry]) => toCheckinRow(userId, date, entry))
    const intimacyRows = Object.entries(localIntimacy)
      .filter(([date]) => !haveIntimacy.has(date))
      .map(([date, entry]) => toIntimacyRow(userId, date, entry))

    if (checkinRows.length) {
      const { error } = await client.from('cycles').upsert(checkinRows, { onConflict: 'user_id,date', ignoreDuplicates: true })
      if (error) throw error
    }
    if (intimacyRows.length) {
      const { error } = await client.from('intimacy_logs').upsert(intimacyRows, { onConflict: 'user_id,date', ignoreDuplicates: true })
      if (error) throw error
    }

    const profile = getProfile()
    if (profile.lastPeriodStart || profile.phaseSelected) {
      const { error } = await client.from('user_settings').upsert({
        user_id: userId,
        onboarding_completed: true,
        last_period_start: profile.lastPeriodStart,
        cycle_length: profile.cycleLength,
        period_length: profile.periodLength,
        tone_preference: profile.tone,
        phase_selected: profile.phaseSelected || 'menstrual',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: true })
      if (error) throw error
    }

    const milestoneRows = Object.entries(getJourney().milestones).map(([key, awardedAt]) => ({
      user_id: userId,
      milestone_key: key,
      awarded_at: awardedAt,
    }))
    if (milestoneRows.length) {
      const { error } = await client.from('journey_milestones').upsert(milestoneRows, { onConflict: 'user_id,milestone_key', ignoreDuplicates: true })
      if (error) throw error
    }

    const pulled = await pullAccount(client, userId)
    if (!pulled.ok) throw new Error(pulled.error)
    return ok({ imported: checkinRows.length + intimacyRows.length })
  } catch (error) {
    console.error('Unable to import guest data:', error)
    return fail(error)
  }
}

export async function pushCheckin(client, userId, date, entry) {
  if (!client || !userId) return ok({ skipped: true })
  const { error } = await client.from('cycles').upsert(toCheckinRow(userId, date, entry), { onConflict: 'user_id,date' })
  return error ? fail(error) : ok()
}

export async function pushIntimacy(client, userId, date, entry) {
  if (!client || !userId) return ok({ skipped: true })
  const { error } = await client.from('intimacy_logs').upsert(toIntimacyRow(userId, date, entry), { onConflict: 'user_id,date' })
  return error ? fail(error) : ok()
}

export async function pushSettings(client, userId, { profile, prefs, lang }) {
  if (!client || !userId) return ok({ skipped: true })
  const { error } = await client.from('user_settings').upsert({
    user_id: userId,
    onboarding_completed: true,
    last_period_start: profile.lastPeriodStart,
    cycle_length: profile.cycleLength,
    period_length: profile.periodLength,
    tone_preference: profile.tone,
    phase_selected: profile.phaseSelected || 'menstrual',
    theme_preference: prefs.theme,
    font_size: prefs.fontSize,
    hide_intimacy: prefs.hideIntimacy,
    gamification_enabled: prefs.gamification,
    show_rewards: prefs.showRewards,
    celebrate: prefs.celebrate,
    notifications_enabled: prefs.notifications,
    language_preference: lang,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  return error ? fail(error) : ok()
}

/** A milestone is written once. The unique key in the database rejects a second award. */
export async function pushMilestone(client, userId, key, awardedAt) {
  if (!client || !userId) return ok({ skipped: true })
  const { error } = await client.from('journey_milestones').upsert(
    { user_id: userId, milestone_key: key, awarded_at: awardedAt },
    { onConflict: 'user_id,milestone_key', ignoreDuplicates: true },
  )
  return error ? fail(error) : ok()
}

