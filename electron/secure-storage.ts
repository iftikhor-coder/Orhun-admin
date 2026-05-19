/**
 * Secure Storage — Main Process
 * ===============================
 * Funksiyalar:
 *   1. DPAPI (Electron safeStorage) orqali maxfiy ma'lumotlarni
 *      shifrlash. Windows'da DPAPI ishlatiladi — fayllar boshqa
 *      kompyuterda ochilmaydi.
 *   2. PIN ni Node.js native `scrypt` bilan hash qilish (xavfsiz).
 *   3. 5 marta xato → 5 daqiqaga blokirovka.
 *   4. Supabase session token'larini shifrlangan holda saqlash.
 *
 * Saqlash joyi (Windows): C:\Users\<user>\AppData\Roaming\orhun-admin-panel\
 */

import { safeStorage, app } from 'electron';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import Store from 'electron-store';

// === Konstantalar ===
const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 daqiqa
const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;

// === Storage shema ===
interface StoreSchema {
  pinHashEncrypted: string | null; // base64
  saltEncrypted: string | null;     // base64
  sessionEncrypted: string | null;  // base64 (Supabase JSON)
  lockState: {
    attempts: number;
    lockedUntil: number | null;
  };
  setupCompleted: boolean;
  lastEmail: string | null; // qaytadan login uchun ko'rsatamiz
}

const store = new Store<StoreSchema>({
  name: 'orhun-admin-secure',
  defaults: {
    pinHashEncrypted: null,
    saltEncrypted: null,
    sessionEncrypted: null,
    lockState: { attempts: 0, lockedUntil: null },
    setupCompleted: false,
    lastEmail: null,
  },
  clearInvalidConfig: true,
});

// === Helperlar ===

function ensureSafeStorageReady(): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'safeStorage (DPAPI) mavjud emas. Bu Windows tizim xatosi — ' +
      'Electron qayta o\'rnatilishi kerak.',
    );
  }
}

function encryptToBase64(plain: string): string {
  ensureSafeStorageReady();
  return safeStorage.encryptString(plain).toString('base64');
}

function decryptFromBase64(b64: string): string {
  ensureSafeStorageReady();
  const buf = Buffer.from(b64, 'base64');
  return safeStorage.decryptString(buf);
}

function hashPin(pin: string, salt: Buffer): Buffer {
  // scrypt — sekin va xavfsiz (brute-force ga qarshi)
  return scryptSync(pin, salt, SCRYPT_KEYLEN);
}

// === Public API ===

export const secureStorage = {
  /**
   * Setup yakunlanganmi (PIN o'rnatilganmi)?
   */
  isSetupCompleted(): boolean {
    return store.get('setupCompleted') === true;
  },

  /**
   * Eski email (login formada placeholder uchun).
   */
  getLastEmail(): string | null {
    return store.get('lastEmail');
  },

  /**
   * PIN o'rnatish (faqat birinchi marta yoki reset'dan keyin).
   * Bu chaqirilgandan keyin setupCompleted = true bo'ladi.
   */
  setupPin(pin: string, email: string): { ok: boolean; error?: string } {
    if (!/^\d{4}$/.test(pin)) {
      return { ok: false, error: `PIN ${PIN_LENGTH} ta raqamdan iborat bo'lishi kerak` };
    }

    try {
      const salt = randomBytes(SCRYPT_SALT_BYTES);
      const hash = hashPin(pin, salt);

      store.set('pinHashEncrypted', encryptToBase64(hash.toString('base64')));
      store.set('saltEncrypted', encryptToBase64(salt.toString('base64')));
      store.set('lastEmail', email);
      store.set('setupCompleted', true);
      store.set('lockState', { attempts: 0, lockedUntil: null });

      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'PIN saqlanmadi' };
    }
  },

  /**
   * PIN'ni tekshirish. Xato bo'lsa attempts oshadi.
   * 5 xato → lock bo'ladi.
   */
  verifyPin(pin: string): {
    ok: boolean;
    error?: string;
    attemptsLeft?: number;
    lockedUntil?: number;
  } {
    // Avval lock holatini tekshiramiz
    const lockCheck = this.getLockStatus();
    if (lockCheck.locked) {
      return {
        ok: false,
        error: 'Blokirovka qilingan',
        lockedUntil: lockCheck.lockedUntil,
      };
    }

    if (!/^\d{4}$/.test(pin)) {
      return { ok: false, error: 'PIN noto\'g\'ri formatda' };
    }

    try {
      const pinHashB64 = store.get('pinHashEncrypted');
      const saltB64 = store.get('saltEncrypted');
      if (!pinHashB64 || !saltB64) {
        return { ok: false, error: 'PIN o\'rnatilmagan' };
      }

      const storedHash = Buffer.from(decryptFromBase64(pinHashB64), 'base64');
      const salt = Buffer.from(decryptFromBase64(saltB64), 'base64');
      const candidateHash = hashPin(pin, salt);

      // timingSafeEqual — timing attack'ga qarshi
      const match =
        storedHash.length === candidateHash.length &&
        timingSafeEqual(storedHash, candidateHash);

      if (match) {
        // Muvaffaqiyat — lock'ni reset qilamiz
        store.set('lockState', { attempts: 0, lockedUntil: null });
        return { ok: true };
      }

      // Xato — attempts oshadi
      const lock = store.get('lockState');
      const newAttempts = lock.attempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCK_DURATION_MS;
        store.set('lockState', { attempts: newAttempts, lockedUntil });
        return {
          ok: false,
          error: `${MAX_ATTEMPTS} marta xato. 5 daqiqaga blokirovka.`,
          lockedUntil,
          attemptsLeft: 0,
        };
      }

      store.set('lockState', { attempts: newAttempts, lockedUntil: null });
      return {
        ok: false,
        error: `Noto'g'ri PIN. ${MAX_ATTEMPTS - newAttempts} ta urinish qoldi.`,
        attemptsLeft: MAX_ATTEMPTS - newAttempts,
      };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'PIN tekshirilmadi' };
    }
  },

  /**
   * Lock holatini qaytaradi (lockedUntil o'tib ketgan bo'lsa, reset qiladi).
   */
  getLockStatus(): { locked: boolean; lockedUntil: number | null; attemptsLeft: number } {
    const lock = store.get('lockState');
    const now = Date.now();

    if (lock.lockedUntil && lock.lockedUntil > now) {
      return {
        locked: true,
        lockedUntil: lock.lockedUntil,
        attemptsLeft: 0,
      };
    }

    // Lock muddati tugagan — reset
    if (lock.lockedUntil && lock.lockedUntil <= now) {
      store.set('lockState', { attempts: 0, lockedUntil: null });
      return { locked: false, lockedUntil: null, attemptsLeft: MAX_ATTEMPTS };
    }

    return {
      locked: false,
      lockedUntil: null,
      attemptsLeft: MAX_ATTEMPTS - lock.attempts,
    };
  },

  /**
   * Supabase session'ni shifrlangan holda saqlash.
   * `session` — Supabase'dan kelgan JSON object (access_token, refresh_token, ...).
   */
  saveSession(sessionJson: string): { ok: boolean; error?: string } {
    try {
      store.set('sessionEncrypted', encryptToBase64(sessionJson));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Session saqlanmadi' };
    }
  },

  /**
   * Saqlangan session'ni qaytaradi (yoki null).
   */
  loadSession(): string | null {
    try {
      const enc = store.get('sessionEncrypted');
      if (!enc) return null;
      return decryptFromBase64(enc);
    } catch {
      return null;
    }
  },

  /**
   * Hammasini o'chirish — qayta setup uchun.
   * Sign out yoki PIN'ni unutgan holatda ishlatiladi.
   */
  resetAll(): void {
    store.clear();
  },

  /**
   * Faqat session'ni o'chirish (PIN saqlanadi).
   * Logout uchun.
   */
  clearSession(): void {
    store.set('sessionEncrypted', null);
  },
};
