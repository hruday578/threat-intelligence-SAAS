import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bkdmjuzibthcqjagyfci.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZG1qdXppYnRoY3FqYWd5ZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMjg5NzQsImV4cCI6MjEwMjYwNDk3NH0.AfJFFoGvYGqi8ZPr5oyYmBnvV52XagbUJFeSZvb5bB8';

if (!supabaseAnonKey) {
  console.warn('⚠️ Supabase Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
