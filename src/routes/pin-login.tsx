import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Lock, Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocalAuth } from '@/lib/local-auth';
import { PinInput } from './pin-setup';
import { cn } from '@/lib/utils';

/**
 * PinLoginPage
 * ============
 * Keyingi safar dasturni ochganda — faqat PIN so'raydi.
 * To'g'ri PIN kiritilsa, DPAPI'dan Supabase session'ni qayta tiklaydi.
 *
 * 5 marta xato → 5 daqiqaga blokirovka.
 * Foydalanuvchi "Boshqa hisob bilan kirish" tugmasi orqali setup'ni
 * resetlab, qaytadan email/parol bilan kirishi mumkin.
 */
export function PinLoginPage() {
  const navigate = useNavigate();
  const { restoreFromSecureStorage } = useAuth();
  const { verifyPin, lockedUntil, attemptsLeft, error, clearError, resetAll, refreshLockStatus } = useLocalAuth();

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [lastEmail, setLastEmail] = useState<string | null>(null);

  // Lock countdown uchun timer
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      if (lockedUntil && Date.now() >= lockedUntil) {
        refreshLockStatus();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil, refreshLockStatus]);

  // Eski email'ni olish (UX uchun ko'rsatamiz)
  useEffect(() => {
    (async () => {
      const email = await window.electronAPI?.secure.getLastEmail();
      setLastEmail(email ?? null);
    })();
  }, []);

  const isLocked = !!(lockedUntil && lockedUntil > now);
  const remainingMs = isLocked ? lockedUntil! - now : 0;
  const remainingMin = Math.floor(remainingMs / 60_000);
  const remainingSec = Math.floor((remainingMs % 60_000) / 1000);

  const handleSubmit = async (currentPin: string) => {
    if (currentPin.length !== 4 || isLocked) return;

    setSubmitting(true);
    const ok = await verifyPin(currentPin);
    if (!ok) {
      setSubmitting(false);
      setPin('');
      return;
    }

    // PIN to'g'ri — Supabase session'ni qayta tiklash
    const restored = await restoreFromSecureStorage();
    setSubmitting(false);

    if (restored) {
      navigate('/dashboard', { replace: true });
    } else {
      // Session muddati tugagan — qaytadan email/parol bilan kirish kerak
      await resetAll();
      navigate('/login', { replace: true });
    }
  };

  // PIN to'liq kiritilsa avtomatik submit
  useEffect(() => {
    if (pin.length === 4 && !submitting && !isLocked) {
      handleSubmit(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleReset = async () => {
    if (!confirm("Boshqa hisob bilan kirmoqchimisiz? Saqlangan ma'lumotlar o'chiriladi.")) {
      return;
    }
    await resetAll();
    navigate('/login', { replace: true });
  };

  return (
    <div className="grid h-screen w-screen place-items-center bg-midnight-950 p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-admin-900/30 bg-midnight-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className={cn(
              'mb-4 grid h-14 w-14 place-items-center rounded-xl shadow-lg',
              isLocked
                ? 'bg-admin-700 shadow-admin-900/40'
                : 'bg-gradient-admin shadow-admin-900/40',
            )}
          >
            {isLocked ? (
              <Lock className="h-7 w-7 text-white" />
            ) : (
              <Shield className="h-7 w-7 text-white" />
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-gold-100">
            {isLocked ? 'Blokirovka qilingan' : 'PIN kiriting'}
          </h1>
          {lastEmail && (
            <p className="mt-2 text-xs text-gold-400">{lastEmail}</p>
          )}
          {!isLocked && (
            <p className="mt-2 text-sm text-gold-700">
              4 raqamli PIN'ingizni kiriting
            </p>
          )}
        </div>

        {isLocked ? (
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-admin-300">
              {String(remainingMin).padStart(2, '0')}:
              {String(remainingSec).padStart(2, '0')}
            </div>
            <p className="mt-3 text-sm text-gold-700">
              {Math.ceil(remainingMs / 60000)} daqiqadan keyin urinib ko'ring
            </p>
          </div>
        ) : (
          <>
            <PinInput
              value={pin}
              onChange={(v) => {
                clearError();
                setPin(v);
              }}
              disabled={submitting}
              autoFocus
              error={!!error}
            />

            {submitting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gold-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Tekshirilmoqda...
              </div>
            )}

            {error && !submitting && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!error && attemptsLeft < 5 && (
              <div className="mt-4 text-center text-xs text-amber-400">
                {attemptsLeft} ta urinish qoldi
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-gold-900/40 px-4 py-2 text-sm text-gold-300/70 transition-colors hover:bg-midnight-800/40 hover:text-gold-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Boshqa hisob bilan kirish
        </button>

        <div className="mt-6 rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2.5 text-[11px] text-gold-700/80">
          🔒 5 marta noto'g'ri PIN kiritilsa — 5 daqiqaga blokirovka.
        </div>
      </div>
    </div>
  );
}
