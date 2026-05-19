import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Sidebar } from './sidebar';

/**
 * AdminLayout
 * -----------
 * Sidebar + asosiy content + tepada qizil "ADMIN ZONE" banner.
 * Hamma /admin/* sahifalar uchun wrapper sifatida ishlatiladi.
 */
export function AdminLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-midnight-950">
      <Sidebar />

      <main className="relative flex h-full flex-1 flex-col overflow-hidden">
        {/* === ADMIN ZONE BANNER — qizil chiziq yuqorida === */}
        <div className="flex items-center gap-2 border-b border-admin-700/40 bg-gradient-to-r from-admin-950/60 via-admin-900/40 to-admin-950/60 px-6 py-2">
          <ShieldAlert className="h-3.5 w-3.5 text-admin-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-admin-300">
            Admin Zone — Sensitive Operations
          </span>
        </div>

        {/* Sahifa kontenti */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
