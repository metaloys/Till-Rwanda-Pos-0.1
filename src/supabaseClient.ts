import { createClient } from '@supabase/supabase-js'

// !! IMPORTANT !!
// Replace 'YOUR_SUPABASE_URL' with your Project URL
// Replace 'YOUR_SUPABASE_ANON_KEY' with your "public" (anon) key

const supabaseUrl = 'https://flazpjyvrydattzlhtnj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYXpwanl2cnlkYXR0emxodG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDY5ODUsImV4cCI6MjA3NjYyMjk4NX0.awgMOwPBQHpKYbIF8FwIcG_CEfp88-0R4UkdFgznBFk'

export const supabase = createClient(supabaseUrl, supabaseKey)