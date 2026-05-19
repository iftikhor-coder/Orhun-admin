/**
 * Python Backend API Helper
 * -------------------------
 * Oracle Ubuntu serverdagi alohida Python REST API'ga ulanish uchun.
 * Kelajakda quyidagi endpoint'lar uchun ishlatiladi:
 *   - GET  /api/ip-geo/:ip       → IP geolocation
 *   - GET  /api/users/duplicates → multi-account aniqlash
 *   - POST /api/notify/email     → email yuborish (Gmail)
 *
 * URL .env faylidan keladi: VITE_PYTHON_API_URL
 */

import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_PYTHON_API_URL || '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  if (!API_URL) throw new ApiError(0, 'API URL sozlanmagan');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) throw new ApiError(0, 'API URL sozlanmagan');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
