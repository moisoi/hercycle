const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
  },
})

// Only return a recognized public Supabase key. This endpoint never reads a
// service-role variable and rejects sb_secret_* keys and service-role JWTs.
export async function onRequestGet({ env }) {
  const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const anonKey = String(env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || '').trim()

  if (!isValidSupabaseUrl(supabaseUrl) || !isPublicSupabaseKey(anonKey)) {
    return jsonResponse({ configured: false }, 503)
  }

  return jsonResponse({
    configured: true,
    supabaseUrl,
    anonKey,
  })
}

const isValidSupabaseUrl = (value) => {
  try {
    const url = new URL(value)
    const secure = url.protocol === 'https:'
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
    return (secure || local) && !url.username && !url.password && !url.search && !url.hash
  } catch {
    return false
  }
}

const isPublicSupabaseKey = (value) => {
  const key = String(value || '').trim()
  if (/^sb_secret_/i.test(key)) return false
  if (/^sb_publishable_[A-Za-z0-9_-]+$/i.test(key)) return true

  const jwtParts = key.split('.')
  if (jwtParts.length !== 3) return false
  try {
    const base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    return JSON.parse(decoded).role === 'anon'
  } catch {
    return false
  }
}
