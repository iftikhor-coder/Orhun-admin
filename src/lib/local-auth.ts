/**
 * Local Auth Store — PIN + Lock
 * ==============================
 * Renderer process'da PIN tekshiruvini boshqaradi.
 * secureStorage IPC orqali main process bilan ishlaydi.
 */

import { create } from 'zustand';

type AuthStage =
  | 'loading'        // boshlang'ich tekshiruv
  | 'first-time'     // hech narsa o'rnatilmagan → email/parol so'raymiz
  | 'pin-required'   // PIN o'rnatilgan → PIN so'raymiz
  | 'authenticated'; // hammasi joyida → Dashboard

interface LocalAuthState {
  stage: AuthStage;
  lockedUntil: number | null;
  attemptsLeft: number;
  error: string | null;

  // actions
  init: () => Promise<void>;
  setStage: (stage: AuthStage) => void;
  verifyPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string, email: string) => Promise<boolean>;
  refreshLockStatus: () => Promise<void>;
  clearError: () => void;
  resetAll: () => Promise<void>;
}

function ensureElectron() {
  if (!window.electronAPI?.secure) {
    throw new Error(
      'electronAPI mavjud emas. Bu dastur Electron oynasida ishlashi kerak.',
    );
  }
  return window.electronAPI.secure;
}

export const useLocalAuth = create<LocalAuthState>((set, get) => ({
  stage: 'loading',
  lockedUntil: null,
  attemptsLeft: 5,
  error: null,

  init: async () => {
    try {
      const api = ensureElectron();
      const setupCompleted = await api.isSetupCompleted();
      if (setupCompleted) {
        // PIN bor → lock holatini tekshiramiz
        const lock = await api.getLockStatus();
        set({
          stage: 'pin-required',
          lockedUntil: lock.lockedUntil,
          attemptsLeft: lock.attemptsLeft,
        });
      } else {
        // Hech narsa yo'q → birinchi marta
        set({ stage: 'first-time' });
      }
    } catch (e: any) {
      set({ stage: 'first-time', error: e?.message });
    }
  },

  setStage: (stage) => set({ stage }),

  verifyPin: async (pin) => {
    try {
      const api = ensureElectron();
      const result = await api.verifyPin(pin);
      if (result.ok) {
        set({
          stage: 'authenticated',
          attemptsLeft: 5,
          lockedUntil: null,
          error: null,
        });
        return true;
      }
      set({
        attemptsLeft: result.attemptsLeft ?? get().attemptsLeft,
        lockedUntil: result.lockedUntil ?? null,
        error: result.error ?? 'Noto\'g\'ri PIN',
      });
      return false;
    } catch (e: any) {
      set({ error: e?.message ?? 'PIN tekshirilmadi' });
      return false;
    }
  },

  setupPin: async (pin, email) => {
    try {
      const api = ensureElectron();
      const result = await api.setupPin(pin, email);
      if (result.ok) {
        set({ stage: 'authenticated', error: null });
        return true;
      }
      set({ error: result.error ?? 'PIN saqlanmadi' });
      return false;
    } catch (e: any) {
      set({ error: e?.message ?? 'PIN saqlanmadi' });
      return false;
    }
  },

  refreshLockStatus: async () => {
    try {
      const api = ensureElectron();
      const lock = await api.getLockStatus();
      set({
        lockedUntil: lock.lockedUntil,
        attemptsLeft: lock.attemptsLeft,
      });
    } catch {
      // ignore
    }
  },

  clearError: () => set({ error: null }),

  resetAll: async () => {
    try {
      const api = ensureElectron();
      await api.resetAll();
      set({
        stage: 'first-time',
        lockedUntil: null,
        attemptsLeft: 5,
        error: null,
      });
    } catch (e: any) {
      set({ error: e?.message });
    }
  },
}));
