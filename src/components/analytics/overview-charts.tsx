import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, Music, Sparkles, AlertTriangle, Globe, TrendingUp,
  Loader2, RefreshCw, Download, FileText, FileSpreadsheet,
  Wifi, WifiOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Stats {
  total_users: number;
  active_users: number;
  banned_users: number;
  admins: number;
  total_songs: number;
  songs_today: number;
  songs_week: number;
  songs_flagged: number;
  new_users_today: number;
  new_users_week: number;
  feedback_new: number;
  banned_devices_cnt: number;
  total_credits_used: number;
}

interface GrowthRow { day: string; new_users: number; total_users: number }
interface SongRow   { day: string; songs_count: number }
interface GenreRow  { genre: string; cnt: number; pct: number }
interface CountryRow { country_name: string; user_count: number }
interface CountryUser { id: string; email: string | null; username: string | null; full_name: string | null; avatar_url: string | null; }

const PIE_COLORS = ['#f5b342','#ec4899','#8b5cf6','#06b6d4','#10b981','#dc2626','#f59e0b','#7c3aed'];

// ISO 2-harfli kod → emoji bayroq
function flagEmoji(name: string): string {
  const MAP: Record<string, string> = {
    'uzbekistan': '🇺🇿', 'turkey': '🇹🇷', 'azerbaijan': '🇦🇿',
    'united states': '🇺🇸', 'usa': '🇺🇸', 'russia': '🇷🇺',
    'germany': '🇩🇪', 'uk': '🇬🇧', 'united kingdom': '🇬🇧',
    'kazakhstan': '🇰🇿', 'ukraine': '🇺🇦', 'france': '🇫🇷',
  };
  return MAP[name.toLowerCase()] || '🌐';
}

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function OverviewCharts() {
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [growth,    setGrowth]    = useState<GrowthRow[]>([]);
  const [songs,     setSongs]     = useState<SongRow[]>([]);
  const [genres,    setGenres]    = useState<GenreRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [latency,   setLatency]   = useState<number | null>(null);
  const [online,    setOnline]    = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const [sR, gR, dR, genR, cR] = await Promise.all([
        supabase.rpc('admin_analytics_overview'),
        supabase.rpc('admin_users_growth', { p_days: 30 }),
        supabase.rpc('admin_songs_daily',  { p_days: 30 }),
        supabase.rpc('admin_genre_distribution'),
        supabase.rpc('admin_country_distribution'),
      ]);
      const t1 = performance.now();
      setLatency(Math.round(t1 - t0));
      setOnline(!sR.error);
      if (sR.data)   setStats(sR.data as Stats);
      if (gR.data)   setGrowth(gR.data as GrowthRow[]);
      if (dR.data)   setSongs(dR.data as SongRow[]);
      if (genR.data) setGenres(genR.data as GenreRow[]);
      if (cR.data)   setCountries(cR.data as CountryRow[]);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, [loadAll]);

  // CSV eksport — foydalanuvchilar
  const exportUsersCSV = async () => {
    setExporting(true); setExportMsg('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,username,full_name,is_admin,is_banned,credits_remaining,last_country,last_ip,created_at')
        .order('created_at', { ascending: false });
      if (error || !data) throw new Error(error?.message);
      const headers = ['id','email','username','full_name','is_admin','is_banned','credits_remaining','last_country','last_ip','created_at'];
      const rows = data.map((r: any) => headers.map(h => {
        const v = r[h]; if (v == null) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(','));
      downloadBlob([headers.join(','), ...rows].join('\n'), `users_${dateStamp()}.csv`, 'text/csv;charset=utf-8;');
      setExportMsg(`✅ ${data.length} ta foydalanuvchi eksport qilindi`);
    } catch (e: any) {
      setExportMsg('❌ ' + e.message);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  // CSV eksport — qo'shiqlar
  const exportSongsCSV = async () => {
    setExporting(true); setExportMsg('');
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id,user_id,title,prompt,duration,status,is_published,is_flagged,created_at')
        .order('created_at', { ascending: false });
      if (error || !data) throw new Error(error?.message);
      const headers = ['id','user_id','title','prompt','duration','status','is_published','is_flagged','created_at'];
      const rows = data.map((r: any) => headers.map(h => {
        const v = r[h]; if (v == null) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(','));
      downloadBlob([headers.join(','), ...rows].join('\n'), `songs_${dateStamp()}.csv`, 'text/csv;charset=utf-8;');
      setExportMsg(`✅ ${data.length} ta qoʻshiq eksport qilindi`);
    } catch (e: any) {
      setExportMsg('❌ ' + e.message);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  };

  // PDF hisobot
  const exportPDF = async () => {
    setExporting(true);
    try {
      const { data } = await supabase.rpc('admin_analytics_overview');
      const s = (data as Stats) || {};
      const html = `<!DOCTYPE html><html><head><title>Orhun AI Analytics</title>
<style>body{font-family:Arial;padding:40px;color:#111}
h1{color:#b8860b;border-bottom:3px solid #f5b342;padding-bottom:10px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
.card{padding:16px;background:#f9f6f0;border-left:4px solid #f5b342;border-radius:4px}
.label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px}
.val{font-size:26px;font-weight:bold;margin-top:6px}
footer{margin-top:60px;padding-top:20px;border-top:1px solid #ddd;color:#888;font-size:11px}
</style></head><body>
<h1>Orhun AI — Analytics Report</h1>
<p>Yaratilgan: ${new Date().toLocaleString('uz-UZ')}</p>
<div class="grid">
<div class="card"><div class="label">Jami foydalanuvchilar</div><div class="val">${s.total_users||0}</div></div>
<div class="card"><div class="label">Jami qo'shiqlar</div><div class="val">${s.total_songs||0}</div></div>
<div class="card"><div class="label">Bugungi yangilar</div><div class="val">+${s.new_users_today||0}</div></div>
<div class="card"><div class="label">Bugungi qo'shiqlar</div><div class="val">+${s.songs_today||0}</div></div>
<div class="card"><div class="label">Banlangan</div><div class="val">${s.banned_users||0}</div></div>
<div class="card"><div class="label">Flagged qo'shiqlar</div><div class="val">${s.songs_flagged||0}</div></div>
<div class="card"><div class="label">Credit ishlatilgan</div><div class="val">${s.total_credits_used||0}</div></div>
<div class="card"><div class="label">Yangi feedback</div><div class="val">${s.feedback_new||0}</div></div>
</div>
<footer>Orhun AI Admin Panel · ${new Date().getFullYear()}</footer>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setExportMsg("✅ PDF tayyor — Print → Save as PDF");
    } catch {
      setExportMsg("❌ PDF yaratishda xato");
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 5000);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-gold-700">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server uptime */}
      <div className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
        online
          ? 'border-emerald-900/40 bg-emerald-950/20'
          : 'border-admin-900/40 bg-admin-950/20',
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-2.5 w-2.5 rounded-full',
            online ? 'bg-emerald-400 animate-pulse' : 'bg-admin-400',
          )} />
          <div>
            <div className="text-sm font-semibold text-gold-100">
              {online ? 'Server online' : 'Server offline'}
            </div>
            <div className="text-[10px] text-gold-700">
              Latency: {latency ?? '—'}ms · Auto-refresh: 30s
            </div>
          </div>
          {online
            ? <Wifi className="h-4 w-4 text-emerald-400" />
            : <WifiOff className="h-4 w-4 text-admin-400" />}
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-1.5 text-xs text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          Yangilash
        </button>
      </div>

      {/* Eksport paneli */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold-900/30 bg-midnight-900/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold-700">
          <Download className="h-3 w-3" />
          Eksport:
        </div>
        <button onClick={exportUsersCSV} disabled={exporting}
          className="flex items-center gap-1.5 rounded-md bg-midnight-800/40 px-3 py-1.5 text-xs text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50">
          <FileSpreadsheet className="h-3 w-3" />Users CSV
        </button>
        <button onClick={exportSongsCSV} disabled={exporting}
          className="flex items-center gap-1.5 rounded-md bg-midnight-800/40 px-3 py-1.5 text-xs text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50">
          <FileSpreadsheet className="h-3 w-3" />Songs CSV
        </button>
        <button onClick={exportPDF} disabled={exporting}
          className="flex items-center gap-1.5 rounded-md bg-midnight-800/40 px-3 py-1.5 text-xs text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50">
          <FileText className="h-3 w-3" />PDF Hisobot
        </button>
        {exportMsg && <span className="ml-auto text-xs text-emerald-300">{exportMsg}</span>}
      </div>

      {/* Stat kartochkalari */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Users}        label="Jami foydalanuvchilar" value={stats.total_users}        sub={`+${stats.new_users_today} bugun`} color="gold" />
          <StatCard icon={Music}        label="Jami qoʻshiqlar"       value={stats.total_songs}        sub={`+${stats.songs_today} bugun`}    color="emerald" />
          <StatCard icon={Sparkles}     label="Credit ishlatilgan"    value={stats.total_credits_used} sub="API xarajati"                     color="blue" />
          <StatCard icon={AlertTriangle} label="Banlangan / Flagged"  value={stats.banned_users}       sub={`${stats.songs_flagged} flagged`} color="admin" />
        </div>
      )}

      {/* Foydalanuvchilar o'sishi */}
      <ChartCard title="Foydalanuvchilar o'sishi (30 kun)" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={growth}>
            <defs>
              <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5b342" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f5b342" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,179,66,0.1)" />
            <XAxis dataKey="day" tick={{ fill: '#8f5e16', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8f5e16', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#0a1530', border: '1px solid #3a260b', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="total_users" stroke="#f5b342" fill="url(#ugGrad)" name="Jami" />
            <Area type="monotone" dataKey="new_users"   stroke="#ec4899" fill="none"          name="Yangi" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Kunlik qo'shiqlar */}
      <ChartCard title="Kunlik qoʻshiqlar (30 kun)" icon={Music}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={songs}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,179,66,0.1)" />
            <XAxis dataKey="day"         tick={{ fill: '#8f5e16', fontSize: 10 }} />
            <YAxis                       tick={{ fill: '#8f5e16', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#0a1530', border: '1px solid #3a260b', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="songs_count" fill="#10b981" name="Qoʻshiqlar" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Janr pie chart */}
        <ChartCard title="Janr distributsiyasi" icon={Music}>
          {genres.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gold-700">
              Maʼlumot yoʻq
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={genres} dataKey="cnt" nameKey="genre"
                  cx="50%" cy="50%" outerRadius={80}
                  label={(e: any) => `${e.genre} (${e.pct}%)`}
                  labelLine={false}
                >
                  {genres.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0a1530', border: '1px solid #3a260b', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Davlatlar bayroqlar bilan — kliklanadigan */}
        <CountriesCard countries={countries} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; sub: string;
  color: 'gold' | 'emerald' | 'admin' | 'blue';
}) {
  const cls = {
    gold:    'bg-gold-500/10 text-gold-300 ring-gold-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    admin:   'bg-admin-500/10 text-admin-300 ring-admin-500/30',
    blue:    'bg-blue-500/10 text-blue-300 ring-blue-500/30',
  }[color];
  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gold-700">{label}</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-100">{value.toLocaleString()}</div>
          <div className="mt-0.5 text-[11px] text-gold-700">{sub}</div>
        </div>
        <div className={cn('grid h-9 w-9 place-items-center rounded-lg ring-1', cls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function CountriesCard({ countries }: { countries: CountryRow[] }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [users, setUsers] = useState<Record<string, CountryUser[]>>({});
  const [loadingC, setLoadingC] = useState<string | null>(null);

  const loadUsers = async (country: string) => {
    if (users[country]) {
      setExpanded(prev => prev === country ? null : country);
      return;
    }
    setLoadingC(country);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id,email,username,full_name,avatar_url')
        .eq('last_country', country)
        .limit(20);
      setUsers(prev => ({ ...prev, [country]: (data as CountryUser[]) ?? [] }));
      setExpanded(country);
    } catch { /* ignore */ }
    finally { setLoadingC(null); }
  };

  const openUser = (userId: string) => {
    navigate('/users', { state: { openUserId: userId } });
  };

  return (
    <ChartCard title="Davlatlar — foydalanuvchilar" icon={Globe}>
      {countries.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-gold-700">
          IP ma'lumoti yo'q
        </div>
      ) : (
        <div className="max-h-[400px] space-y-1.5 overflow-y-auto pr-1">
          {countries.map((c, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-gold-900/20">
              <button
                type="button"
                onClick={() => loadUsers(c.country_name)}
                className="flex w-full items-center gap-3 bg-midnight-800/40 px-3 py-2 hover:bg-midnight-700/40 transition-colors"
              >
                <span className="text-xl leading-none">{flagEmoji(c.country_name)}</span>
                <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-gold-100">
                  {c.country_name}
                </span>
                {loadingC === c.country_name
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-700" />
                  : <span className="rounded-md bg-gold-500/15 px-2 py-0.5 text-xs font-bold text-gold-300">
                      {c.user_count}
                    </span>
                }
              </button>

              {expanded === c.country_name && users[c.country_name] && (
                <div className="divide-y divide-gold-900/10 border-t border-gold-900/20 bg-midnight-950/40">
                  {users[c.country_name].length === 0 ? (
                    <div className="px-4 py-2 text-xs text-gold-700">Foydalanuvchi topilmadi</div>
                  ) : (
                    users[c.country_name].map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => openUser(u.id)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-midnight-800/40 transition-colors"
                      >
                        <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/30 bg-midnight-800/60">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                            : <span className="text-[10px] font-bold text-gold-300">
                                {(u.full_name || u.email || 'U')[0].toUpperCase()}
                              </span>}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate text-xs font-medium text-gold-100">
                            {u.full_name || u.username || '—'}
                          </div>
                          <div className="truncate text-[10px] text-gold-700">{u.email}</div>
                        </div>
                        <span className="text-[10px] text-gold-700">Ko'rish →</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}


function ChartCard({ title, icon: Icon, children }: {
  title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gold-200">
        <Icon className="h-3.5 w-3.5 text-admin-300" />
        {title}
      </h3>
      {children}
    </div>
  );
}
