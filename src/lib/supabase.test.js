import * as supabaseModule from './supabase'

test('Supabase client module initializes without a declaration-order error', () => {
  expect(typeof supabaseModule.initializeSupabase).toBe('function')
  expect(typeof supabaseModule.isSupabaseConfigured).toBe('boolean')
})
