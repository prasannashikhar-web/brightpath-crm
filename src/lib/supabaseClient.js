import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[SupabaseClient] Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
    'Please configure them in your .env.local file.'
  );
}

// Client instance for application use
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Safely tests whether the Supabase API responds without querying, modifying,
 * or touching any database tables, policies, or records.
 * Never logs or exposes credentials.
 *
 * @returns {Promise<{ connected: boolean, message: string }>}
 */
export async function checkSupabaseConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      connected: false,
      message: 'Missing environment variables in .env.local'
    };
  }

  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey }
    });

    if (res.ok) {
      return {
        connected: true,
        message: 'Connected to Supabase API successfully'
      };
    }

    return {
      connected: false,
      message: `Supabase API returned HTTP status ${res.status}`
    };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Unable to connect to Supabase API'
    };
  }
}
