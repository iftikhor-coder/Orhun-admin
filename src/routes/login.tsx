import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocalAuth } from '@/lib/local-auth';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const localAuth = useLocalAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const last = await window.electronAPI?.secure.getLastEmail();
      if (last) setEmail(last);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[Login] 1. signIn boshlandi');
      const result = await signIn(email.trim(), password);
      console.log('[Login] 2. signIn natija:', result);

      if (!result.ok) {
        setError(result.error || 'Kirish amalga oshmadi');
        setLoading(false);
        return;
      }

      console.log('[Login] 3. electronAPI mavjudligini tekshiraman');
      if (!window.electronAPI?.secure) {
        console.error('[Login] electronAPI YOQ!');
        setError('electronAPI mavjud emas. Dasturni qayta ishga tushiring.');
        setLoading(false);
        return;
      }

      console.log('[Login] 4. isSetupCompleted soraymen');
      const setupCompleted = await window.electronAPI.secure.isSetupCompleted();
      console.log('[Login] 5. setupCompleted:', setupCompleted);

      if (setupCompleted) {
        console.log('[Login] 6a. PIN bor, /dashboard ga');
        localAuth.setStage('authenticated');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('[Login] 6b. PIN yoq, /pin-setup ga');
        navigate('/pin-setup', { replace: true });
      }
    } catch (err: any) {
      console.error('[Login] CATCH xato:', err);
      setError(err?.message || 'Kutilmagan xato yuz berdi');
    } finally {
      setLoading(false);
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

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl border border-admin-900/30 bg-midnight-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-gradient-admin shadow-lg shadow-admin-900/40">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gold-100">
            Orhun AI Admin
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-admin-400">
            Restricted Access
          </p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-gold-700">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={loading}
            placeholder="admin@example.com"
            className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/60 px-3 py-2.5 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none disabled:opacity-50"
          />
        </label>

        <label className="mb-2 block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-gold-700">
            Parol
          </span>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/60 px-3 py-2.5 pr-10 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-gold-700 transition-colors hover:bg-midnight-700/50 hover:text-gold-300"
              aria-label="Toggle password"
            >
              {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </label>

        {error && (
          <div className="mb-4 mt-3 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
            'bg-gradient-admin text-white shadow-lg shadow-admin-900/40',
            'hover:shadow-xl hover:shadow-admin-900/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Tekshirilmoqda...
            </>
          ) : (
            'Kirish'
          )}
        </button>

        <p className="mt-6 text-center text-[11px] text-gold-700/60">
          Faqat administrator huquqi bor foydalanuvchilar kirishi mumkin.
          Birinchi marta kirgandan keyin 4 raqamli PIN o'rnatasiz.
        </p>
      </form>
    </div>
  );
}
