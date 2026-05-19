/**
 * Preload Script — Context Bridge
 * --------------------------------
 * Renderer (React) uchun xavfsiz IPC API ochiladi.
 * `window.electronAPI` orqali React'dan chaqirish mumkin.
 *
 * secureStorage — DPAPI orqali shifrlangan PIN + session storage.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // App umumiy
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('app:open-external', url),

  // Secure storage (DPAPI)
  secure: {
    isSetupCompleted: (): Promise<boolean> =>
      ipcRenderer.invoke('secure:isSetupCompleted'),

    getLastEmail: (): Promise<string | null> =>
      ipcRenderer.invoke('secure:getLastEmail'),

    setupPin: (pin: string, email: string): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('secure:setupPin', pin, email),

    verifyPin: (pin: string): Promise<{
      ok: boolean;
      error?: string;
      attemptsLeft?: number;
      lockedUntil?: number;
    }> => ipcRenderer.invoke('secure:verifyPin', pin),

    getLockStatus: (): Promise<{
      locked: boolean;
      lockedUntil: number | null;
      attemptsLeft: number;
    }> => ipcRenderer.invoke('secure:getLockStatus'),

    saveSession: (sessionJson: string): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('secure:saveSession', sessionJson),

    loadSession: (): Promise<string | null> =>
      ipcRenderer.invoke('secure:loadSession'),

    clearSession: (): Promise<void> =>
      ipcRenderer.invoke('secure:clearSession'),

    resetAll: (): Promise<void> =>
      ipcRenderer.invoke('secure:resetAll'),
  },
});
