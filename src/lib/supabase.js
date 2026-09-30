import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseUrl = 'https://aakttvtzjwdtkvgttqga.supabase.co'
const supabaseAnonKey = 'sb_publishable_bVGv3uvNXW3z1T5q8FGXKA_ycHgAvHs'


export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase