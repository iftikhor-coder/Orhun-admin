import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocalAuth } from '@/lib/local-auth';

/**
 * ProtectedRoute — auth middleware
 * --------------------------------
 * Local auth stage'iga qarab navigatsiya qiladi:
 *   - 'loading'        → spinner
 *   - 'first-time'     → /login (Supabase email/parol)
 *   - 'pin-required'   → /pin-login (faqat PIN)
 *   - 'authenticated'  → user va profile ham bormi tekshirib, davom
 *
 * Bu komponent /dashboard, /users, va boshqa himoyalangan sahifalar
 * uchun wrapper sifatida ishlatiladi.
 */

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { user, profile, initialized } = useAuth();
  const { stage } = useLocalAuth();
  const location = useLocation();

  // Boshlang'ich yuklash
  if (!initialized || stage === 'loading') {
    return (
      <div className="grid h-screen w-screen place-items-center bg-midnight-950">
        <div className="flex items-center gap-3 text-gold-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  // Hech narsa o'rnatilmagan → email/parol kirish
  if (stage === 'first-time') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // PIN o'rnatilgan, lekin hali kiritilmagan
  if (stage === 'pin-required') {
    return <Navigate to="/pin-login" state={{ from: location }} replace />;
  }

  // PIN to'g'ri, lekin Supabase user/admin yo'q → restartdan keyin login
  if (!user || !profile?.is_admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
