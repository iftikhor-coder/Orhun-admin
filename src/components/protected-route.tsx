import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

/**
 * ProtectedRoute — auth middleware
 * --------------------------------
 * 1) Auth tekshiruv yakunlanmasa — spinner
 * 2) User yoʻq yoki is_admin = false → /login ga redirect
 * 3) Aks holda children render
 */

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { user, profile, initialized } = useAuth();
  const location = useLocation();

  console.log("[PR]", { initialized, user: !!user, isAdmin: profile?.is_admin });

  if (!initialized) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-midnight-950">
        <div className="flex items-center gap-3 text-gold-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
