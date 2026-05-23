import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Lock, Loader2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocalAuth } from '@/lib/local-auth';
import { cn } from '@/lib/utils';

const PIN_LENGTH = 8;

/**
 * PinLoginPage — 8 belgili alfanumerik PIN bilan kirish
 * 5 marta xato → 5 daqiqaga blokirovka
 */
export function PinLoginPage() {
  const navigate = useNavigate();
  const { restoreFromSecureStorage } = useAuth();
  const { verifyPin, lockedUntil, attemptsLeft, error, clearError, resetAll, refreshLockStatus } = useLocalAuth();

  const [pin,       setPin]       = useState('');
  const [show,      setShow]      = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [now,       setNow]       = useState(Date.now());
  const [lastEmail, setLastEmail] = useState<string | null>(null);

  // Lock countdown
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      if (lockedUntil && Date.now() >= lockedUntil) refreshLockStatus();
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil, refreshLockStatus]);

  // Oldingi email
  useEffect(() => {
    (async () => {
      const email = await window.electronAPI?.secure?.getLastEmail?.();
      setLastEmail(email ?? null);
    })();
  }, []);

  const isLocked      = !!(lockedUntil && lockedUntil > now);
  const remainingMs   = isLocked ? lockedUntil! - now : 0;
  const remainingMin  = Math.floor(remainingMs / 60_000);
  const remainingSec  = Math.floor((remainingMs % 60_000) / 1000);

  const handlePinChange = (v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_LENGTH);
    setPin(clean);
    clearError();
  };

  const handleSubmit = async () => {
    if (pin.length < PIN_LENGTH || isLocked || submitting) return;
    setSubmitting(true);
    const ok = await verifyPin(pin);
    if (!ok) {
      setSubmitting(false);
      setPin('');
      return;
    }
    const restored = await restoreFromSecureStorage();
    setSubmitting(false);
    if (restored) {
      navigate('/dashboard', { replace: true });
    } else {
      await resetAll();
      navigate('/login', { replace: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleReset = async () => {
    if (!confirm("Boshqa hisob bilan kirmoqchimisiz? Saqlangan ma'lumotlar o'chiriladi.")) return;
    await resetAll();
    navigate('/login', { replace: true });
  };

  return (
    <div className="grid h-screen w-screen place-items-center bg-midnight-950 p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(220,38,38,0.15) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-admin-900/30 bg-midnight-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">

        {/* Sarlavha */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className={cn(
            'mb-4 grid h-14 w-14 place-items-center rounded-xl shadow-lg',
            isLocked ? 'bg-admin-700 shadow-admin-900/40' : 'bg-gradient-admin shadow-admin-900/40',
          )}>
            {isLocked
              ? <Lock className="h-7 w-7 text-white" />
              : <Shield className="h-7 w-7 text-white" />}
          </div>
          <h1 className="font-display text-2xl font-bold text-gold-100">
            {isLocked ? 'Blokirovka qilingan' : 'PIN kiriting'}
          </h1>
          {lastEmail && (
            <p className="mt-1 text-xs text-gold-400">{lastEmail}</p>
          )}
          {!isLocked && (
            <p className="mt-2 text-sm text-gold-700">
              {PIN_LENGTH} belgili PIN (harflar + raqamlar)
            </p>
          )}
        </div>

        {isLocked ? (
          /* Blokirovka holati */
          <div className="text-center">
            <div className="font-mono text-5xl font-bold tracking-widest text-admin-300">
              {String(remainingMin).padStart(2, '0')}:{String(remainingSec).padStart(2, '0')}
            </div>
            <p className="mt-3 text-sm text-gold-700">
              Blokirovka tugashini kuting
            </p>
          </div>
        ) : (
          /* PIN kiritish */
          <div>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={pin}
                onChange={e => handlePinChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="PIN kodingizni kiriting"
                autoFocus
                maxLength={PIN_LENGTH}
                disabled={submitting}
                className={cn(
                  'w-full rounded-lg border bg-midnight-800/60 px-4 py-3 pr-10',
                  'font-mono text-base text-gold-100 text-center tracking-widest',
                  'focus:outline-none transition-colors placeholder:text-gold-700/30 placeholder:tracking-normal',
                  error
                    ? 'border-admin-500/60 focus:border-admin-400'
                    : 'border-gold-900/40 focus:border-gold-500/60',
                  'disabled:opacity-50',
                )}
              />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-700 hover:text-gold-300">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Progress dots */}
            <div className="mt-3 flex justify-center gap-2">
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <div key={i} className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i < pin.length ? 'bg-admin-400' : 'bg-gold-900/40',
                )} />
              ))}
            </div>

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
              <p className="mt-3 text-center text-xs text-amber-400">
                {attemptsLeft} ta urinish qoldi
              </p>
            )}

            <button type="button" onClick={handleSubmit}
              disabled={submitting || pin.length < PIN_LENGTH}
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-gradient-admin px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirish'}
            </button>
          </div>
        )}

        <button type="button" onClick={handleReset}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gold-900/40 px-4 py-2 text-sm text-gold-300/70 hover:bg-midnight-800/40 hover:text-gold-200 transition-colors">
          <RotateCcw className="h-3.5 w-3.5" />
          Boshqa hisob bilan kirish
        </button>

        <div className="mt-4 rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2.5 text-[11px] text-gold-700/80">
          🔒 5 marta noto'g'ri PIN → 5 daqiqaga blokirovka
        </div>
      </div>
    </div>
  );
}
