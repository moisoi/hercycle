import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aakttvtzjwdtkvgttqga.supabase.co'
const supabaseAnonKey = 'sb_publishable_bVGv3uvNXW3z1T5q8FGXKA_ycHgAvHs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase