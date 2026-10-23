import { supabase } from './supabase'
import { GUEST_CYCLES_KEY, GUEST_INTIMACY_KEY } from './account'
import { localDateString } from './period'

export const PREFERENCES_STORAGE_KEY = 'hercycle.preferences'
export const ONBOARDING_STORAGE_KEY = 'hercycle.onboarding'
export const INTIMACY_MENU_STORAGE_KEY = 'hercycle.intimacyMenu'

export const DEFAULT_PREFERENCES = {
  theme: 'light',
  accentPalette: 'rosewood',
  fontSize: 'medium',
  hideIntimacy: false,
  reduceMotion: false,
  journeyEnabled: true,
  gamificationEnabled: true,
  journeyRewards: true,
  showRewards: true,
  remindersEnabled: true,
  checkinCadence: 'flexible',
  checkInCadence: 'flexible',
}

const normalizePrefs = (raw = {}) => {
  const journeyEnabled =
    raw.journeyEnabled !== undefined
      ? Boolean(raw.journeyEnabled)
      : raw.gamificationEnabled !== undefined
      ? Boolean(raw.gamificationEnabled)
      : true
  const journeyRewards =
    raw.journeyRewards !== undefined
      ? Boolean(raw.journeyRewards)
      : raw.showRewards !== undefined
      ? Boolean(raw.showRewards)
      : true
  const cadence = raw.checkinCadence || raw.checkInCadence || 'flexible'

  return {
    ...DEFAULT_PREFERENCES,
    ...raw,
    journeyEnabled,
    gamificationEnabled: journeyEnabled,
    journeyRewards,
    showRewards: journeyRewards,
    checkinCadence: cadence,
    checkInCadence: cadence,
  }
}

export const emitCareUpdate = (detail = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('hercycle:data-changed', {
      detail: { timestamp: Date.now(), ...detail },
    })
  )
}

export const subscribeCareUpdates = (callback) => {
  if (typeof window === 'undefined') return () => {}
  const handler = (event) => callback(event?.detail || {})
  window.addEventListener('hercycle:data-changed', handler)
  window.addEventListener('hercycle:preferences-changed', handler)
  return () => {
    window.removeEventListener('hercycle:data-changed', handler)
    window.removeEventListener('hercycle:preferences-changed', handler)
  }
}

export const readPreferences = () => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
    return normalizePrefs(raw)
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export const loadPreferences = readPreferences

export const applyPreferencesToDocument = (preferences = readPreferences()) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (preferences.theme === 'system') root.setAttribute('data-theme', 'system')
  else if (preferences.theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')

  root.setAttribute(
    'data-font-size',
    ['small', 'medium', 'large'].includes(preferences.fontSize)
      ? preferences.fontSize
      : 'medium'
  )
  root.setAttribute('data-accent', preferences.accentPalette || 'rosewood')
  root.setAttribute('data-reduce-motion', preferences.reduceMotion ? 'true' : 'false')
  root.setAttribute('data-motion', preferences.reduceMotion ? 'reduced' : 'full')
}

export const applyDocumentPreferences = applyPreferencesToDocument

export const savePreferences = async (firstArg, secondArg = null) => {
  const userId =
    firstArg === null || typeof firstArg === 'string'
      ? firstArg
      : typeof secondArg === 'string'
      ? secondArg
      : null
  const nextPreferences =
    firstArg && typeof firstArg === 'object' ? firstArg : secondArg || {}

  const merged = normalizePrefs(nextPreferences)
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // Keep runtime state working even if storage is unavailable.
  }

  applyPreferencesToDocument(merged)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hercycle:preferences-changed', { detail: merged }))
  }
  emitCareUpdate({ source: 'preferences', preferences: merged })

  if (userId && supabase) {
    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        theme_preference: merged.theme,
        font_size: merged.fontSize,
        hide_intimacy: Boolean(merged.hideIntimacy),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) throw error
  }

  return merged
}

export const readOnboarding = () => {
  try {
    return JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export const saveOnboarding = async (values, userId = null) => {
  const current = readOnboarding()
  const merged = {
    phase_selected: values.phase_selected || current.phase_selected || 'menstrual',
    tone_preference: values.tone_preference || current.tone_preference || 'playful',
  }
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // Ignore storage issues.
  }

  if (userId && supabase) {
    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        ...merged,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) throw error
  }

  emitCareUpdate({ source: 'onboarding', onboarding: merged })
  return merged
}

export const readDeviceCycles = () => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(GUEST_CYCLES_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return [...raw]
      .filter((item) => item && typeof item.date === 'string')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  } catch {
    return []
  }
}

export const writeDeviceCycle = (entry) => {
  const cleanEntry = {
    id: entry.id || `local-cycle-${entry.date}`,
    phase: entry.phase || 'menstrual',
    mood: Number(entry.mood) || 5,
    energy: Number(entry.energy) || 5,
    libido: entry.libido === null || entry.libido === undefined ? null : Number(entry.libido),
    period: Boolean(entry.period),
    date: entry.date || localDateString(),
    period_start_date: entry.period ? entry.period_start_date || entry.date || localDateString() : null,
    period_duration_days: entry.period ? Number(entry.period_duration_days) || 5 : null,
    updated_at: new Date().toISOString(),
    source: 'device',
  }

  const existing = readDeviceCycles().filter((item) => item.date !== cleanEntry.date)
  const updated = [cleanEntry, ...existing].sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  )
  try {
    window.localStorage.setItem(GUEST_CYCLES_KEY, JSON.stringify(updated))
  } catch {
    // Ignore quota failure.
  }
  emitCareUpdate({ source: 'cycle-log', entry: cleanEntry })
  return { saved: cleanEntry, entries: updated }
}

export const loadEffectiveCycles = async (userId = null, limit = 90) => {
  if (!userId || !supabase) {
    return readDeviceCycles().slice(0, limit)
  }

  const { data, error } = await supabase
    .from('cycles')
    .select('id, phase, mood, energy, libido, period, date, period_start_date, period_duration_days')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export const loadUserCycles = loadEffectiveCycles

export const loadCycleForDate = async (userId, date) => {
  if (!userId || !supabase) {
    return readDeviceCycles().find((item) => item.date === date) || null
  }

  const { data, error } = await supabase
    .from('cycles')
    .select('phase, mood, energy, libido, period, period_start_date, period_duration_days')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export const saveCycleEntry = async (firstArg, secondArg = null) => {
  const userId =
    firstArg === null || typeof firstArg === 'string'
      ? firstArg
      : typeof secondArg === 'string'
      ? secondArg
      : null
  const entry = firstArg && typeof firstArg === 'object' ? firstArg : secondArg || {}

  if (!userId || !supabase) {
    const { saved, entries } = writeDeviceCycle(entry)
    return { saved, entries, mode: 'device' }
  }

  const payload = {
    user_id: userId,
    phase: entry.phase,
    mood: entry.mood,
    libido: entry.libido,
    energy: entry.energy,
    period: Boolean(entry.period),
    date: entry.date,
    period_start_date: entry.period ? entry.period_start_date : null,
    period_duration_days: entry.period ? Number(entry.period_duration_days) : null,
  }

  const { error } = await supabase
    .from('cycles')
    .upsert(payload, { onConflict: 'user_id,date' })
  if (error) throw error

  const entries = await loadEffectiveCycles(userId).catch(() => [payload])
  emitCareUpdate({ source: 'cycle-log', entry: payload, mode: 'account' })
  return { saved: payload, entries, mode: 'account' }
}

export const readDeviceIntimacyLogs = () => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(GUEST_INTIMACY_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return [...raw]
      .filter((item) => item && typeof item.date === 'string')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  } catch {
    return []
  }
}

export const loadUserIntimacy = async (userId = null, limit = 30) => {
  if (!userId || !supabase) {
    return readDeviceIntimacyLogs().slice(0, limit)
  }

  const { data, error } = await supabase
    .from('intimacy_logs')
    .select('libido, intimacy_level, traffic_light, preferred_terms, desire_vibe, date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export const loadIntimacyForDate = async (userId = null, date = localDateString()) => {
  const rows = await loadUserIntimacy(userId)
  return rows.find((item) => item.date === date) || null
}

export const saveIntimacyEntry = async (firstArg, secondArg = null) => {
  const userId =
    firstArg === null || typeof firstArg === 'string'
      ? firstArg
      : typeof secondArg === 'string'
      ? secondArg
      : null
  const entry = firstArg && typeof firstArg === 'object' ? firstArg : secondArg || {}

  const targetDate = entry.date || localDateString()
  if (!userId || !supabase) {
    const cleanEntry = {
      id: `local-intimacy-${targetDate}`,
      libido: entry.libido ?? null,
      intimacy_level: Number(entry.intimacy_level) || 0,
      traffic_light: entry.traffic_light || null,
      preferred_terms: Array.isArray(entry.preferred_terms) ? entry.preferred_terms : [],
      desire_vibe: ['tender', 'playful', 'naughty'].includes(entry.desire_vibe)
        ? entry.desire_vibe
        : 'tender',
      tried_rituals: Array.isArray(entry.tried_rituals) ? entry.tried_rituals : [],
      date: targetDate,
      updated_at: new Date().toISOString(),
      source: 'device',
    }
    const existing = readDeviceIntimacyLogs().filter((item) => item.date !== targetDate)
    const updated = [cleanEntry, ...existing].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    )
    try {
      window.localStorage.setItem(GUEST_INTIMACY_KEY, JSON.stringify(updated))
    } catch {
      // Ignore quota failure.
    }
    emitCareUpdate({ source: 'intimacy', entry: cleanEntry, mode: 'device' })
    return { saved: cleanEntry, mode: 'device' }
  }

  const payload = {
    user_id: userId,
    libido: entry.libido ?? null,
    intimacy_level: Number(entry.intimacy_level) || 0,
    traffic_light: entry.traffic_light || null,
    preferred_terms: Array.isArray(entry.preferred_terms) ? entry.preferred_terms : [],
    desire_vibe: ['tender', 'playful', 'naughty'].includes(entry.desire_vibe)
      ? entry.desire_vibe
      : 'tender',
    date: targetDate,
  }
  const { error } = await supabase
    .from('intimacy_logs')
    .upsert(payload, { onConflict: 'user_id,date' })
  if (error) throw error

  emitCareUpdate({ source: 'intimacy', entry: payload, mode: 'account' })
  return { saved: payload, mode: 'account' }
}

export const readIntimacyMenuState = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INTIMACY_MENU_STORAGE_KEY) || '{}')
    return {
      triedIds: Array.isArray(parsed.triedIds) ? parsed.triedIds : [],
      favoriteIds: Array.isArray(parsed.favoriteIds) ? parsed.favoriteIds : [],
    }
  } catch {
    return { triedIds: [], favoriteIds: [] }
  }
}

export const writeIntimacyMenuState = (next) => {
  try {
    window.localStorage.setItem(INTIMACY_MENU_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage issues.
  }
  emitCareUpdate({ source: 'intimacy-menu', state: next })
}

export const exportLocalCareSnapshot = () => ({
  exportedAt: new Date().toISOString(),
  app: 'HerCycle',
  preferences: readPreferences(),
  onboarding: readOnboarding(),
  deviceCycles: readDeviceCycles(),
  deviceIntimacy: readDeviceIntimacyLogs(),
  journey: (() => {
    try {
      return JSON.parse(window.localStorage.getItem('hercycle.journey') || '{}')
    } catch {
      return {}
    }
  })(),
})

export const exportUserDataSnapshot = exportLocalCareSnapshot

export const clearLocalCareData = () => {
  const keysToClear = [
    GUEST_CYCLES_KEY,
    GUEST_INTIMACY_KEY,
    INTIMACY_MENU_STORAGE_KEY,
    'hercycle.journey',
    'hercycle.luna.thread.guest',
  ]
  try {
    keysToClear.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore storage errors.
  }
  emitCareUpdate({ source: 'clear-local' })
}

export const clearLocalDeviceEntries = clearLocalCareData
