import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Loader2, Shield, Ban, Sparkles, ChevronRight,
  RefreshCw, Filter,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import {
  UserDetailsModal,
  type AdminUserRow,
} from '@/components/users/user-details-modal';
import { formatDate, timeAgo, cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

type FilterKey = 'all' | 'active' | 'admin' | 'banned';

export function UsersPage() {
  const t = useT();
  const location = useLocation();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const FILTERS: { key: FilterKey; label: string; color: string }[] = [
    { key: 'all',    label: t('users_filter_all'),     color: 'text-gold-300' },
    { key: 'active', label: t('users_filter_active'),  color: 'text-emerald-300' },
    { key: 'admin',  label: t('users_filter_admins'),  color: 'text-admin-300' },
    { key: 'banned', label: t('users_filter_banned'),  color: 'text-amber-300' },
  ];

  const loadUsers = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, email, username, full_name, avatar_url, date_of_birth,
        is_admin, is_banned, banned_at, ban_reason,
        credits_remaining, credits_reset_at,
        last_ip, last_country, last_city, device_id, user_agent,
        last_sign_in_at, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) { setError(error.message); } else { setUsers((data as AdminUserRow[]) ?? []); }
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'active' && (u.is_banned || u.is_admin)) return false;
      if (filter === 'admin' && !u.is_admin) return false;
      if (filter === 'banned' && !u.is_banned) return false;
      if (!term) return true;
      const haystack = [u.email, u.username, u.full_name].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [users, filter, search]);

  const counts = useMemo(() => ({
    all:    users.length,
    active: users.filter((u) => !u.is_banned && !u.is_admin).length,
    admin:  users.filter((u) => u.is_admin).length,
    banned: users.filter((u) => u.is_banned).length,
  }), [users]);

  const handleUserUpdated = (patch: Partial<AdminUserRow>) => {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    setSelected(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Users}
        title={t('users_title')}
        subtitle={`${t('all')}: ${users.length} ta`}
        action={
          <button type="button" onClick={() => loadUsers(true)} disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-300 transition-colors hover:bg-midnight-700/40 disabled:opacity-50">
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            {t('refresh')}
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                  : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
              )}>
              <Filter className="h-3 w-3" />
              {f.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                filter === f.key ? 'bg-admin-500/30 text-admin-100' : 'bg-white/5 text-gold-700')}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold-700" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('users_search')}
            className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/40 py-2 pl-9 pr-3 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none lg:w-[320px]" />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gold-900/30 bg-midnight-900/40">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gold-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-gold-700">
            {search ? t('users_search_empty') : t('users_empty')}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-900/30 bg-midnight-950/60 text-left text-[10px] uppercase tracking-wider text-gold-700">
                  <th className="px-4 py-3 font-semibold">{t('users_col_user')}</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">{t('users_col_status')}</th>
                  <th className="px-4 py-3 font-semibold">{t('users_col_credits')}</th>
                  <th className="px-4 py-3 font-semibold">{t('users_col_last_login')}</th>
                  <th className="px-4 py-3 font-semibold">{t('created_at')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.id} user={u} onClick={() => setSelected(u)} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 text-xs text-gold-700">
          {filtered.length} {t('users_shown')}
          {filtered.length < users.length && ` (${users.length} dan)`}
        </div>
      )}

      {selected && (
        <UserDetailsModal
          user={selected} open={!!selected}
          onClose={() => setSelected(null)} onUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}

function UserRow({ user, onClick, t }: { user: AdminUserRow; onClick: () => void; t: (k: any) => string }) {
  return (
    <tr onClick={onClick}
      className="group cursor-pointer border-b border-gold-900/20 transition-colors hover:bg-midnight-800/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              : <span className="text-xs font-bold text-gold-300">
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </span>}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gold-100">{user.full_name || '—'}</div>
            <div className="truncate text-xs text-gold-700">{user.email || '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gold-300/80">
        {user.username ? `@${user.username}` : <span className="text-gold-700/50">—</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.is_admin && (
            <Badge variant="admin" icon={<Shield className="h-3 w-3" />}>{t('users_badge_admin')}</Badge>
          )}
          {user.is_banned && (
            <Badge variant="amber" icon={<Ban className="h-3 w-3" />}>{t('users_badge_banned')}</Badge>
          )}
          {!user.is_admin && !user.is_banned && (
            <Badge variant="emerald">{t('users_badge_active')}</Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gold-200">
          <Sparkles className="h-3 w-3 text-gold-500" />
          {user.credits_remaining ?? 0}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gold-700">
        {user.last_sign_in_at ? timeAgo(user.last_sign_in_at) : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gold-700">{formatDate(user.created_at)}</td>
      <td className="px-4 py-3 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-gold-700 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-300" />
      </td>
    </tr>
  );
}
