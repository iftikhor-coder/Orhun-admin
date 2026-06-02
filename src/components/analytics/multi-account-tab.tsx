import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Loader2, ChevronDown, ChevronRight, Ban,
  Globe, Smartphone, Shield, RefreshCw, Check, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatDate, cn } from '@/lib/utils';

function parseUA(ua: string | null | undefined): string {
  if (!ua) return '—';
  let browser = 'Browser';
  let os = 'OS';
  if      (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox'))                        browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg'))                            browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera'))   browser = 'Opera';
  if      (ua.includes('iPhone'))        os = 'iPhone';
  else if (ua.includes('iPad'))          os = 'iPad';
  else if (ua.includes('Android'))       os = 'Android';
  else if (ua.includes('Windows NT 10')) os = 'Win 10/11';
  else if (ua.includes('Mac OS X'))      os = 'macOS';
  else if (ua.includes('Linux'))         os = 'Linux';
  return `${browser} / ${os}`;
}

interface AccountInfo {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
  last_country: string | null;
  device_id?: string | null;
  user_agent?: string | null;
  last_ip?: string | null;
  last_sign_in_at: string | null;
}

interface DuplicateGroup {
  group_type: 'ip' | 'device';
  group_value: string;
  account_count: number;
  accounts: AccountInfo[];
}

export function MultiAccountTab() {
  const navigate = useNavigate();

  const [groups,     setGroups]     = useState<DuplicateGroup[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const [banUser,   setBanUser]   = useState<AccountInfo | null>(null);
  const [banDevice, setBanDevice] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banning,   setBanning]   = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('admin_detect_multi_accounts');
      if (error) throw error;
      const parsed: DuplicateGroup[] = Array.isArray(data)
        ? data
        : (data ? (data as any) : []);
      setGroups(parsed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => {
    setSuccess(msg); setTimeout(() => setSuccess(''), 4000);
  };

  const toggle = (key: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const risk = (n: number) => n >= 5 ? 'high' : n >= 3 ? 'medium' : 'low';

  const openUserModal = (userId: string) => {
    navigate('/users', { state: { openUserId: userId } });
  };

  const handleBanUser = async () => {
    if (!banUser || !banReason.trim()) return;
    setBanning(true);
    try {
      const { error } = await supabase.rpc('admin_toggle_ban', {
        p_user_id: banUser.id,
        p_reason: banReason,
      });
      if (error) throw error;
      flash(`✅ ${banUser.email} banlandi`);
      setBanUser(null); setBanReason('');
      load(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBanning(false);
    }
  };

  const handleBanDevice = async () => {
    if (!banDevice || !banReason.trim()) return;
    setBanning(true);
    try {
      const { error } = await supabase.rpc('admin_ban_device', {
        p_device_id: banDevice,
        p_reason: banReason,
      });
      if (error) throw error;
      flash('✅ Qurilma banlandi — shu qurilmadagi barcha akkauntlar ham');
      setBanDevice(null); setBanReason('');
      load(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-admin-900/40 bg-admin-950/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-admin-400" />
          <div>
            <div className="text-sm font-semibold text-admin-300">Multi-account detektor</div>
            <div className="text-[10px] text-gold-700">
              Bir xil IP yoki qurilmadagi har xil akkauntlar — potensial firibgarlik
            </div>
          </div>
        </div>
        <button type="button" onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-xs text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50">
          <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
          Yangilash
        </button>
      </div>

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-admin-900/40 bg-admin-950/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-admin-300">🚨 Yuqori risk</div>
          <div className="mt-1 font-display text-2xl font-bold text-admin-100">
            {groups.filter(g => risk(g.account_count) === 'high').length}
          </div>
          <div className="text-[10px] text-gold-700">5+ akkaunt</div>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-300">⚠️ Oʻrtacha</div>
          <div className="mt-1 font-display text-2xl font-bold text-amber-100">
            {groups.filter(g => risk(g.account_count) === 'medium').length}
          </div>
          <div className="text-[10px] text-gold-700">3-4 akkaunt</div>
        </div>
        <div className="rounded-xl border border-gold-900/40 bg-midnight-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">Past risk</div>
          <div className="mt-1 font-display text-2xl font-bold text-gold-100">
            {groups.filter(g => risk(g.account_count) === 'low').length}
          </div>
          <div className="text-[10px] text-gold-700">2 akkaunt</div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gold-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 py-12 text-center text-sm text-emerald-300">
          ✅ Shubhali holatlar topilmadi
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(g => {
            const key  = `${g.group_type}:${g.group_value}`;
            const open = expanded.has(key);
            const r    = risk(g.account_count);
            const accs = g.accounts ?? [];

            return (
              <div key={key} className={cn(
                'overflow-hidden rounded-xl border transition-all',
                r === 'high'   ? 'border-admin-500/40 bg-admin-950/20'  :
                r === 'medium' ? 'border-amber-900/40 bg-amber-950/10'  :
                                 'border-gold-900/30 bg-midnight-900/40',
              )}>
                <button type="button" onClick={() => toggle(key)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-midnight-800/30">
                  {open
                    ? <ChevronDown className="h-4 w-4 text-gold-700" />
                    : <ChevronRight className="h-4 w-4 text-gold-700" />}
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-midnight-800/60">
                    {g.group_type === 'ip'
                      ? <Globe className="h-3.5 w-3.5 text-blue-400" />
                      : <Smartphone className="h-3.5 w-3.5 text-purple-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-gold-700">
                        {g.group_type === 'ip' ? 'IP manzil' : 'Qurilma fingerprint'}
                      </span>
                      {r === 'high'   && <Badge variant="admin">🚨 YUQORI RISK</Badge>}
                      {r === 'medium' && <Badge variant="amber">⚠️ Oʻrtacha</Badge>}
                    </div>
                    <div className="font-mono text-sm text-gold-100 truncate">
                      {g.group_value
                        ? g.group_type === 'device'
                          ? g.group_value.slice(0, 24) + '...'
                          : g.group_value
                        : '—'}
                    </div>
                    {g.group_type === 'device' && accs[0]?.user_agent && (
                      <div className="text-[10px] text-gold-700/60 mt-0.5">
                        {parseUA(accs[0].user_agent)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-2xl font-bold text-gold-100">{g.account_count}</div>
                    <div className="text-[10px] text-gold-700">akkaunt</div>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-gold-900/30 bg-midnight-950/30">
                    {g.group_type === 'device' && g.group_value && (
                      <div className="border-b border-gold-900/30 bg-admin-950/10 px-4 py-2 flex items-center justify-between gap-3">
                        <div>
                          <button type="button"
                            onClick={() => { setBanDevice(g.group_value); setBanReason(''); }}
                            className="flex items-center gap-2 rounded-md bg-gradient-admin px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:scale-[1.02]">
                            <Ban className="h-3 w-3" />
                            Qurilmani butunlay ban ({g.account_count} ta akkaunt)
                          </button>
                          <p className="mt-1 text-[10px] text-gold-700">
                            VPN, yangi Gmail — Oracle server bloklaydi
                          </p>
                        </div>
                        {accs[0]?.user_agent && (
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-gold-700">Qurilma</div>
                            <div className="text-xs font-medium text-gold-300">
                              {parseUA(accs[0].user_agent)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="divide-y divide-gold-900/20">
                      {accs.map(acc => (
                        <div key={acc.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-midnight-800/40">
                          <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
                            {acc.avatar_url
                              ? <img src={acc.avatar_url} alt="" className="h-full w-full object-cover" />
                              : <span className="text-[10px] font-bold text-gold-300">
                                  {(acc.full_name || acc.email || 'U')[0].toUpperCase()}
                                </span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-gold-100">
                                {acc.full_name || acc.email || '—'}
                              </span>
                              {acc.is_admin  && <Shield className="h-3 w-3 text-admin-400" />}
                              {acc.is_banned && <Badge variant="admin">Banned</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gold-700">
                              <span>{acc.email}</span>
                              <span>·</span>
                              <span>{formatDate(acc.created_at)}</span>
                              {acc.last_country && <><span>·</span><span>🌍 {acc.last_country}</span></>}
                              {acc.user_agent  && <><span>·</span><span>💻 {parseUA(acc.user_agent)}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button"
                              onClick={() => openUserModal(acc.id)}
                              className="rounded-md bg-gold-500/10 px-2 py-1 text-[10px] font-semibold text-gold-300 hover:bg-gold-500/20">
                              <ExternalLink className="inline h-3 w-3 mr-1" />Ko'rish
                            </button>
                            {!acc.is_banned && !acc.is_admin && (
                              <button type="button"
                                onClick={() => { setBanUser(acc); setBanReason('Multi-account violation'); }}
                                className="rounded-md bg-admin-500/15 px-2 py-1 text-[10px] font-semibold text-admin-300 hover:bg-admin-500/25">
                                <Ban className="inline h-3 w-3 mr-1" />Ban
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {banUser && (
        <Modal open={!!banUser} onClose={() => { setBanUser(null); setBanReason(''); }}
          width="sm" title="Foydalanuvchini ban qilish"
          subtitle={banUser.email || banUser.id}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBanUser(null)} disabled={banning}
                className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
                Bekor
              </button>
              <button type="button" onClick={handleBanUser}
                disabled={banning || !banReason.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-admin px-4 py-2 text-sm font-semibold text-white shadow-lg hover:scale-[1.02] disabled:opacity-50">
                {banning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Ban qilish
              </button>
            </div>
          }>
          <div className="p-5">
            <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)}
              placeholder="Ban sababi (majburiy)..."
              className="w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none" />
          </div>
        </Modal>
      )}

      {banDevice && (
        <Modal open={!!banDevice} onClose={() => { setBanDevice(null); setBanReason(''); }}
          width="md" title="Qurilmani ban qilish"
          subtitle={banDevice.length > 32 ? banDevice.slice(0, 32) + '...' : banDevice}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBanDevice(null)} disabled={banning}
                className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
                Bekor
              </button>
              <button type="button" onClick={handleBanDevice}
                disabled={banning || !banReason.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-admin px-4 py-2 text-sm font-semibold text-white shadow-lg hover:scale-[1.02] disabled:opacity-50">
                {banning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Qurilmani ban
              </button>
            </div>
          }>
          <div className="space-y-3 p-5">
            <div className="rounded-lg border border-admin-900/40 bg-admin-950/20 p-3 text-sm text-admin-200">
              ⚠️ Bu qurilmadagi <strong>barcha akkauntlar banlanadi</strong>.
              VPN ishlatsa ham, yangi Gmail ochsa ham — Oracle server bloklaydi.
            </div>
            <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)}
              placeholder="Ban sababi (majburiy)..."
              className="w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none" />
          </div>
        </Modal>
      )}
    </div>
  );
}
