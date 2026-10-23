import * as supabaseModule from './supabase'

describe('Supabase public client configuration & security checks', () => {
  test('Supabase client module initializes without a declaration-order error', () => {
    expect(typeof supabaseModule.initializeSupabase).toBe('function')
    expect(typeof supabaseModule.isSupabaseConfigured).toBe('boolean')
  })

  test('accepts sb_publishable_ and role=anon JWT keys, strips quotes, and blocks secret/service_role keys', () => {
    expect(supabaseModule.isPublicClientKey('"sb_publishable_demo_abc123"')).toBe(true)
    expect(supabaseModule.isPublicClientKey('sb_secret_live_supersecret')).toBe(false)

    const anonJwtPayload = btoa(JSON.stringify({ role: 'anon', iss: 'supabase' }))
    const serviceJwtPayload = btoa(JSON.stringify({ role: 'service_role', iss: 'supabase' }))

    expect(supabaseModule.isPublicClientKey(`eyJhbGciOiJIUzI1NiJ9.${anonJwtPayload}.sig`)).toBe(true)
    expect(supabaseModule.isPublicClientKey(`eyJhbGciOiJIUzI1NiJ9.${serviceJwtPayload}.sig`)).toBe(false)

    const client = supabaseModule.createConfiguredClient(
      ' "https://exampleproject.supabase.co/" ',
      ' "sb_publishable_valid_public_key" '
    )
    expect(client).not.toBeNull()
  })
})
