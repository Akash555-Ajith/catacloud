import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Sanitization: Strip /rest/v1 or trailing slashes if pasted by accident
if (supabaseUrl.includes('/rest/v1')) {
  supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}
if (supabaseUrl.endsWith('/')) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

const isDummy = (val: string): boolean => {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('your-') ||
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.includes('example') ||
    lower.includes('supabase-key') ||
    lower.includes('anon-key') ||
    val.trim() === ''
  );
};

const isValidUrl = (val: string): boolean => {
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
};

export let isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !isDummy(supabaseUrl) && 
  !isDummy(supabaseAnonKey) && 
  isValidUrl(supabaseUrl);

export function disableSupabase() {
  if (isSupabaseConfigured) {
    console.warn('Supabase integration has been disabled for the current session. Falling back to LocalStorage.');
    isSupabaseConfigured = false;
  }
}

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    'Supabase environment variables are missing, invalid, or contain dummy placeholder strings. Falling back to client-side LocalStorage.'
  );
}

export const cleanedSupabaseUrl = supabaseUrl;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

export const supabaseAnon = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : (null as any);

