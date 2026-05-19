import { useState, useEffect, useCallback } from 'react';
import {
  Users, Music, CreditCard, Sparkles, RefreshCw, TrendingUp,
  Clock, ShieldAlert, Flag, Bell, Loader2, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { timeAgo, cn } from '@/lib/utils';
import { LayoutDashboard } from 'lucide-react';

interface DashStats {
  total_users:        number;
  new_users_today:    number;
  new_users_week:     number;
  songs_today:        number;
  songs_total:        number;
  songs_flagged:      number;
  active_subs:        number;
  total_credits_used: number;
  feedback_new:       number;
  banned_users:       number;
}

interface RecentUser {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

interface RecentSong {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string;
  user_id: string;
  author_email?: string | null;
  author_username?: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  ready:      'text-emerald-400',
  generating: 'text-amber-400',
  failed:     'text-admin-400',
  published:  'text-blue-400',
};

export function DashboardPage() {
  const [stats,       setStats]       = useState<DashStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentSongs, setRecentSongs] = useState<RecentSong[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null);
  const [error,       setError]       = useState('');

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: newUsersWeek },
        { count: songsToday },
        { count: songsTotal },
        { count: songsFlagged },
        { count: activeSubs },
        { count: feedbackNew },
        { count: bannedUsers },
        { data: credData },
        { data: usersData },
        { data: songsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('songs').select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('songs').select('*', { count: 'exact', head: true })
          .eq('is_flagged', true),
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('subscription_plan', 'is', null),
        supabase.from('feedback').select('*', { count: 'exact', head: true })
          .eq('status', 'new'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('is_banned', true),
        supabase.from('profiles')
          .select('credits_remaining')
          .limit(1000),
        supabase.from('profiles')
          .select('id, email, username, full_name, avatar_url, is_admin, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('songs')
          .select('id, title, status, created_at, user_id, profiles!user_id(email, username)')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      const totalCreditsUsed = (credData ?? []).reduce((sum: number, r: any) => {
        return sum + Math.max(0, 100 - (r.credits_remaining ?? 0));
      }, 0);

      setStats({
        total_users:        totalUsers        ?? 0,
        new_users_today:    newUsersToday     ?? 0,
        new_users_week:     newUsersWeek      ?? 0,
        songs_today:        songsToday        ?? 0,
        songs_total:        songsTotal        ?? 0,
        songs_flagged:      songsFlagged      ?? 0,
        active_subs:        activeSubs        ?? 0,
        total_credits_used: totalCreditsUsed,
        feedback_new:       feedbackNew       ?? 0,
        banned_users:       bannedUsers       ?? 0,
      });

      setRecentUsers((usersData ?? []) as RecentUser[]);

      setRecentSongs(
        (songsData ?? []).map((s: any) => ({
          id:              s.id,
          title:           s.title,
          status:          s.status,
          created_at:      s.created_at,
          user_id:         s.user_id,
          author_email:    s.profiles?.email    ?? null,
          author_username: s.profiles?.username ?? null,
        }))
      );

      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message ?? "Ma'lumot yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, [loadAll]);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Tizim umumiy holati va asosiy ko'rsatkichlar"
        action={
          <button
            type="button"
            onClick={() => { setLoading(true); loadAll(); }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Yangilash
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          {error}
        </div>
      )}

      {/* Asosiy statistika — 4 ta karta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Jami foydalanuvchilar"
          value={stats ? stats.total_users : null}
          delta={{ value: stats?.new_users_today ?? 0, label: "bugun" }}
          color="gold"
          loading={loading && !stats}
        />
        <StatCard
          icon={Music}
          label="Bugungi qo'shiqlar"
          value={stats?.songs_today ?? 0}
          delta={{ value: stats?.songs_total ?? 0, label: 'jami' }}
          accent="emerald"
          loading={loading && !stats}
        />
        <StatCard
          icon={CreditCard}
          label="Faol obunalar"
          value={stats?.active_subs ?? 0}
          accent="blue"
          loading={loading && !stats}
        />
        <StatCard
          icon={Sparkles}
          label="Credit qoldig'i"
          value={stats?.total_credits_used ?? 0}
          accent="admin"
          loading={loading && !stats}
        />
      </div>

      {/* Ikkinchi qator — ogohlantirishlar */}
      {stats && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Flagged qo'shiqlar */}
          <div className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            stats.songs_flagged > 0
              ? 'border-admin-900/40 bg-admin-950/20'
              : 'border-gold-900/30 bg-midnight-900/40',
          )}>
            <Flag className={cn('h-5 w-5', stats.songs_flagged > 0 ? 'text-admin-400' : 'text-gold-700')} />
            <div>
              <div className="text-xs uppercase tracking-wider text-gold-700">Flagged qoʻshiqlar</div>
              <div className={cn('text-xl font-bold', stats.songs_flagged > 0 ? 'text-admin-300' : 'text-gold-100')}>
                {stats.songs_flagged}
              </div>
            </div>
          </div>

          {/* Yangi feedback */}
          <div className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            stats.feedback_new > 0
              ? 'border-amber-900/40 bg-amber-950/20'
              : 'border-gold-900/30 bg-midnight-900/40',
          )}>
            <Bell className={cn('h-5 w-5', stats.feedback_new > 0 ? 'text-amber-400' : 'text-gold-700')} />
            <div>
              <div className="text-xs uppercase tracking-wider text-gold-700">Yangi feedback</div>
              <div className={cn('text-xl font-bold', stats.feedback_new > 0 ? 'text-amber-300' : 'text-gold-100')}>
                {stats.feedback_new}
              </div>
            </div>
          </div>

          {/* Haftalik o'sish */}
          <div className="flex items-center gap-3 rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="text-xs uppercase tracking-wider text-gold-700">Haftalik oʻsish</div>
              <div className="text-xl font-bold text-emerald-300">+{stats.new_users_week}</div>
            </div>
          </div>
        </div>
      )}

      {/* So'nggi faoliyat — 2 ustun */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* So'nggi foydalanuvchilar */}
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gold-900/30 bg-midnight-950/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gold-200">
              <Users className="h-3.5 w-3.5 text-admin-300" />
              Soʻnggi royxatdan otganlar
            </div>
            {lastUpdate && (
              <span className="text-[10px] text-gold-700">
                {timeAgo(lastUpdate.toISOString())}
              </span>
            )}
          </div>

          {loading && recentUsers.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gold-700">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-gold-700">
              Foydalanuvchilar yoʻq
            </div>
          ) : (
            <div className="divide-y divide-gold-900/20">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-midnight-800/40 transition-colors">
                  <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                      : <span className="text-[10px] font-bold text-gold-300">
                          {(u.full_name || u.email || 'U')[0].toUpperCase()}
                        </span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gold-100">
                      {u.full_name || u.username || '—'}
                      {u.is_admin && (
                        <span className="ml-1.5 rounded bg-admin-500/20 px-1 py-0.5 text-[9px] font-bold uppercase text-admin-300">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-gold-700">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gold-700">
                    <Clock className="h-3 w-3" />
                    {timeAgo(u.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* So'nggi qo'shiqlar */}
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gold-900/30 bg-midnight-950/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gold-200">
              <Music className="h-3.5 w-3.5 text-admin-300" />
              Soʻnggi qoʻshiqlar
            </div>
            {lastUpdate && (
              <span className="text-[10px] text-gold-700">
                {timeAgo(lastUpdate.toISOString())}
              </span>
            )}
          </div>

          {loading && recentSongs.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gold-700">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : recentSongs.length === 0 ? (
            <div className="py-10 text-center text-sm text-gold-700">
              Qoʻshiqlar yoʻq
            </div>
          ) : (
            <div className="divide-y divide-gold-900/20">
              {recentSongs.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-midnight-800/40 transition-colors">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold-700/40 bg-midnight-800/60">
                    <Music className="h-3.5 w-3.5 text-gold-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gold-100">
                      {s.title || 'Untitled'}
                    </div>
                    <div className="truncate text-[11px] text-gold-700">
                      {s.author_username
                        ? `@${s.author_username}`
                        : s.author_email || '—'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={cn(
                      'text-[10px] font-semibold uppercase',
                      STATUS_COLOR[s.status ?? ''] ?? 'text-gold-700',
                    )}>
                      {s.status ?? '—'}
                    </span>
                    <span className="text-[10px] text-gold-700">
                      {timeAgo(s.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-refresh info */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-gold-700/60">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Real-time · 30 soniyada avtomatik yangilanadi
        {lastUpdate && ` · So'nggi: ${lastUpdate.toLocaleTimeString('uz-UZ')}`}
      </div>
    </div>
  );
}
