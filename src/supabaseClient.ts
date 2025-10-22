import { createClient } from '@supabase/supabase-js'



// These MUST be your PUBLIC keys, not the secret ones.

const supabaseUrl = 'https://flazpjyvrydattzlhtnj.supabase.co' // Your Project URL

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYXpwanl2cnlkYXR0emxodG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDY5ODUsImV4cCI6MjA3NjYyMjk4NX0.awgMOwPBQHpKYbIF8FwIcG_CEfp88-0R4UkdFgznBFk' // PASTE THE 'anon' (public) KEY HERE



export const supabase = createClient(supabaseUrl, supabaseKey)