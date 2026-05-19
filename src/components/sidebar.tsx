import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Music,
  Globe,
  Bell,
  CreditCard,
  Tags,
  BarChart3,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Foydalanuvchilar', icon: Users },
  { to: '/songs', label: 'Qoʻshiqlar', icon: Music },
  { to: '/countries', label: 'Davlatlar', icon: Globe },
  { to: '/notifications', label: 'Bildirishnomalar', icon: Bell },
  { to: '/subscriptions', label: 'Obunalar', icon: CreditCard },
  { to: '/genres', label: 'Janrlar', icon: Tags },
  { to: '/analytics', label: 'Analitika', icon: BarChart3 },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-admin-900/30 bg-midnight-950">
      {/* Brand + ADMIN badge */}
      <div className="flex items-center gap-3 border-b border-admin-900/30 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-admin shadow-lg shadow-admin-900/40">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-base font-bold text-gold-200">
            Orhun AI
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-admin-400">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Navigatsiya */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                      : 'text-gold-200/70 hover:bg-midnight-800/60 hover:text-gold-100',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-admin-900/30 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-admin-500/40 bg-admin-900/30">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-admin-300">
                {(profile?.full_name || profile?.email || 'A')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-gold-100">
              {profile?.full_name || profile?.email || 'Admin'}
            </div>
            <div className="truncate text-[10px] text-admin-400">
              ADMINISTRATOR
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-300/80 transition-colors hover:bg-red-950/30 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
