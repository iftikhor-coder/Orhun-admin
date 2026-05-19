/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PYTHON_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// === Electron preload bridge ===
interface SecureStorageAPI {
  isSetupCompleted: () => Promise<boolean>;
  getLastEmail: () => Promise<string | null>;
  setupPin: (pin: string, email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyPin: (pin: string) => Promise<{
    ok: boolean;
    error?: string;
    attemptsLeft?: number;
    lockedUntil?: number;
  }>;
  getLockStatus: () => Promise<{
    locked: boolean;
    lockedUntil: number | null;
    attemptsLeft: number;
  }>;
  saveSession: (sessionJson: string) => Promise<{ ok: boolean; error?: string }>;
  loadSession: () => Promise<string | null>;
  clearSession: () => Promise<void>;
  resetAll: () => Promise<void>;
}

interface ElectronAPI {
  getVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  secure: SecureStorageAPI;
}

interface Window {
  electronAPI?: ElectronAPI;
}
