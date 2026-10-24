import { createClient } from '@supabase/supabase-js'

const cleanConfigValue = (value) =>
  String(value || '')
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim()

export const isPublicClientKey = (value) => {
  const key = cleanConfigValue(value)
  if (!key || /your-project|your-supabase|placeholder/i.test(key)) return false
  if (/^sb_secret_/i.test(key) || /service_role/i.test(key)) return false
  if (/^sb_publishable_[A-Za-z0-9_.-]+$/i.test(key)) return true

  const parts = key.split('.')
  if (parts.length !== 3) return false
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const payload = JSON.parse(decoded)
    return payload?.role === 'anon'
  } catch {
    return false
  }
}

const buildSupabaseUrl = process.env.REACT_APP_SUPABASE_URL
const buildSupabaseKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

export let supabase = createConfiguredClient(buildSupabaseUrl, buildSupabaseKey)
export let isSupabaseConfigured = Boolean(supabase)

let runtimeConfigPromise = null

// Cloudflare Pages provides runtime variables through /api/config.
// Allow safe retries when forceRetry is requested or when a prior attempt failed.
export const initializeSupabase = ({ forceRetry = false } = {}) => {
  if (supabase) return Promise.resolve(supabase)
  if (runtimeConfigPromise && !forceRetry) return runtimeConfigPromise

  runtimeConfigPromise = (async () => {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return null

    try {
      const response = await window.fetch('/api/config', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok || !contentType.includes('application/json')) {
        runtimeConfigPromise = null
        return null
      }

      const config = await response.json()
      if (config?.configured !== true) {
        runtimeConfigPromise = null
        return null
      }

      const client = createConfiguredClient(config.supabaseUrl, config.anonKey)
      if (!client) {
        runtimeConfigPromise = null
        return null
      }
      supabase = client
      isSupabaseConfigured = true
      return supabase
    } catch {
      runtimeConfigPromise = null
      return null
    }
  })()

  return runtimeConfigPromise
}

export function createConfiguredClient(urlValue, keyValue) {
  const url = cleanConfigValue(urlValue)
  const key = cleanConfigValue(keyValue)
  if (!url || !key || /your-project|your-supabase|placeholder/i.test(url + key)) return null
  if (!isPublicClientKey(key)) return null

  try {
    const parsedUrl = new URL(url)
    const secure = parsedUrl.protocol === 'https:'
    const local = parsedUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsedUrl.hostname)
    if ((!secure && !local) || parsedUrl.username || parsedUrl.password) return null

    return createClient(url.replace(/\/+$/, ''), key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch {
    return null
  }
}

export { supabase as default }
