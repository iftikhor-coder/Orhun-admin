import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client
 * ---------------
 * .env faylidan keladi:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *
 * Frontend bilan bir xil DB ga ulanadi. RLS policy'lar
 * is_admin = true bo'lganlarga admin amallarini ruxsat beradi.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    '[supabase] VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY ',
    '.env faylida topilmadi. .env.example ga qarang.',
  );
}

export const supabase = createClient(url || '', anonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Electron'da URL hash auth yo'q
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Helper: hozirgi auth user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}
