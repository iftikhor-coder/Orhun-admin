import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Music, Search, Loader2, Play, Pause, Filter, RefreshCw,
  Flag, EyeOff, ChevronRight, Heart, MessageCircle, Volume2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import {
  SongDetailsModal,
  type AdminSongRow,
} from '@/components/songs/song-details-modal';
import { timeAgo, cn } from '@/lib/utils';

type FilterKey = 'all' | 'ready' | 'generating' | 'failed' | 'published' | 'unpublished' | 'flagged';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'Hammasi' },
  { key: 'ready',       label: 'Ready' },
  { key: 'generating',  label: 'Generating' },
  { key: 'failed',      label: 'Failed' },
  { key: 'published',   label: 'Published' },
  { key: 'unpublished', label: 'Unpublished' },
  { key: 'flagged',     label: 'Flagged' },
];

interface SongCounts {
  total: number;
  ready: number;
  generating: number;
  failed: number;
  published: number;
  unpublished: number;
  flagged: number;
}

export function SongsPage() {
  const [songs, setSongs] = useState<AdminSongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<AdminSongRow | null>(null);

  // Inline audio player (jadvalda Play tugmasi uchun)
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadSongs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    // songs + profiles join (RLS bilan admin barcha qoʻshiqlarni koʻradi)
    const { data, error } = await supabase
      .from('songs')
      .select(`
        id, user_id, title, prompt, audio_url, duration_seconds, status,
        is_published, is_flagged, flag_reason, flagged_at, moderation_note,
        created_at,
        profiles!user_id (email, username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      setError(error.message);
      setSongs([]);
    } else {
      const mapped: AdminSongRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        prompt: row.prompt,
        audio_url: row.audio_url,
        duration_seconds: row.duration_seconds_seconds,
        status: row.status,
        is_published: row.is_published,
        is_flagged: row.is_flagged,
        flag_reason: row.flag_reason,
        flagged_at: row.flagged_at,
        moderation_note: row.moderation_note,
        created_at: row.created_at,
        author_email: row.profiles?.email ?? null,
        author_username: row.profiles?.username ?? null,
        author_full_name: row.profiles?.full_name ?? null,
        author_avatar_url: row.profiles?.avatar_url ?? null,
      }));
      setSongs(mapped);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadSongs();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Filtrlash + qidiruv
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return songs.filter((s) => {
      // Filter
      switch (filter) {
        case 'ready':       if (s.status !== 'ready') return false; break;
        case 'generating':  if (s.status !== 'generating') return false; break;
        case 'failed':      if (s.status !== 'failed') return false; break;
        case 'published':   if (s.is_published === false) return false; break;
        case 'unpublished': if (s.is_published !== false) return false; break;
        case 'flagged':     if (!s.is_flagged) return false; break;
      }

      // Search
      if (!term) return true;
      const haystack = [
        s.title, s.prompt, s.author_email, s.author_username, s.author_full_name,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [songs, filter, search]);

  // Counts
  const counts: Record<FilterKey, number> = useMemo(() => ({
    all:         songs.length,
    ready:       songs.filter((s) => s.status === 'ready').length,
    generating:  songs.filter((s) => s.status === 'generating').length,
    failed:      songs.filter((s) => s.status === 'failed').length,
    published:   songs.filter((s) => s.is_published !== false).length,
    unpublished: songs.filter((s) => s.is_published === false).length,
    flagged:     songs.filter((s) => s.is_flagged).length,
  }), [songs]);

  // Inline play/pause
  const togglePlay = (song: AdminSongRow) => {
    if (!song.audio_url) return;

    // Avval ishlayotgan audio'ni to'xtatamiz
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId === song.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(song.audio_url);
    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };
    audioRef.current = audio;
    setPlayingId(song.id);
  };

  const handleSongUpdated = (patch: Partial<AdminSongRow>) => {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    setSelected(updated);
    setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSongDeleted = () => {
    if (!selected) return;
    setSongs((prev) => prev.filter((s) => s.id !== selected.id));
    setSelected(null);
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Music}
        title="Qoʻshiqlar moderatsiyasi"
        subtitle={`Jami: ${songs.length} ta · Flag: ${counts.flagged} · Unpublished: ${counts.unpublished}`}
        action={
          <button
            type="button"
            onClick={() => loadSongs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-300 transition-colors hover:bg-midnight-700/40 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Yangilash
          </button>
        }
      />

      {/* Filter pills + qidiruv */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                  : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
              )}
            >
              <Filter className="h-3 w-3" />
              {f.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  filter === f.key
                    ? 'bg-admin-500/30 text-admin-100'
                    : 'bg-white/5 text-gold-700',
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold-700" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sarlavha, prompt, muallif boʻyicha qidiruv..."
            className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/40 py-2 pl-9 pr-3 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none lg:w-[320px]"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          {error}
        </div>
      )}

      {/* Jadval */}
      <div className="overflow-hidden rounded-xl border border-gold-900/30 bg-midnight-900/40">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gold-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-gold-700">
            {search ? "Qidiruv boʻyicha hech narsa topilmadi" : "Qoʻshiqlar yoʻq"}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-900/30 bg-midnight-950/60 text-left text-[10px] uppercase tracking-wider text-gold-700">
                  <th className="px-3 py-3 font-semibold w-12"></th>
                  <th className="px-4 py-3 font-semibold">Qoʻshiq</th>
                  <th className="px-4 py-3 font-semibold">Muallif</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Davomiyligi</th>
                  <th className="px-4 py-3 font-semibold">Yaratilgan</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    isPlaying={playingId === song.id}
                    onTogglePlay={() => togglePlay(song)}
                    onClick={() => setSelected(song)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 text-xs text-gold-700">
          {filtered.length} ta qoʻshiq koʻrsatildi
          {filtered.length < songs.length && ` (${songs.length} dan)`}
        </div>
      )}

      {selected && (
        <SongDetailsModal
          song={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onUpdated={handleSongUpdated}
          onDeleted={handleSongDeleted}
        />
      )}
    </div>
  );
}

/* ============================================================
 *  Jadval qatori
 * =========================================================== */

function SongRow({
  song,
  isPlaying,
  onTogglePlay,
  onClick,
}: {
  song: AdminSongRow;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClick: () => void;
}) {
  const statusVariant = (() => {
    switch (song.status) {
      case 'ready':      return 'emerald';
      case 'generating': return 'amber';
      case 'failed':     return 'admin';
      default:           return 'neutral';
    }
  })() as any;

  return (
    <tr
      onClick={onClick}
      className={cn(
        "group cursor-pointer border-b border-gold-900/20 transition-colors hover:bg-midnight-800/40",
        song.is_flagged && "bg-admin-950/10",
        song.is_published === false && "opacity-60",
      )}
    >
      {/* Play tugmasi */}
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!song.audio_url}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-full transition-colors disabled:opacity-30',
            isPlaying
              ? 'bg-admin-500 text-white'
              : 'bg-gold-500/15 text-gold-300 hover:bg-gold-500/25',
          )}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" />
          )}
        </button>
      </td>

      {/* Sarlavha + prompt */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-gold-100">
                {song.title || <span className="italic text-gold-700/50">Untitled</span>}
              </span>
              {song.is_flagged && (
                <Flag className="h-3 w-3 shrink-0 text-admin-400" />
              )}
              {song.is_published === false && (
                <EyeOff className="h-3 w-3 shrink-0 text-amber-400" />
              )}
            </div>
            {song.prompt && (
              <div className="mt-0.5 line-clamp-1 text-[11px] text-gold-700">
                {song.prompt}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Muallif */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-700/40 bg-gradient-gold-soft">
            {song.author_avatar_url ? (
              <img src={song.author_avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-gold-300">
                {(song.author_full_name || song.author_email || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-gold-100">
              {song.author_full_name || '—'}
            </div>
            <div className="truncate text-[10px] text-gold-700">
              {song.author_username ? `@${song.author_username}` : song.author_email || ''}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={statusVariant}>{song.status || '—'}</Badge>
      </td>

      {/* Davomiyligi */}
      <td className="px-4 py-3 text-xs text-gold-300/80">
        {formatDuration(song.duration_seconds)}
      </td>

      {/* Yaratilgan */}
      <td className="px-4 py-3 text-xs text-gold-700">
        {timeAgo(song.created_at)}
      </td>

      {/* Arrow */}
      <td className="px-4 py-3 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-gold-700 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-300" />
      </td>
    </tr>
  );
}

function formatDuration(s: number | null): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}
