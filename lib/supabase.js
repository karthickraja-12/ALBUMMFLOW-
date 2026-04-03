import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Anon Key is missing. Please ensure .env.local is configured.");
}

// createBrowserClient automatically syncs the auth session into cookies (instead of localStorage)
// allowing Next.js Server middleware and API routes to read the login state.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
