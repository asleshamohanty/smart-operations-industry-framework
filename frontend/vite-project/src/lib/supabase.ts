import { createClient } from '@supabase/supabase-js'

// TEMPORARY HARDCODED VALUES FOR TESTING
// Replace with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nubbrpaldzantyiejwly.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs'

// Only create client if we have valid URLs (not placeholder values)
let supabase: any

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co' && supabaseAnonKey !== 'your-anon-key') {
  console.log('✅ Supabase configuration looks good!')
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase not configured. Some features may not work properly.')
  console.warn('Please create a .env file in the frontend/vite-project directory with:')
  console.warn('VITE_SUPABASE_URL=your_actual_supabase_url')
  console.warn('VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key')
}

export { supabase }
