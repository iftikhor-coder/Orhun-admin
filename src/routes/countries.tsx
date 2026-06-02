import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Loader2, ChevronDown, ChevronRight, Users, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { timeAgo, cn } from '@/lib/utils';

// ── Barcha dunyo davlatlari (ISO 3166-1 alpha-2) ─────────────────────
const ALL_COUNTRIES: { name: string; code: string }[] = [
  { name: 'Afghanistan', code: 'AF' }, { name: 'Albania', code: 'AL' },
  { name: 'Algeria', code: 'DZ' }, { name: 'Andorra', code: 'AD' },
  { name: 'Angola', code: 'AO' }, { name: 'Argentina', code: 'AR' },
  { name: 'Armenia', code: 'AM' }, { name: 'Australia', code: 'AU' },
  { name: 'Austria', code: 'AT' }, { name: 'Azerbaijan', code: 'AZ' },
  { name: 'Bahrain', code: 'BH' }, { name: 'Bangladesh', code: 'BD' },
  { name: 'Belarus', code: 'BY' }, { name: 'Belgium', code: 'BE' },
  { name: 'Bolivia', code: 'BO' }, { name: 'Bosnia and Herzegovina', code: 'BA' },
  { name: 'Brazil', code: 'BR' }, { name: 'Bulgaria', code: 'BG' },
  { name: 'Cambodia', code: 'KH' }, { name: 'Cameroon', code: 'CM' },
  { name: 'Canada', code: 'CA' }, { name: 'Chile', code: 'CL' },
  { name: 'China', code: 'CN' }, { name: 'Colombia', code: 'CO' },
  { name: 'Croatia', code: 'HR' }, { name: 'Cuba', code: 'CU' },
  { name: 'Cyprus', code: 'CY' }, { name: 'Czech Republic', code: 'CZ' },
  { name: 'Denmark', code: 'DK' }, { name: 'Ecuador', code: 'EC' },
  { name: 'Egypt', code: 'EG' }, { name: 'Estonia', code: 'EE' },
  { name: 'Ethiopia', code: 'ET' }, { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR' }, { name: 'Georgia', code: 'GE' },
  { name: 'Germany', code: 'DE' }, { name: 'Ghana', code: 'GH' },
  { name: 'Greece', code: 'GR' }, { name: 'Hungary', code: 'HU' },
  { name: 'Iceland', code: 'IS' }, { name: 'India', code: 'IN' },
  { name: 'Indonesia', code: 'ID' }, { name: 'Iran', code: 'IR' },
  { name: 'Iraq', code: 'IQ' }, { name: 'Ireland', code: 'IE' },
  { name: 'Israel', code: 'IL' }, { name: 'Italy', code: 'IT' },
  { name: 'Japan', code: 'JP' }, { name: 'Jordan', code: 'JO' },
  { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' },
  { name: 'Kuwait', code: 'KW' }, { name: 'Kyrgyzstan', code: 'KG' },
  { name: 'Latvia', code: 'LV' }, { name: 'Lebanon', code: 'LB' },
  { name: 'Libya', code: 'LY' }, { name: 'Lithuania', code: 'LT' },
  { name: 'Luxembourg', code: 'LU' }, { name: 'Malaysia', code: 'MY' },
  { name: 'Maldives', code: 'MV' }, { name: 'Mexico', code: 'MX' },
  { name: 'Moldova', code: 'MD' }, { name: 'Mongolia', code: 'MN' },
  { name: 'Montenegro', code: 'ME' }, { name: 'Morocco', code: 'MA' },
  { name: 'Myanmar', code: 'MM' }, { name: 'Nepal', code: 'NP' },
  { name: 'Netherlands', code: 'NL' }, { name: 'New Zealand', code: 'NZ' },
  { name: 'Nigeria', code: 'NG' }, { name: 'North Macedonia', code: 'MK' },
  { name: 'Norway', code: 'NO' }, { name: 'Oman', code: 'OM' },
  { name: 'Pakistan', code: 'PK' }, { name: 'Palestine', code: 'PS' },
  { name: 'Panama', code: 'PA' }, { name: 'Peru', code: 'PE' },
  { name: 'Philippines', code: 'PH' }, { name: 'Poland', code: 'PL' },
  { name: 'Portugal', code: 'PT' }, { name: 'Qatar', code: 'QA' },
  { name: 'Romania', code: 'RO' }, { name: 'Russia', code: 'RU' },
  { name: 'Saudi Arabia', code: 'SA' }, { name: 'Serbia', code: 'RS' },
  { name: 'Singapore', code: 'SG' }, { name: 'Slovakia', code: 'SK' },
  { name: 'Slovenia', code: 'SI' }, { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' }, { name: 'Spain', code: 'ES' },
  { name: 'Sri Lanka', code: 'LK' }, { name: 'Sudan', code: 'SD' },
  { name: 'Sweden', code: 'SE' }, { name: 'Switzerland', code: 'CH' },
  { name: 'Syria', code: 'SY' }, { name: 'Taiwan', code: 'TW' },
  { name: 'Tajikistan', code: 'TJ' }, { name: 'Tanzania', code: 'TZ' },
  { name: 'Thailand', code: 'TH' }, { name: 'Tunisia', code: 'TN' },
  { name: 'Turkey', code: 'TR' }, { name: 'Turkmenistan', code: 'TM' },
  { name: 'Uganda', code: 'UG' }, { name: 'Ukraine', code: 'UA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'United States', code: 'US' },
  { name: 'Uruguay', code: 'UY' }, { name: 'Uzbekistan', code: 'UZ' },
  { name: 'Venezuela', code: 'VE' }, { name: 'Vietnam', code: 'VN' },
  { name: 'Yemen', code: 'YE' }, { name: 'Zimbabwe', code: 'ZW' },
];

// ISO kodi → flagcdn.com URL
function flagUrl(iso2: string): string {
  return "https://flagcdn.com/24x18/" + iso2.toLowerCase() + ".png";
}

// Davlat nomi variantlari (DB'da har xil saqlanishi mumkin)
const NAME_ALIASES: Record<string, string> = {
  "viet nam": "Vietnam", "vietnamese": "Vietnam",
  "south korea": "South Korea", "republic of korea": "South Korea",
  "north korea": "North Korea",
  "united states of america": "United States", "us": "United States", "usa": "United States",
  "united kingdom": "United Kingdom", "uk": "United Kingdom", "great britain": "United Kingdom",
  "uae": "United Arab Emirates",
  "russia": "Russia", "russian federation": "Russia",
  "iran": "Iran", "islamic republic of iran": "Iran",
  "syria": "Syria", "syrian arab republic": "Syria",
  "czech republic": "Czech Republic", "czechia": "Czech Republic",
  "north macedonia": "North Macedonia", "macedonia": "North Macedonia",
  "moldova": "Moldova", "republic of moldova": "Moldova",
};

function normalizeCountry(name: string): string {
  const lower = name.toLowerCase().trim();
  return NAME_ALIASES[lower] ?? name;
}

interface CountryItem {
  name: string;
  code: string;
  flag: string; // CDN URL
  count: number;
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

export function CountriesPage() {
  const navigate = useNavigate();

  const [countries,  setCountries]  = useState<CountryItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<'all' | 'active'>('active');
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [users,      setUsers]      = useState<Record<string, CountryUser[]>>({});
  const [loadingC,   setLoadingC]   = useState<string | null>(null);
  const [error,      setError]      = useState('');
  const [detecting,  setDetecting]  = useState(false);
  const [detectProgress, setDetectProgress] = useState('');

  const detectFromIps = async () => {
    setDetecting(true);
    setDetectProgress('');
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, last_ip')
        .is('last_country', null)
        .not('last_ip', 'is', null)
        .limit(50);

      if (!profiles || profiles.length === 0) {
        setError("IP yozilgan profillar topilmadi yoki hammasi to\'ldirilgan");
        setDetecting(false);
        return;
      }

      const uniqueIPs = [...new Set((profiles as any[]).map((p: any) => p.last_ip).filter(Boolean))];
      const ipCountry: Record<string, string> = {};

      // electronAPI.getGeo IPC orqali (CSP cheklovisiz)
      const getGeo = window.electronAPI?.getGeo;

      for (let i = 0; i < uniqueIPs.length; i++) {
        const ip = uniqueIPs[i] as string;
        setDetectProgress((i + 1) + '/' + uniqueIPs.length);
        try {
          if (typeof getGeo === 'function') {
            const geo = await getGeo(ip);
            if (geo?.country_name) ipCountry[ip] = geo.country_name;
          }
          await new Promise(r => setTimeout(r, 300));
        } catch { /* ignore */ }
      }

      let updated = 0;
      for (const profile of profiles as any[]) {
        const country = ipCountry[profile.last_ip];
        if (country) {
          await supabase.from('profiles').update({ last_country: country }).eq('id', profile.id);
          updated++;
        }
      }

      setDetectProgress('');
      if (updated > 0) {
        // Sahifani qayta yuklamasdan, state ni yangilaymiz
        setError('');
        // Davlatlarni qayta yuklaymiz
        const { data } = await supabase
          .from('profiles')
          .select('last_country')
          .not('last_country', 'is', null);
        const counts: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          if (r.last_country) {
            const key = normalizeCountry(r.last_country.trim());
            counts[key] = (counts[key] ?? 0) + 1;
          }
        });
        setCountries(prev => prev.map(c => ({
          ...c,
          count: counts[c.name] ?? 0,
        })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)));
        alert(updated + ' ta profil yangilandi!');
      } else {
        alert('Yangilanadigan profil topilmadi. Ular allaqachon aniqlanganmi yoki getGeo ishlamayaptimi?');
      }
    } catch (e: any) {
      setError(e.message ?? 'Xato');
    } finally {
      setDetecting(false);
      setDetectProgress('');
    }
  };


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Profilelardan last_country ma'lumotlarini olamiz
        const { data } = await supabase
          .from('profiles')
          .select('last_country')
          .not('last_country', 'is', null);

        // Har bir davlat uchun foydalanuvchilar sonini hisoblaymiz
        const counts: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          if (r.last_country) {
            const key = normalizeCountry(r.last_country.trim());
            counts[key] = (counts[key] ?? 0) + 1;
          }
        });

        // Barcha dunyo davlatlarini counts bilan birlashtiramiz
        const merged: CountryItem[] = ALL_COUNTRIES.map(c => ({
          name:  c.name,
          code:  c.code,
          flag:  flagUrl(c.code),
          count: counts[c.name] ?? counts[normalizeCountry(c.name)] ?? 0,
        }));

        // DB da bor lekin bizning ro'yxatimizda yo'q davlatlarni qo'shamiz
        Object.keys(counts).forEach(dbName => {
          const exists = merged.find(m => m.name.toLowerCase() === dbName.toLowerCase());
          if (!exists) {
            merged.push({
              name:  dbName,
              code:  '??',
              flag:  '🌐',
              count: counts[dbName],
            });
          }
        });

        // Saralash: foydalanuvchisi borlar avval, keyin alifbo
        merged.sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        });

        setCountries(merged);
      } catch (e: any) {
        setError(e.message ?? 'Xato');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadUsers = async (countryName: string) => {
    if (users[countryName]) {
      setExpanded(prev => prev === countryName ? null : countryName);
      return;
    }
    setLoadingC(countryName);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id,email,username,full_name,avatar_url,is_banned,is_admin,created_at')
        .eq('last_country', countryName)
        .order('created_at', { ascending: false })
        .limit(50);
      setUsers(prev => ({ ...prev, [countryName]: (data as CountryUser[]) ?? [] }));
      setExpanded(countryName);
    } catch { /* ignore */ }
    finally { setLoadingC(null); }
  };

  const openUser = (userId: string) => {
    navigate('/users', { state: { openUserId: userId } });
  };

  // Filtr va qidiruv
  const filtered = countries.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.count > 0;
    return matchSearch && matchFilter;
  });

  const totalUsers  = countries.reduce((s, c) => s + c.count, 0);
  const activeCount = countries.filter(c => c.count > 0).length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Globe}
        title="Davlatlar"
        subtitle="Dunyo davlatlari — foydalanuvchilar joylashuvi bo'yicha"
      />

      {/* Stat kartochkalar */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">Jami davlatlar</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-100">{ALL_COUNTRIES.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">Foydalanuvchi bor</div>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-300">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">IP yozilgan</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-100">{totalUsers}</div>
        </div>
        <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">Eng ko'p</div>
          <div className="mt-1 font-display text-base font-bold text-gold-100 truncate">
            {countries[0]?.count > 0
              ? `${countries[0].name} (${countries[0].count})`
              : '—'}
          </div>
        </div>
      </div>


      {/* IP detect panel */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-900/30 bg-amber-950/10 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-amber-300">
            IP orqali davlatlarni aniqlash
          </div>
          <div className="mt-0.5 text-[11px] text-gold-700">
            Profillarda last_country null bo'lsa, last_ip dan avtomatik aniqlaydi
          </div>
        </div>
        <button type="button" onClick={detectFromIps} disabled={detecting}
          className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 shrink-0">
          {detecting
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{detectProgress || 'Aniqlanmoqda...'}</>
            : <>🌍 IP dan aniqlash</>}
        </button>
      </div>

      {/* Qidiruv va filter */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-700" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Davlat nomi bo'yicha qidirish..."
            className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/60 py-2.5 pl-9 pr-3 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-gold-500/60 focus:outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(['active', 'all'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                  : 'bg-midnight-800/40 text-gold-300/70 hover:bg-midnight-700/40',
              )}>
              {f === 'active' ? `Foydalanuvchi bor (${activeCount})` : `Hammasi (${ALL_COUNTRIES.length})`}
            </button>
          ))}
        </div>
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
          {search ? 'Davlat topilmadi' : 'Hech qanday davlat topilmadi'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((c) => {
            const isOpen = expanded === c.name;
            const cUsers = users[c.name];
            const hasUsers = c.count > 0;

            return (
              <div key={c.code}
                className={cn(
                  'overflow-hidden rounded-xl border transition-all',
                  hasUsers
                    ? 'border-gold-900/30 bg-midnight-900/40'
                    : 'border-gold-900/20 bg-midnight-950/30',
                )}>
                <button
                  type="button"
                  onClick={() => hasUsers ? loadUsers(c.name) : undefined}
                  disabled={!hasUsers && loadingC !== c.name}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                    hasUsers ? 'hover:bg-midnight-800/40 cursor-pointer' : 'cursor-default',
                  )}
                >
                  {hasUsers
                    ? (isOpen
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-gold-700" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-gold-700" />)
                    : <span className="h-4 w-4 shrink-0" />}

                  <img src={c.flag} alt={c.name} className="h-4 w-5 shrink-0 rounded-sm object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />

                  <div className="min-w-0 flex-1 text-left">
                    <span className={cn(
                      'text-sm font-medium',
                      hasUsers ? 'text-gold-100' : 'text-gold-500/50',
                    )}>
                      {c.name}
                    </span>
                  </div>

                  {loadingC === c.name ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gold-700" />
                  ) : (
                    <div className={cn(
                      'flex items-center gap-1.5 rounded-md px-2.5 py-1',
                      hasUsers
                        ? 'bg-gold-500/10 ring-1 ring-gold-500/20'
                        : 'bg-midnight-800/40',
                    )}>
                      <Users className={cn('h-3 w-3', hasUsers ? 'text-gold-500' : 'text-gold-700/40')} />
                      <span className={cn(
                        'text-sm font-bold',
                        hasUsers ? 'text-gold-300' : 'text-gold-700/40',
                      )}>
                        {c.count}
                      </span>
                    </div>
                  )}
                </button>

                {/* Foydalanuvchilar */}
                {isOpen && cUsers && hasUsers && (
                  <div className="border-t border-gold-900/20 bg-midnight-950/40">
                    {cUsers.length === 0 ? (
                      <div className="px-5 py-3 text-sm text-gold-700">
                        Foydalanuvchi topilmadi
                      </div>
                    ) : (
                      <div className="divide-y divide-gold-900/10">
                        {cUsers.map(u => (
                          <button key={u.id} type="button" onClick={() => openUser(u.id)}
                            className="flex w-full items-center gap-3 px-5 py-2.5 hover:bg-midnight-800/40 transition-colors">
                            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
                              {u.avatar_url
                                ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                                : <span className="text-[10px] font-bold text-gold-300">
                                    {(u.full_name || u.email || 'U')[0].toUpperCase()}
                                  </span>}
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-gold-100">
                                  {u.full_name || u.username || '—'}
                                </span>
                                {u.is_admin && (
                                  <span className="rounded bg-admin-500/20 px-1 py-0.5 text-[9px] font-bold uppercase text-admin-300">Admin</span>
                                )}
                                {u.is_banned && (
                                  <span className="rounded bg-admin-800/40 px-1 py-0.5 text-[9px] font-bold uppercase text-admin-400">Ban</span>
                                )}
                              </div>
                              <div className="truncate text-[11px] text-gold-700">
                                {u.email} · {timeAgo(u.created_at)}
                              </div>
                            </div>
                            <span className="text-[10px] text-gold-700/50">Ko'rish →</span>
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
