import { createClient } from '@supabase/supabase-js'

const buildSupabaseUrl = process.env.REACT_APP_SUPABASE_URL
const buildSupabaseKey =
  process.env.REACT_APP_SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

export let supabase = createConfiguredClient(buildSupabaseUrl, buildSupabaseKey)
export let isSupabaseConfigured = Boolean(supabase)

let runtimeConfigPromise = null

// Cloudflare Pages can provide these values as Pages Function runtime variables.
// In local CRA development, optional REACT_APP_* build variables work directly.
export const initializeSupabase = () => {
  if (supabase) return Promise.resolve(supabase)
  if (runtimeConfigPromise) return runtimeConfigPromise

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
      if (!response.ok || !contentType.includes('application/json')) return null

      const config = await response.json()
      if (config?.configured !== true) return null

      supabase = createConfiguredClient(config.supabaseUrl, config.anonKey)
      isSupabaseConfigured = Boolean(supabase)
      return supabase
    } catch {
      // The CRA dev server does not run Pages Functions; guest mode still works.
      return null
    }
  })()

  return runtimeConfigPromise
}

function createConfiguredClient(urlValue, keyValue) {
  const url = String(urlValue || '').trim()
  const key = String(keyValue || '').trim()
  if (!url || !key || /your-project|your-supabase|placeholder/i.test(url + key)) return null

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
