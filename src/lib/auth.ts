/**
 * Supabase Auth Store — Zustand
 * ==============================
 * - Hozirgi user va admin profile state'ini saqlaydi
 * - is_admin tekshiruvi (profiles jadvalidan)
 * - DPAPI orqali session'ni saqlash/qayta tiklash
 *
 * Race condition tuzatishi:
 *   - onAuthStateChange listener endi refreshProfile chaqirmaydi
 *   - Profile faqat signIn() va restoreFromSecureStorage()'da yangilanadi
 *   - Bu Supabase realtime spam'ini oldini oladi
 */

import { create } from 'zustand';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AdminProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  email: string;
}

interface AuthState {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  restoreFromSecureStorage: () => Promise<boolean>;
}

async function saveSessionToSecureStorage(session: Session | null): Promise<void> {
  if (!window.electronAPI?.secure) return;
  if (!session) {
    await window.electronAPI.secure.clearSession();
    return;
  }
  const payload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  };
  await window.electronAPI.secure.saveSession(JSON.stringify(payload));
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    // Faqat initialized flag'ni qo'yamiz — session listener qo'shmaymiz
    // (listener race condition yaratayotgan edi).
    // Boshlang'ich session'ni faqat shu yerda o'qiymiz, listener'siz.
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        // refreshProfile NI BU YERDA CHAQIRMAYMIZ —
        // ProtectedRoute o'zi profile'ni tekshirib, kerak bo'lsa olib oladi.
      }
    } catch (e) {
      console.error('[auth] init xatosi:', e);
    } finally {
      set({ loading: false, initialized: true });
    }

    // Faqat SIGNED_OUT event'iga reaksiya qilamiz (logout uchun).
    // SIGNED_IN va TOKEN_REFRESHED'ni o'zimiz boshqaramiz.
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] event:', event);
      if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null });
        await saveSessionToSecureStorage(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token yangilandi — secure storage'da ham yangilash
        await saveSessionToSecureStorage(session);
      }
    });
  },

  restoreFromSecureStorage: async () => {
    if (!window.electronAPI?.secure) return false;
    try {
      const sessionJson = await window.electronAPI.secure.loadSession();
      if (!sessionJson) return false;

      const saved = JSON.parse(sessionJson);
      const { data, error } = await supabase.auth.setSession({
        access_token: saved.access_token,
        refresh_token: saved.refresh_token,
      });

      if (error || !data.session?.user) {
        await window.electronAPI.secure.clearSession();
        return false;
      }

      set({ user: data.session.user });
      await get().refreshProfile();

      if (!get().profile?.is_admin) {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
        return false;
      }

      return true;
    } catch (e) {
      console.error('[auth] restore xatosi:', e);
      return false;
    }
  },

  signIn: async (email, password) => {
    console.log('[auth] signIn boshlandi:', email);
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('[auth] signIn xato:', error);
        set({ loading: false, error: error?.message ?? 'Kirish amalga oshmadi' });
        return { ok: false, error: error?.message };
      }

      console.log('[auth] signIn muvaffaqiyatli, user:', data.user.email);
      set({ user: data.user });

      // Profile'ni olib kelamiz
      console.log('[auth] profile olinmoqda...');
      await get().refreshProfile();
      console.log('[auth] profile olindi:', get().profile);

      const prof = get().profile;
      if (!prof?.is_admin) {
        console.warn('[auth] is_admin = false, signOut qilinmoqda');
        await supabase.auth.signOut();
        set({
          user: null,
          profile: null,
          loading: false,
          error: 'Sizda admin huquqi yoʻq',
        });
        return { ok: false, error: 'Sizda admin huquqi yoʻq' };
      }

      // Session'ni shifrlab saqlash
      if (data.session) {
        console.log('[auth] session saqlanmoqda...');
        await saveSessionToSecureStorage(data.session);
      }

      console.log('[auth] signIn YAKUNLANDI muvaffaqiyatli');
      set({ loading: false });
      return { ok: true };
    } catch (e: any) {
      console.error('[auth] signIn CATCH xato:', e);
      set({ loading: false, error: e?.message ?? 'Kutilmagan xato' });
      return { ok: false, error: e?.message };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    if (window.electronAPI?.secure) {
      await window.electronAPI.secure.clearSession();
    }
    set({ user: null, profile: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) {
      console.warn('[auth] refreshProfile: user yoq');
      return;
    }
    console.log('[auth] refreshProfile: profiles so\'rovi yuborilmoqda');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[auth] refreshProfile xato:', error);
        set({ profile: null });
        return;
      }

      if (!data) {
        console.warn('[auth] refreshProfile: profile topilmadi');
        set({ profile: null });
        return;
      }

      console.log('[auth] refreshProfile: profile olindi, is_admin:', data.is_admin);
      set({
        profile: {
          id: data.id,
          username: data.username,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          is_admin: data.is_admin ?? false,
          email: user.email ?? '',
        },
      });
    } catch (e: any) {
      console.error('[auth] refreshProfile CATCH:', e);
      set({ profile: null });
    }
  },
}));
