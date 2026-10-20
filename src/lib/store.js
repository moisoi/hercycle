import { useMemo, useSyncExternalStore } from 'react'

// Every value lives in localStorage on this device. Signed-in users also sync to Supabase
// (see sync.js). Guest data never leaves the device.
export const KEYS = {
  profile: 'hercycle.profile',
  checkins: 'hercycle.checkins',
  intimacy: 'hercycle.intimacy',
  journey: 'hercycle.journey',
  prefs: 'hercycle.prefs',
  motion: 'hercycle.motion',
  lang: 'hercycle.lang',
}

const listeners = new Set()

export function readRaw(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeRaw(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch (error) {
    // Storage can be full or blocked (private mode). The UI still works for this session.
    console.warn('HerCycle could not save on this device:', error)
  }
  listeners.forEach((listener) => listener())
}

export function readJson(key, fallback) {
  const raw = readRaw(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  writeRaw(key, JSON.stringify(value))
}

function subscribe(listener) {
  listeners.add(listener)
  const onStorage = () => listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Reactive read of a JSON value. Pass a stable `fallback` (a module-level constant). */
export function useStoredJson(key, fallback) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null)
  return useMemo(() => {
    if (!raw) return fallback
    try {
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  }, [raw, fallback])
}

/** Reactive read of a raw string value, such as the motion switch ('on' or 'off'). */
export function useRaw(key) {
  return useSyncExternalStore(subscribe, () => readRaw(key), () => null)
}
