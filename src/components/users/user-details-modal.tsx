import { useState, useEffect } from 'react';
import {
  User, Music, MapPin, Settings, Shield, Ban, Sparkles, Send,
  Calendar, Mail, AtSign, Globe, Smartphone, Clock, ExternalLink,
  Loader2, Play, Pause, Check, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, timeAgo, cn } from '@/lib/utils';

export interface AdminUserRow {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  is_admin: boolean;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  credits_remaining: number | null;
  credits_reset_at: string | null;
  last_ip: string | null;
  last_country: string | null;
  last_city: string | null;
  last_sign_in_at: string | null;
  device_id: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Props {
  user: AdminUserRow;
  open: boolean;
  onClose: () => void;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
}

type Tab = 'info' | 'songs' | 'location' | 'actions';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'info',     label: "Ma'lumot",   icon: User },
  { id: 'songs',    label: "Qo'shiqlar", icon: Music },
  { id: 'location', label: 'Joylashuv',  icon: MapPin },
  { id: 'actions',  label: 'Amallar',    icon: Settings },
];

export function UserDetailsModal({ user, open, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('info');

  useEffect(() => {
    if (open) setTab('info');
  }, [open, user.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="xl"
      title={user.full_name || user.username || user.email || 'Foydalanuvchi'}
      subtitle={user.email ?? undefined}
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gold-900/30 px-5 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'info' && <InfoTab user={user} />}
        {tab === 'songs' && <SongsTab userId={user.id} />}
        {tab === 'location' && <LocationTab user={user} />}
        {tab === 'actions' && (
          <ActionsTab user={user} onUpdated={onUpdated} onClose={onClose} />
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
 *  Tab 1: Ma'lumot
 * =========================================================== */

function InfoTab({ user }: { user: AdminUserRow }) {
  const status = user.is_banned ? 'banned' : 'active';

  return (
    <div className="space-y-4">
      {/* Avatar + status */}
      <div className="flex items-center gap-4 rounded-xl border border-gold-900/30 bg-midnight-800/40 p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-gold-700/40 bg-gradient-gold-soft">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-2xl font-bold text-gold-300">
              {(user.full_name || user.email || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gold-100">
            {user.full_name || '—'}
          </h3>
          {user.username && (
            <p className="truncate text-sm text-gold-400">@{user.username}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.is_admin && (
              <Badge variant="admin" icon={<Shield className="h-3 w-3" />}>
                Administrator
              </Badge>
            )}
            {status === 'banned' && (
              <Badge variant="admin" icon={<Ban className="h-3 w-3" />}>
                Banlangan
              </Badge>
            )}
            {status === 'active' && !user.is_admin && (
              <Badge variant="emerald">Faol</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Asosiy ma'lumotlar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow icon={AtSign} label="Username" value={user.username ? `@${user.username}` : null} />
        <InfoRow icon={Calendar} label="Tug'ilgan kun" value={formatDate(user.date_of_birth)} />
        <InfoRow icon={Sparkles} label="Credit qoldig'i" value={String(user.credits_remaining ?? 0)} />
        <InfoRow icon={Clock} label="Ro'yxatdan o'tgan" value={formatDateTime(user.created_at)} />
        <InfoRow icon={Clock} label="Oxirgi kirish" value={user.last_sign_in_at ? timeAgo(user.last_sign_in_at) : '—'} />
      </div>

      {/* Ban sababi */}
      {user.is_banned && user.ban_reason && (
        <div className="rounded-lg border border-admin-900/40 bg-admin-950/30 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-admin-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ban sababi
          </div>
          <p className="mt-1 text-sm text-gold-200/80">{user.ban_reason}</p>
          {user.banned_at && (
            <p className="mt-1 text-[10px] text-gold-700">
              {formatDateTime(user.banned_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold-700">
        <Icon className="h-3 w-3 text-gold-500/70" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm text-gold-100">{value || '—'}</p>
    </div>
  );
}

/* ============================================================
 *  Tab 2: Qoʻshiqlar
 * =========================================================== */

interface UserSong {
  id: string;
  title: string;
  prompt: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  status: string | null;
  created_at: string;
}

function SongsTab({ userId }: { userId: string }) {
  const [songs, setSongs] = useState<UserSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, prompt, audio_url, duration_seconds, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) setSongs(data as UserSong[]);
      setLoading(false);
    })();

    return () => {
      if (audioEl) audioEl.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const togglePlay = (song: UserSong) => {
    if (audioEl) {
      audioEl.pause();
      setAudioEl(null);
    }
    if (playingId === song.id) {
      setPlayingId(null);
      return;
    }
    if (!song.audio_url) return;
    const audio = new Audio(song.audio_url);
    audio.play();
    audio.onended = () => setPlayingId(null);
    setAudioEl(audio);
    setPlayingId(song.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gold-700">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gold-700">
        Foydalanuvchi hali biron qo'shiq yaratmagan
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-3 text-xs text-gold-700">
        Jami: <span className="font-bold text-gold-300">{songs.length}</span> qoʻshiq
      </div>
      {songs.map((song) => (
        <div
          key={song.id}
          className="group rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3 transition-colors hover:border-gold-900/50"
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => togglePlay(song)}
              disabled={!song.audio_url}
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-30',
                playingId === song.id
                  ? 'bg-admin-500 text-white'
                  : 'bg-gold-500/20 text-gold-300 hover:bg-gold-500/30',
              )}
            >
              {playingId === song.id ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-gold-100">
                {song.title || 'Untitled'}
              </h4>
              {song.prompt && (
                <p className="mt-0.5 line-clamp-2 text-xs text-gold-700">
                  {song.prompt}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gold-700/70">
                <span>{timeAgo(song.created_at)}</span>
                {song.duration && (
                  <>
                    <span>·</span>
                    <span>
                      {Math.floor(song.duration_seconds / 60)}:
                      {String(song.duration_seconds % 60).padStart(2, '0')}
                    </span>
                  </>
                )}
                {song.status && (
                  <>
                    <span>·</span>
                    <Badge variant={song.status === 'ready' ? 'emerald' : 'amber'}>
                      {song.status}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


function LocalTime({ timezone }: { timezone: string }) {
  const [t, setT] = useState(() =>
    new Intl.DateTimeFormat('uz-UZ', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(new Date())
  );
  useEffect(() => {
    const id = setInterval(() => setT(
      new Intl.DateTimeFormat('uz-UZ', {
        timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(new Date())
    ), 1000);
    return () => clearInterval(id);
  }, [timezone]);
  return <span className="font-mono text-lg font-bold text-emerald-300">{t}</span>;
}

/* ============================================================
 *  Tab 3: Joylashuv (IP + xarita)
 * =========================================================== */

function LocationTab({ user }: { user: AdminUserRow }) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoData, setGeoData] = useState<{
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    org?: string;
    timezone?: string;
  } | null>(null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (!user.last_ip) return;
    setGeoLoading(true);
    setGeoError('');
    fetch(`https://ipapi.co/${user.last_ip}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setGeoError(data.reason || 'IP topilmadi');
        } else {
          setGeoData({
            city: data.city,
            region: data.region,
            country: data.country_name,
            latitude: data.latitude,
            longitude: data.longitude,
            org: data.org,
            timezone: data.timezone,
          });
        }
      })
      .catch((e) => setGeoError(e.message))
      .finally(() => setGeoLoading(false));
  }, [user.last_ip]);

  if (!user.last_ip) {
    return (
      <div className="py-12 text-center text-sm text-gold-700">
        IP ma'lumoti hali yozilmagan
      </div>
    );
  }

  const mapsUrl = geoData?.latitude
    ? `https://www.google.com/maps/embed/v1/place?key=DEMO_KEY&q=${geoData.latitude},${geoData.longitude}&zoom=11`
    : null;
  const mapsLink = geoData?.latitude
    ? `https://www.google.com/maps/search/?api=1&query=${geoData.latitude},${geoData.longitude}`
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow icon={Globe} label="IP manzil" value={user.last_ip} />
        <InfoRow
          icon={MapPin}
          label="Davlat / Shahar"
          value={
            geoData
              ? `${geoData.country ?? '—'}${geoData.city ? ', ' + geoData.city : ''}`
              : user.last_country ?? '—'
          }
        />
        <InfoRow
          icon={Smartphone}
          label="Qurilma ID"
          value={user.device_id?.slice(0, 32) ?? '—'}
        />
        <InfoRow
          icon={Globe}
          label="ISP / Provayder"
          value={geoData?.org ?? '—'}
        />
        {geoData?.timezone && (
          <div className="col-span-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-gold-700 mb-1">
              🕐 Mahalliy vaqt ({geoData.timezone})
            </div>
            <LocalTime timezone={geoData.timezone} />
          </div>
        )}
      </div>

      {geoLoading && (
        <div className="flex items-center justify-center py-8 text-gold-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">IP geolocation yuklanmoqda...</span>
        </div>
      )}

      {geoError && (
        <div className="rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          {geoError}
        </div>
      )}

      {geoData && geoData.latitude && (
        <div className="overflow-hidden rounded-lg border border-gold-900/30">
          <iframe
            src={`https://maps.google.com/maps?q=${geoData.latitude},${geoData.longitude}&z=10&output=embed`}
            className="h-[300px] w-full"
            title="Google Maps"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {mapsLink && (
            <a
              href={mapsLink}
              onClick={(e) => {
                e.preventDefault();
                window.electronAPI?.openExternal(mapsLink);
              }}
              className="flex items-center justify-center gap-2 border-t border-gold-900/30 bg-midnight-800/40 px-3 py-2 text-xs text-gold-300 hover:bg-midnight-700/40"
            >
              <ExternalLink className="h-3 w-3" />
              Google Maps'da to'liq ko'rish
            </a>
          )}
        </div>
      )}

      {user.user_agent && (
        <div className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gold-700">
            User Agent
          </div>
          <p className="mt-1 break-all font-mono text-[11px] text-gold-300/80">
            {user.user_agent}
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 *  Tab 4: Amallar (admin toggle, ban, credit, xabar)
 * =========================================================== */

function ActionsTab({
  user,
  onUpdated,
  onClose,
}: {
  user: AdminUserRow;
  onUpdated: (patch: Partial<AdminUserRow>) => void;
  onClose: () => void;
}) {
  const { profile: currentAdmin } = useAuth();
  const isSelf = currentAdmin?.id === user.id;

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Credit berish
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditReason, setCreditReason] = useState('');

  // Ban
  const [banReason, setBanReason] = useState('');

  // Xabar yuborish
  const [msgTitleUz, setMsgTitleUz] = useState('');
  const [msgTitleEn, setMsgTitleEn] = useState('');
  const [msgBodyUz, setMsgBodyUz] = useState('');
  const [msgBodyEn, setMsgBodyEn] = useState('');

  const clear = (cb?: () => void) => {
    setError('');
    setSuccess('');
    cb?.();
  };

  const handleToggleAdmin = async () => {
    clear();
    if (isSelf) {
      setError("O'zingizning admin huquqingizni olib tashlolmaysiz");
      return;
    }
    if (!confirm(user.is_admin ? "Admin huquqini olib tashlash?" : "Admin huquqi berish?")) return;

    setBusy('admin');
    const { data, error } = await supabase.rpc('admin_toggle_admin_role', {
      p_user_id: user.id,
    });
    setBusy(null);
    if (error) {
      setError(error.message);
    } else {
      onUpdated({ is_admin: data });
      setSuccess(data ? '✅ Admin huquqi berildi' : '✅ Admin huquqi olib tashlandi');
    }
  };

  const handleToggleBan = async () => {
    clear();
    if (isSelf) {
      setError("O'zingizni ban qila olmaysiz");
      return;
    }
    if (!user.is_banned && !banReason.trim()) {
      setError("Ban sababini kiriting");
      return;
    }
    if (!confirm(user.is_banned ? "Ban'ni olib tashlash?" : "Foydalanuvchini ban qilish?")) return;

    setBusy('ban');
    const { data, error } = await supabase.rpc('admin_toggle_ban', {
      p_user_id: user.id,
      p_reason: banReason || null,
    });
    setBusy(null);
    if (error) {
      setError(error.message);
    } else {
      onUpdated({
        is_banned: data,
        ban_reason: data ? banReason : null,
        banned_at: data ? new Date().toISOString() : null,
      });
      setBanReason('');
      setSuccess(data ? '✅ Foydalanuvchi banlandi' : '✅ Ban olib tashlandi');
    }
  };

  const handleGrantCredits = async () => {
    clear();
    if (creditAmount === 0) {
      setError("0 dan boshqa son kiriting");
      return;
    }
    setBusy('credits');
    const { data, error } = await supabase.rpc('admin_grant_credits', {
      p_user_id: user.id,
      p_amount: creditAmount,
      p_reason: creditReason || null,
    });
    setBusy(null);
    if (error) {
      setError(error.message);
    } else {
      onUpdated({ credits_remaining: data });
      setCreditReason('');
      setSuccess(`✅ ${creditAmount > 0 ? '+' : ''}${creditAmount} credit. Yangi qoldiq: ${data}`);
    }
  };

  const handleSendMessage = async () => {
    clear();
    if (!msgTitleUz.trim() || !msgBodyUz.trim()) {
      setError("Kamida UZ sarlavha va matn kerak");
      return;
    }
    setBusy('msg');
    const { error } = await supabase.rpc('admin_send_user_notification', {
      p_user_id: user.id,
      p_title_uz: msgTitleUz,
      p_title_en: msgTitleEn || msgTitleUz,
      p_title_ru: msgTitleUz,
      p_title_tr: msgTitleUz,
      p_message_uz: msgBodyUz,
      p_message_en: msgBodyEn || msgBodyUz,
      p_message_ru: msgBodyUz,
      p_message_tr: msgBodyUz,
      p_type: 'admin_announcement',
      p_action_url: null,
    });
    setBusy(null);
    if (error) {
      setError(error.message);
    } else {
      setMsgTitleUz('');
      setMsgTitleEn('');
      setMsgBodyUz('');
      setMsgBodyEn('');
      setSuccess('✅ Xabar yuborildi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Xabar bo'limi */}
      {error && (
        <div className="rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Admin toggle */}
      <ActionCard
        icon={Shield}
        title={user.is_admin ? "Admin huquqini olib tashlash" : "Admin qilish"}
        description={
          user.is_admin
            ? "Bu foydalanuvchi admin panelga kira olmaydi"
            : "Bu foydalanuvchi admin panelga kira oladi"
        }
        variant={user.is_admin ? 'admin' : 'gold'}
        disabled={isSelf}
        loading={busy === 'admin'}
        buttonLabel={user.is_admin ? "Admin'ni olib tashlash" : "Admin qilish"}
        onAction={handleToggleAdmin}
      />

      {/* Ban */}
      <ActionCard
        icon={Ban}
        title={user.is_banned ? "Ban'ni olib tashlash" : "Ban qilish"}
        description={
          user.is_banned
            ? "Foydalanuvchi yana saytdan foydalana oladi"
            : "Foydalanuvchi saytdan foydalanolmaydi"
        }
        variant="admin"
        disabled={isSelf}
        loading={busy === 'ban'}
        buttonLabel={user.is_banned ? "Ban'ni olib tashlash" : "Ban qilish"}
        onAction={handleToggleBan}
      >
        {!user.is_banned && (
          <input
            type="text"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Ban sababi (majburiy)..."
            className="mt-2 w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none"
          />
        )}
      </ActionCard>

      {/* Credit berish */}
      <ActionCard
        icon={Sparkles}
        title="Credit berish"
        description={`Hozirgi qoldiq: ${user.credits_remaining ?? 0} credit`}
        variant="gold"
        loading={busy === 'credits'}
        buttonLabel="Credit berish"
        onAction={handleGrantCredits}
      >
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={creditAmount}
            onChange={(e) => setCreditAmount(parseInt(e.target.value, 10) || 0)}
            className="w-24 rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 focus:border-gold-500/60 focus:outline-none"
            placeholder="10"
          />
          <input
            type="text"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            placeholder="Sabab (ixtiyoriy)..."
            className="flex-1 rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-gold-500/60 focus:outline-none"
          />
        </div>
        <p className="mt-1 text-[11px] text-gold-700">
          Manfiy son ham mumkin (credit olib tashlash). Foydalanuvchiga avtomatik notification yuboriladi.
        </p>
      </ActionCard>

      {/* Maxsus xabar */}
      <ActionCard
        icon={Send}
        title="Maxsus xabar yuborish"
        description="Foydalanuvchiga 4 tilda notification (UZ majburiy)"
        variant="blue"
        loading={busy === 'msg'}
        buttonLabel="Xabar yuborish"
        onAction={handleSendMessage}
      >
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={msgTitleUz}
            onChange={(e) => setMsgTitleUz(e.target.value)}
            placeholder="Sarlavha (UZ) — majburiy"
            className="w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-blue-500/60 focus:outline-none"
          />
          <input
            type="text"
            value={msgTitleEn}
            onChange={(e) => setMsgTitleEn(e.target.value)}
            placeholder="Title (EN) — optional, defaults to UZ"
            className="w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-blue-500/60 focus:outline-none"
          />
          <textarea
            value={msgBodyUz}
            onChange={(e) => setMsgBodyUz(e.target.value)}
            placeholder="Matn (UZ) — majburiy"
            rows={2}
            className="w-full resize-none rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-blue-500/60 focus:outline-none"
          />
          <textarea
            value={msgBodyEn}
            onChange={(e) => setMsgBodyEn(e.target.value)}
            placeholder="Message (EN) — optional"
            rows={2}
            className="w-full resize-none rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-blue-500/60 focus:outline-none"
          />
        </div>
      </ActionCard>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  variant: 'gold' | 'admin' | 'blue';
  disabled?: boolean;
  loading?: boolean;
  buttonLabel: string;
  onAction: () => void;
  children?: React.ReactNode;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  variant,
  disabled,
  loading,
  buttonLabel,
  onAction,
  children,
}: ActionCardProps) {
  const btnClasses = {
    gold:  'bg-gradient-gold text-midnight-950 hover:scale-[1.02]',
    admin: 'bg-gradient-admin text-white hover:scale-[1.02]',
    blue:  'bg-blue-500 text-white hover:bg-blue-400',
  };

  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-800/40 p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1',
            variant === 'gold' && 'bg-gold-500/10 text-gold-300 ring-gold-500/30',
            variant === 'admin' && 'bg-admin-500/10 text-admin-300 ring-admin-500/30',
            variant === 'blue' && 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gold-100">{title}</h4>
          <p className="mt-0.5 text-xs text-gold-700">{description}</p>
          {children}
          <button
            type="button"
            onClick={onAction}
            disabled={disabled || loading}
            className={cn(
              'mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              btnClasses[variant],
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {buttonLabel}
          </button>
          {disabled && (
            <p className="mt-1 text-[10px] text-amber-400">
              ⚠️ O'zingizga nisbatan bu amalni qilolmaysiz
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
