const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
  },
})

const cleanEnvString = (value) =>
  String(value || '')
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim()

// Only return a recognized public Supabase key. This endpoint never reads a
// service-role variable and rejects sb_secret_* keys and service-role JWTs.
export async function onRequestGet({ env = {} }) {
  const urlCandidates = [
    env.SUPABASE_URL,
    env.REACT_APP_SUPABASE_URL,
    env.VITE_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_URL,
  ]
  const keyCandidates = [
    env.SUPABASE_ANON_KEY,
    env.SUPABASE_PUBLISHABLE_KEY,
    env.REACT_APP_SUPABASE_ANON_KEY,
    env.REACT_APP_SUPABASE_KEY,
    env.VITE_SUPABASE_ANON_KEY,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ]

  const supabaseUrl = urlCandidates
    .map((candidate) => cleanEnvString(candidate).replace(/\/+$/, ''))
    .find((candidate) => isValidSupabaseUrl(candidate)) || ''

  const anonKey = keyCandidates
    .map((candidate) => cleanEnvString(candidate))
    .find((candidate) => isPublicSupabaseKey(candidate)) || ''

  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ configured: false }, 503)
  }

  return jsonResponse({
    configured: true,
    supabaseUrl,
    anonKey,
  })
}

export const isValidSupabaseUrl = (value) => {
  if (!value || /your-project|placeholder/i.test(value)) return false
  try {
    const url = new URL(value)
    const secure = url.protocol === 'https:'
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
    return (secure || local) && !url.username && !url.password && !url.search && !url.hash
  } catch {
    return false
  }
}

export const isPublicSupabaseKey = (value) => {
  const key = cleanEnvString(value)
  if (!key || /your-supabase|placeholder/i.test(key)) return false
  if (/^sb_secret_/i.test(key)) return false
  if (/service_role/i.test(key)) return false
  if (/^sb_publishable_[A-Za-z0-9_.-]+$/i.test(key)) return true

  const jwtParts = key.split('.')
  if (jwtParts.length !== 3) return false
  try {
    const base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const payload = JSON.parse(decoded)
    return payload?.role === 'anon'
  } catch {
    return false
  }
}
