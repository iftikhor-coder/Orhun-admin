import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocalAuth } from '@/lib/local-auth';
import { cn } from '@/lib/utils';

const PIN_LENGTH = 8;
const PIN_PATTERN = /^[a-zA-Z0-9]+$/;

/**
 * PinSetupPage — 8 belgili alfanumerik PIN o'rnatish
 * Harflar (katta/kichik) va raqamlar qabul qilinadi.
 * DPAPI orqali shifrlangan holda saqlanadi.
 */
export function PinSetupPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { setupPin, error, clearError } = useLocalAuth();

  const [step,       setStep]       = useState<'create' | 'confirm'>('create');
  const [pin1,       setPin1]       = useState('');
  const [pin2,       setPin2]       = useState('');
  const [show1,      setShow1]      = useState(false);
  const [show2,      setShow2]      = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mismatch,   setMismatch]   = useState(false);
  const [valError,   setValError]   = useState('');

  const validate = (val: string): string => {
    if (val.length < PIN_LENGTH) return `PIN kamida ${PIN_LENGTH} belgi bolishi kerak`;
    if (!PIN_PATTERN.test(val)) return "Faqat harflar (a-z, A-Z) va raqamlar (0-9) ishlatiladi";
    const hasLetter = /[a-zA-Z]/.test(val);
    const hasDigit  = /[0-9]/.test(val);
    if (!hasLetter || !hasDigit) return "PIN kamida 1 ta harf va 1 ta raqam bolishi kerak";
    return '';
  };

  const handlePin1Change = (v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_LENGTH);
    setPin1(clean);
    setValError('');
    clearError();
  };

  const handlePin2Change = (v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9]/g, '').slice(0, PIN_LENGTH);
    setPin2(clean);
    setMismatch(false);
    clearError();
  };

  const handleNext = () => {
    const err = validate(pin1);
    if (err) { setValError(err); return; }
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (pin1 !== pin2) {
      setMismatch(true);
      setPin2('');
      return;
    }
    setSubmitting(true);
    const email = profile?.email ?? '';
    const ok = await setupPin(pin1, email);
    setSubmitting(false);
    if (ok) {
      navigate('/dashboard', { replace: true });
    }
  };

  const strength = (() => {
    const p = step === 'create' ? pin1 : pin2;
    if (p.length === 0) return 0;
    let s = 0;
    if (p.length >= 4) s++;
    if (p.length >= PIN_LENGTH) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Juda zaif', 'Zaif', "O'rta", 'Yaxshi', 'Kuchli'][Math.min(strength, 5)];
  const strengthColor = ['', 'bg-admin-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-300'][Math.min(strength, 5)];

  return (
    <div className="grid h-screen w-screen place-items-center bg-midnight-950 p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(220,38,38,0.15) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-admin-900/30 bg-midnight-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">

        {/* Sarlavha */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-gradient-admin shadow-lg shadow-admin-900/40">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gold-100">
            {step === 'create' ? 'PIN yaratish' : 'PIN tasdiqlash'}
          </h1>
          <p className="mt-2 text-sm text-gold-700">
            {step === 'create'
              ? `${PIN_LENGTH} belgili PIN o'rnating — harflar va raqamlar`
              : "Xavfsizlik uchun PIN'ni qaytadan kiriting"}
          </p>
        </div>

        {/* Qadam indikatori */}
        <div className="mb-5 flex items-center gap-2">
          <div className={cn('h-1.5 flex-1 rounded-full', step === 'create' ? 'bg-admin-500' : 'bg-gold-900/40')} />
          <div className={cn('h-1.5 flex-1 rounded-full', step === 'confirm' ? 'bg-admin-500' : 'bg-gold-900/40')} />
        </div>

        {/* PIN kiritish */}
        {step === 'create' ? (
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gold-700">
              Yangi PIN
            </label>
            <div className="relative">
              <input
                type={show1 ? 'text' : 'password'}
                value={pin1}
                onChange={e => handlePin1Change(e.target.value)}
                placeholder="Masalan: Admin2024"
                autoFocus
                maxLength={PIN_LENGTH}
                className={cn(
                  'w-full rounded-lg border bg-midnight-800/60 px-4 py-3 pr-10 font-mono text-base text-gold-100',
                  'focus:outline-none transition-colors placeholder:text-gold-700/30',
                  valError
                    ? 'border-admin-500/60 focus:border-admin-400'
                    : 'border-gold-900/40 focus:border-gold-500/60',
                )}
              />
              <button type="button" onClick={() => setShow1(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-700 hover:text-gold-300">
                {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Kuch ko'rsatkichi */}
            {pin1.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={cn(
                      'h-1.5 flex-1 rounded-full transition-all',
                      strength >= i ? strengthColor : 'bg-gold-900/30',
                    )} />
                  ))}
                </div>
                <div className="mt-1 text-right text-[10px] text-gold-700">{strengthLabel}</div>
              </div>
            )}

            {/* Talablar */}
            <div className="mt-3 space-y-1">
              {[
                { ok: pin1.length >= PIN_LENGTH,  text: `Kamida ${PIN_LENGTH} belgi` },
                { ok: /[a-zA-Z]/.test(pin1),       text: 'Kamida 1 ta harf' },
                { ok: /[0-9]/.test(pin1),          text: 'Kamida 1 ta raqam' },
              ].map(r => (
                <div key={r.text} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    'grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                    r.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gold-900/30 text-gold-700',
                  )}>
                    {r.ok ? '✓' : '○'}
                  </div>
                  <span className={r.ok ? 'text-emerald-300' : 'text-gold-700'}>{r.text}</span>
                </div>
              ))}
            </div>

            {valError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{valError}</span>
              </div>
            )}

            <button type="button" onClick={handleNext}
              disabled={pin1.length < PIN_LENGTH}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-admin px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
              Davom etish
            </button>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gold-700">
              PIN'ni tasdiqlang
            </label>
            <div className="relative">
              <input
                type={show2 ? 'text' : 'password'}
                value={pin2}
                onChange={e => handlePin2Change(e.target.value)}
                placeholder="Qaytadan kiriting"
                autoFocus
                maxLength={PIN_LENGTH}
                className={cn(
                  'w-full rounded-lg border bg-midnight-800/60 px-4 py-3 pr-10 font-mono text-base text-gold-100',
                  'focus:outline-none transition-colors placeholder:text-gold-700/30',
                  mismatch
                    ? 'border-admin-500/60 focus:border-admin-400'
                    : 'border-gold-900/40 focus:border-gold-500/60',
                )}
              />
              <button type="button" onClick={() => setShow2(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-700 hover:text-gold-300">
                {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {(error || mismatch) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{mismatch ? "PIN'lar mos kelmadi. Qaytadan kiriting." : error}</span>
              </div>
            )}

            <button type="button" onClick={handleSubmit}
              disabled={submitting || pin2.length < PIN_LENGTH}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-admin px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda...</>
                : <><Check className="h-4 w-4" />PIN o'rnatish</>}
            </button>

            <button type="button" onClick={() => { setStep('create'); setPin2(''); setMismatch(false); }}
              className="mt-3 w-full text-center text-xs text-gold-700 hover:text-gold-300">
              ← Boshqa PIN tanlash
            </button>
          </div>
        )}

        <div className="mt-5 rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2.5 text-[11px] text-gold-700/80">
          🔒 PIN ushbu kompyuterda DPAPI orqali shifrlanadi. Keyingi kirish uchun shu PIN kerak.
        </div>
      </div>
    </div>
  );
}
