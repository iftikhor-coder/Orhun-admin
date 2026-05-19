import { useState, useEffect } from 'react';
import {
  Music, Heart, MessageCircle, Settings, User, Clock, Calendar,
  Loader2, AlertTriangle, EyeOff, Eye, Trash2, Flag, Check,
  AlertCircle, Play, Pause, Download, Volume2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, timeAgo, cn } from '@/lib/utils';

export interface AdminSongRow {
  id: string;
  user_id: string;
  title: string | null;
  prompt: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  status: string | null;
  is_published: boolean | null;
  is_flagged: boolean | null;
  flag_reason: string | null;
  flagged_at: string | null;
  moderation_note: string | null;
  created_at: string;
  // Joined profile
  author_email?: string | null;
  author_username?: string | null;
  author_full_name?: string | null;
  author_avatar_url?: string | null;
}

interface Props {
  song: AdminSongRow;
  open: boolean;
  onClose: () => void;
  onUpdated: (patch: Partial<AdminSongRow>) => void;
  onDeleted: () => void;
}

type Tab = 'info' | 'likes' | 'comments' | 'actions';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'info',     label: "Ma'lumot",  icon: Music },
  { id: 'likes',    label: "Like'lar",  icon: Heart },
  { id: 'comments', label: "Komment'lar", icon: MessageCircle },
  { id: 'actions',  label: 'Amallar',   icon: Settings },
];

export function SongDetailsModal({ song, open, onClose, onUpdated, onDeleted }: Props) {
  const [tab, setTab] = useState<Tab>('info');

  useEffect(() => {
    if (open) setTab('info');
  }, [open, song.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="xl"
      title={song.title || 'Untitled'}
      subtitle={song.author_email || song.author_username || song.user_id}
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
        {tab === 'info' && <InfoTab song={song} />}
        {tab === 'likes' && <LikesTab songId={song.id} />}
        {tab === 'comments' && <CommentsTab songId={song.id} />}
        {tab === 'actions' && (
          <ActionsTab song={song} onUpdated={onUpdated} onDeleted={onDeleted} onClose={onClose} />
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
 *  Tab 1: Ma'lumot
 * =========================================================== */

function InfoTab({ song }: { song: AdminSongRow }) {
  return (
    <div className="space-y-4">
      {/* Audio player */}
      {song.audio_url && (
        <div className="rounded-xl border border-gold-900/30 bg-midnight-800/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gold-700">
            <Volume2 className="h-3 w-3" />
            Audio preview
          </div>
          <audio controls src={song.audio_url} className="w-full" />
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 rounded-xl border border-gold-900/30 bg-midnight-800/40 p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
          {song.author_avatar_url ? (
            <img src={song.author_avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-lg font-bold text-gold-300">
              {(song.author_full_name || song.author_email || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-gold-700">Muallif</div>
          <div className="truncate text-sm font-semibold text-gold-100">
            {song.author_full_name || '—'}
          </div>
          <div className="truncate text-xs text-gold-400">
            {song.author_username ? `@${song.author_username}` : song.author_email}
          </div>
        </div>
      </div>

      {/* Status badge'lari */}
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={song.status} />
        {song.is_published === false && (
          <Badge variant="amber" icon={<EyeOff className="h-3 w-3" />}>
            Unpublished
          </Badge>
        )}
        {song.is_flagged && (
          <Badge variant="admin" icon={<Flag className="h-3 w-3" />}>
            Flagged
          </Badge>
        )}
      </div>

      {/* Asosiy ma'lumotlar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow icon={Music} label="Sarlavha" value={song.title} />
        <InfoRow icon={Clock} label="Davomiyligi" value={formatDuration(song.duration_seconds_seconds)} />
        <InfoRow icon={Calendar} label="Yaratilgan" value={formatDateTime(song.created_at)} />
        <InfoRow icon={Music} label="Status" value={song.status} />
      </div>

      {/* Prompt */}
      {song.prompt && (
        <div className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-gold-700">
            Prompt
          </div>
          <p className="whitespace-pre-wrap text-sm text-gold-200/90">{song.prompt}</p>
        </div>
      )}

      {/* Flag info */}
      {song.is_flagged && song.flag_reason && (
        <div className="rounded-lg border border-admin-900/40 bg-admin-950/30 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-admin-300">
            <Flag className="h-3.5 w-3.5" />
            Flag sababi (yashirin marker)
          </div>
          <p className="mt-1 text-sm text-gold-200/80">{song.flag_reason}</p>
          {song.flagged_at && (
            <p className="mt-1 text-[10px] text-gold-700">
              {formatDateTime(song.flagged_at)}
            </p>
          )}
        </div>
      )}

      {/* Moderation note */}
      {song.moderation_note && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Moderatsiya izohi
          </div>
          <p className="mt-1 text-sm text-gold-200/80">{song.moderation_note}</p>
        </div>
      )}

      {/* Download tugmasi */}
      {song.audio_url && (
        <a
          href={song.audio_url}
          download
          onClick={(e) => {
            e.preventDefault();
            window.electronAPI?.openExternal(song.audio_url!);
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-xs text-gold-300 transition-colors hover:bg-midnight-700/40"
        >
          <Download className="h-3.5 w-3.5" />
          Audio faylni ko'chirib olish
        </a>
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

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge>—</Badge>;
  const variant = (() => {
    switch (status) {
      case 'ready':      return 'emerald';
      case 'generating': return 'amber';
      case 'failed':     return 'admin';
      case 'published':  return 'blue';
      default:           return 'neutral';
    }
  })() as any;
  return <Badge variant={variant}>{status}</Badge>;
}

function formatDuration(s: number | null): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/* ============================================================
 *  Tab 2: Like'lar
 * =========================================================== */

interface LikeRow {
  id: string;
  user_id: string;
  created_at: string;
  liker_email?: string | null;
  liker_username?: string | null;
  liker_full_name?: string | null;
  liker_avatar_url?: string | null;
}

function LikesTab({ songId }: { songId: string }) {
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Likes jadval nomi: 'likes' yoki 'song_likes' deb taxmin
      const { data } = await supabase
        .from('likes')
        .select('id, user_id, created_at, profiles(email, username, full_name, avatar_url)')
        .eq('song_id', songId)
        .order('created_at', { ascending: false })
        .limit(200);

      const mapped: LikeRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        created_at: row.created_at,
        liker_email: row.profiles?.email ?? null,
        liker_username: row.profiles?.username ?? null,
        liker_full_name: row.profiles?.full_name ?? null,
        liker_avatar_url: row.profiles?.avatar_url ?? null,
      }));
      setLikes(mapped);
      setLoading(false);
    })();
  }, [songId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gold-700">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gold-700">
        Hech kim like qoʻymagan
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-xs text-gold-700">
        Jami: <span className="font-bold text-gold-300">{likes.length}</span> ta like
      </div>
      <div className="space-y-1.5">
        {likes.map((like) => (
          <div
            key={like.id}
            className="flex items-center gap-3 rounded-lg border border-gold-900/30 bg-midnight-800/40 p-2.5"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
              {like.liker_avatar_url ? (
                <img src={like.liker_avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gold-300">
                  {(like.liker_full_name || like.liker_email || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gold-100">
                {like.liker_full_name || '—'}
              </div>
              <div className="truncate text-xs text-gold-700">
                {like.liker_username ? `@${like.liker_username}` : like.liker_email || '—'}
              </div>
            </div>
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <span className="text-xs text-gold-700">{timeAgo(like.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 *  Tab 3: Komment'lar
 * =========================================================== */

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  commenter_email?: string | null;
  commenter_username?: string | null;
  commenter_full_name?: string | null;
  commenter_avatar_url?: string | null;
}

function CommentsTab({ songId }: { songId: string }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('comments')
        .select('id, user_id, content, created_at, profiles(email, username, full_name, avatar_url)')
        .eq('song_id', songId)
        .order('created_at', { ascending: false })
        .limit(200);

      const mapped: CommentRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        commenter_email: row.profiles?.email ?? null,
        commenter_username: row.profiles?.username ?? null,
        commenter_full_name: row.profiles?.full_name ?? null,
        commenter_avatar_url: row.profiles?.avatar_url ?? null,
      }));
      setComments(mapped);
      setLoading(false);
    })();
  }, [songId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gold-700">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gold-700">
        Hali komment yo'q
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-xs text-gold-700">
        Jami: <span className="font-bold text-gold-300">{comments.length}</span> ta komment
      </div>
      <div className="space-y-2">
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
                {c.commenter_avatar_url ? (
                  <img src={c.commenter_avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gold-300">
                    {(c.commenter_full_name || c.commenter_email || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gold-100">
                  {c.commenter_full_name || '—'}
                </div>
                <div className="truncate text-xs text-gold-700">
                  {c.commenter_username ? `@${c.commenter_username}` : c.commenter_email} · {timeAgo(c.created_at)}
                </div>
              </div>
            </div>
            <p className="whitespace-pre-wrap pl-11 text-sm text-gold-200/90">
              {c.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 *  Tab 4: Amallar (unpublish, delete, flag)
 * =========================================================== */

function ActionsTab({
  song,
  onUpdated,
  onDeleted,
  onClose,
}: {
  song: AdminSongRow;
  onUpdated: (patch: Partial<AdminSongRow>) => void;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [unpublishReason, setUnpublishReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [flagReason, setFlagReason] = useState('');

  const clear = () => {
    setError('');
    setSuccess('');
  };

  const handleUnpublish = async () => {
    clear();
    if (song.is_published !== false && !unpublishReason.trim()) {
      setError("Unpublish sababini kiriting");
      return;
    }
    if (!confirm(
      song.is_published === false
        ? "Qoʻshiqni yana publish qilish?"
        : "Qoʻshiqni unpublish qilish?"
    )) return;

    setBusy('unpublish');
    const { data, error } = await supabase.rpc('admin_unpublish_song', {
      p_song_id: song.id,
      p_reason: unpublishReason || null,
    });
    setBusy(null);

    if (error) {
      setError(error.message);
    } else {
      onUpdated({
        is_published: data,
        moderation_note: data === false ? unpublishReason : song.moderation_note,
      });
      setUnpublishReason('');
      setSuccess(data ? '✅ Qoʻshiq yana publish qilindi' : '✅ Qoʻshiq unpublish qilindi');
    }
  };

  const handleFlag = async () => {
    clear();
    if (!song.is_flagged && !flagReason.trim()) {
      setError("Flag sababini kiriting");
      return;
    }

    setBusy('flag');
    const { data, error } = await supabase.rpc('admin_flag_song', {
      p_song_id: song.id,
      p_reason: flagReason || null,
    });
    setBusy(null);

    if (error) {
      setError(error.message);
    } else {
      onUpdated({
        is_flagged: data,
        flag_reason: data ? flagReason : null,
        flagged_at: data ? new Date().toISOString() : null,
      });
      setFlagReason('');
      setSuccess(data ? "🚩 Yashirin marker qo'yildi" : '✅ Marker olib tashlandi');
    }
  };

  const handleForceDelete = async () => {
    clear();
    if (!deleteReason.trim()) {
      setError("O'chirish sababini kiriting (foydalanuvchiga yuboriladi)");
      return;
    }
    if (!confirm(
      `"${song.title || 'Untitled'}" qoʻshig'i to'liq o'chiriladi. Davom etamizmi?`
    )) return;

    setBusy('delete');
    const { error } = await supabase.rpc('admin_force_delete_song', {
      p_song_id: song.id,
      p_reason: deleteReason,
    });
    setBusy(null);

    if (error) {
      setError(error.message);
    } else {
      onDeleted();
      onClose();
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Unpublish */}
      <ActionCard
        icon={song.is_published === false ? Eye : EyeOff}
        title={song.is_published === false ? 'Qaytadan publish qilish' : 'Unpublish (yashirish)'}
        description={
          song.is_published === false
            ? 'Qoʻshiq yana sayt va boshqalar uchun koʻrinadi'
            : 'Qoʻshiq sayt va boshqalar uchun yashirin boʻladi (egasi koʻra oladi)'
        }
        variant="amber"
        loading={busy === 'unpublish'}
        buttonLabel={song.is_published === false ? 'Publish qilish' : 'Unpublish'}
        onAction={handleUnpublish}
      >
        {song.is_published !== false && (
          <input
            type="text"
            value={unpublishReason}
            onChange={(e) => setUnpublishReason(e.target.value)}
            placeholder="Sabab (foydalanuvchiga yuboriladi)..."
            className="mt-2 w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-amber-500/60 focus:outline-none"
          />
        )}
      </ActionCard>

      {/* Flag inappropriate */}
      <ActionCard
        icon={Flag}
        title={song.is_flagged ? 'Markerni olib tashlash' : 'Flag inappropriate (yashirin)'}
        description={
          song.is_flagged
            ? 'Yashirin marker olib tashlanadi'
            : "Yashirin marker — faqat adminlar ko'radi, foydalanuvchiga xabar yo'q"
        }
        variant="admin"
        loading={busy === 'flag'}
        buttonLabel={song.is_flagged ? 'Markerni olib tashlash' : 'Flag qoʻyish'}
        onAction={handleFlag}
      >
        {!song.is_flagged && (
          <input
            type="text"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Yashirin sabab (faqat adminlar ko'radi)..."
            className="mt-2 w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none"
          />
        )}
      </ActionCard>

      {/* Force delete */}
      <ActionCard
        icon={Trash2}
        title="Force delete (butunlay oʻchirish)"
        description="Qoʻshiq DB'dan butunlay oʻchadi va egasiga notification yuboriladi"
        variant="admin"
        loading={busy === 'delete'}
        buttonLabel="Butunlay oʻchirish"
        onAction={handleForceDelete}
        danger
      >
        <input
          type="text"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="Sabab (majburiy, foydalanuvchiga yuboriladi)..."
          className="mt-2 w-full rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none"
        />
      </ActionCard>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  variant: 'gold' | 'admin' | 'amber';
  loading?: boolean;
  buttonLabel: string;
  onAction: () => void;
  danger?: boolean;
  children?: React.ReactNode;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  variant,
  loading,
  buttonLabel,
  onAction,
  danger,
  children,
}: ActionCardProps) {
  const btnClasses = {
    gold:  'bg-gradient-gold text-midnight-950 hover:scale-[1.02]',
    admin: 'bg-gradient-admin text-white hover:scale-[1.02]',
    amber: 'bg-amber-500 text-midnight-950 hover:bg-amber-400',
  };

  return (
    <div className={cn(
      'rounded-xl border p-4',
      danger
        ? 'border-admin-900/40 bg-admin-950/10'
        : 'border-gold-900/30 bg-midnight-800/40',
    )}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1',
            variant === 'gold' && 'bg-gold-500/10 text-gold-300 ring-gold-500/30',
            variant === 'admin' && 'bg-admin-500/10 text-admin-300 ring-admin-500/30',
            variant === 'amber' && 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
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
            disabled={loading}
            className={cn(
              'mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              btnClasses[variant],
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            )}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
