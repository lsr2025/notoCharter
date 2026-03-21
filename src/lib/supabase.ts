import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Demo mode: runs with full mock data when Supabase is not yet configured
export const DEMO_MODE = !supabaseUrl || !supabaseAnon

export const supabase = DEMO_MODE
  ? createClient('https://demo.supabase.co', 'demo-key')  // placeholder, never called
  : createClient(supabaseUrl!, supabaseAnon!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
