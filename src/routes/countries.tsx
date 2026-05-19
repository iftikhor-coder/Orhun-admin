import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Loader2, ChevronDown, ChevronRight, Users, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { timeAgo, cn } from '@/lib/utils';

interface CountryRow {
  country_name: string;
  user_count: number;
}

interface CountryUser {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
}

function flagEmoji(name: string): string {
  const MAP: Record<string, string> = {
    'uzbekistan': '🇺🇿', 'turkey': '🇹🇷', 'azerbaijan': '🇦🇿',
    'united states': '🇺🇸', 'usa': '🇺🇸', 'russia': '🇷🇺',
    'germany': '🇩🇪', 'united kingdom': '🇬🇧', 'uk': '🇬🇧',
    'kazakhstan': '🇰🇿', 'ukraine': '🇺🇦', 'france': '🇫🇷',
    'china': '🇨🇳', 'japan': '🇯🇵', 'south korea': '🇰🇷',
    'india': '🇮🇳', 'canada': '🇨🇦', 'australia': '🇦🇺',
    'brazil': '🇧🇷', 'spain': '🇪🇸', 'italy': '🇮🇹',
    'netherlands': '🇳🇱', 'sweden': '🇸🇪', 'norway': '🇳🇴',
    'poland': '🇵🇱', 'iran': '🇮🇷', 'saudi arabia': '🇸🇦',
    'uae': '🇦🇪', 'united arab emirates': '🇦🇪', 'pakistan': '🇵🇰',
    'kyrgyzstan': '🇰🇬', 'tajikistan': '🇹🇯', 'turkmenistan': '🇹🇲',
    'georgia': '🇬🇪', 'armenia': '🇦🇲', 'belarus': '🇧🇾',
    'moldova': '🇲🇩', 'romania': '🇷🇴', 'bulgaria': '🇧🇬',
  };
  return MAP[name.toLowerCase()] ?? '🌐';
}

export function CountriesPage() {
  const navigate = useNavigate();

  const [countries,  setCountries]  = useState<CountryRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [users,      setUsers]      = useState<Record<string, CountryUser[]>>({});
  const [loadingC,   setLoadingC]   = useState<string | null>(null);
  const [error,      setError]      = useState('');

  // Davlatlarni yuklash
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('admin_country_distribution');
        if (error) throw error;
        setCountries((data as CountryRow[]) ?? []);
      } catch {
        // RPC yo'q bo'lsa, to'g'ridan-to'g'ri profiles dan
        try {
          const { data } = await supabase
            .from('profiles')
            .select('last_country')
            .not('last_country', 'is', null);
          const counts: Record<string, number> = {};
          (data ?? []).forEach((r: any) => {
            if (r.last_country) counts[r.last_country] = (counts[r.last_country] ?? 0) + 1;
          });
          const rows = Object.entries(counts)
            .map(([country_name, user_count]) => ({ country_name, user_count }))
            .sort((a, b) => b.user_count - a.user_count);
          setCountries(rows);
        } catch (e: any) {
          setError(e.message ?? 'Xato');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadUsers = async (country: string) => {
    // Allaqachon yuklangan → toggle
    if (users[country]) {
      setExpanded(prev => prev === country ? null : country);
      return;
    }
    setLoadingC(country);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id,email,username,full_name,avatar_url,is_banned,is_admin,created_at')
        .eq('last_country', country)
        .order('created_at', { ascending: false })
        .limit(50);
      setUsers(prev => ({ ...prev, [country]: (data as CountryUser[]) ?? [] }));
      setExpanded(country);
    } catch { /* ignore */ }
    finally { setLoadingC(null); }
  };

  const openUser = (userId: string) => {
    navigate('/users', { state: { openUserId: userId } });
  };

  const filtered = countries.filter(c =>
    c.country_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = countries.reduce((s, c) => s + c.user_count, 0);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Globe}
        title="Davlatlar"
        subtitle="Foydalanuvchilar joylashuvi bo'yicha statistika"
      />

      {/* Umumiy stat */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">Jami davlatlar</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-100">{countries.length}</div>
        </div>
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">IP yozilgan</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-100">{totalUsers}</div>
        </div>
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3 col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">Eng ko'p</div>
          <div className="mt-1 font-display text-lg font-bold text-gold-100 truncate">
            {countries[0]
              ? `${flagEmoji(countries[0].country_name)} ${countries[0].country_name}`
              : '—'}
          </div>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-700" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Davlat nomi bo'yicha qidirish..."
          className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/60 py-2.5 pl-9 pr-3 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-gold-500/60 focus:outline-none"
        />
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gold-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-3 text-sm text-admin-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gold-700">
          {search ? "Davlat topilmadi" : "IP ma'lumoti yo'q"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => {
            const isOpen = expanded === c.country_name;
            const flag   = flagEmoji(c.country_name);
            const cUsers = users[c.country_name];

            return (
              <div key={i} className="overflow-hidden rounded-xl border border-gold-900/30 bg-midnight-900/40">
                {/* Davlat satri */}
                <button
                  type="button"
                  onClick={() => loadUsers(c.country_name)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 hover:bg-midnight-800/40 transition-colors"
                >
                  {isOpen
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-gold-700" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-gold-700" />}

                  <span className="text-2xl leading-none">{flag}</span>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-semibold text-gold-100">{c.country_name}</div>
                  </div>

                  {loadingC === c.country_name ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gold-700" />
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg bg-gold-500/10 px-3 py-1 ring-1 ring-gold-500/20">
                      <Users className="h-3 w-3 text-gold-500" />
                      <span className="text-sm font-bold text-gold-300">{c.user_count}</span>
                    </div>
                  )}
                </button>

                {/* Foydalanuvchilar ro'yxati */}
                {isOpen && cUsers && (
                  <div className="border-t border-gold-900/20 bg-midnight-950/40">
                    {cUsers.length === 0 ? (
                      <div className="px-5 py-3 text-sm text-gold-700">
                        Foydalanuvchi topilmadi
                      </div>
                    ) : (
                      <div className="divide-y divide-gold-900/10">
                        {cUsers.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => openUser(u.id)}
                            className="flex w-full items-center gap-3 px-5 py-3 hover:bg-midnight-800/40 transition-colors"
                          >
                            {/* Avatar */}
                            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
                              {u.avatar_url
                                ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                                : <span className="text-xs font-bold text-gold-300">
                                    {(u.full_name || u.email || 'U')[0].toUpperCase()}
                                  </span>}
                            </div>

                            {/* Ma'lumot */}
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-gold-100">
                                  {u.full_name || u.username || '—'}
                                </span>
                                {u.is_admin && (
                                  <span className="rounded bg-admin-500/20 px-1 py-0.5 text-[9px] font-bold uppercase text-admin-300">
                                    Admin
                                  </span>
                                )}
                                {u.is_banned && (
                                  <span className="rounded bg-admin-800/40 px-1 py-0.5 text-[9px] font-bold uppercase text-admin-400">
                                    Ban
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-[11px] text-gold-700">
                                {u.email} · {timeAgo(u.created_at)}
                              </div>
                            </div>

                            <span className="shrink-0 text-[10px] text-gold-700/60 hover:text-gold-300">
                              Ko'rish →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
