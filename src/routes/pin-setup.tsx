import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocalAuth } from '@/lib/local-auth';
import { cn } from '@/lib/utils';

/**
 * PinSetupPage
 * ============
 * Login muvaffaqiyatli bo'lgandan keyin, foydalanuvchi 4 raqamli PIN
 * o'rnatadi. Bu PIN DPAPI orqali shifrlangan holda saqlanadi.
 * Keyingi kirishlarda faqat shu PIN so'raladi (Supabase parolini emas).
 */
export function PinSetupPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { setupPin, error, clearError } = useLocalAuth();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const handleSubmit = async () => {
    if (step === 'create') {
      if (pin1.length !== 4) return;
      setStep('confirm');
      return;
    }

    if (pin2.length !== 4) return;

    if (pin1 !== pin2) {
      setMismatch(true);
      setPin2('');
      return;
    }

    setSubmitting(true);
    const email = profile?.email || '';
    const ok = await setupPin(pin1, email);
    setSubmitting(false);

    if (ok) {
      navigate('/dashboard', { replace: true });
    }
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
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-gradient-admin shadow-lg shadow-admin-900/40">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gold-100">
            {step === 'create' ? 'PIN yaratish' : 'PIN tasdiqlash'}
          </h1>
          <p className="mt-2 text-sm text-gold-700">
            {step === 'create'
              ? "4 raqamli PIN o'rnating — keyingi marta faqat shu so'raladi"
              : "Xavfsizlik uchun PIN'ni qaytadan kiriting"}
          </p>
        </div>

        <PinInput
          value={step === 'create' ? pin1 : pin2}
          onChange={(v) => {
            clearError();
            setMismatch(false);
            step === 'create' ? setPin1(v) : setPin2(v);
          }}
          disabled={submitting}
          autoFocus
        />

        {(error || mismatch) && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{mismatch ? "PIN'lar mos kelmadi. Qaytadan kiriting." : error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            (step === 'create' ? pin1.length !== 4 : pin2.length !== 4)
          }
          className={cn(
            'mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
            'bg-gradient-admin text-white shadow-lg shadow-admin-900/40',
            'hover:shadow-xl hover:shadow-admin-900/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : step === 'create' ? (
            'Davom etish'
          ) : (
            <>
              <Check className="h-4 w-4" />
              PIN o'rnatish
            </>
          )}
        </button>

        {step === 'confirm' && (
          <button
            type="button"
            onClick={() => {
              setStep('create');
              setPin2('');
              setMismatch(false);
            }}
            className="mt-3 w-full text-center text-xs text-gold-700 hover:text-gold-300"
          >
            ← Boshqa PIN tanlash
          </button>
        )}

        <div className="mt-6 rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2.5 text-[11px] text-gold-700/80">
          🔒 PIN ushbu kompyuterda DPAPI orqali shifrlanadi va boshqa
          kompyuterda ochilmaydi.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 *  PinInput — 4 ta katak (har birida 1 raqam)
 * ----------------------------------------------------------------- */

interface PinInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
}

export function PinInput({ value, onChange, disabled, autoFocus, error }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (idx: number, ch: string) => {
    if (disabled) return;
    const digit = ch.replace(/\D/g, '').slice(-1);
    const chars = value.split('');
    chars[idx] = digit;
    const next = chars.join('').slice(0, 4);
    onChange(next);
    if (digit && idx < 3) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 3) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={cn(
            'h-14 w-12 rounded-lg border-2 bg-midnight-800/60 text-center text-2xl font-bold text-gold-100',
            'focus:outline-none transition-colors',
            error
              ? 'border-admin-500 focus:border-admin-400'
              : 'border-gold-900/40 focus:border-admin-500/60',
            'disabled:opacity-50',
          )}
        />
      ))}
    </div>
  );
}
