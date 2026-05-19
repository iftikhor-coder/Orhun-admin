import { useState, useEffect, useRef } from 'react';
import {
  Music, Play, Pause, Loader2, Clock, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { timeAgo, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Song {
  id: string;
  title: string | null;
  status: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  is_published: boolean | null;
  is_flagged: boolean | null;
}

interface Props {
  userId: string;
}

const STATUS_COLOR: Record<string, string> = {
  ready:      'emerald',
  generating: 'amber',
  failed:     'admin',
  published:  'blue',
};

function formatDuration(secs: number | null): string {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function UserSongsTab({ userId }: Props) {
  const [songs,    setSongs]    = useState<Song[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [playing,  setPlaying]  = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('id,title,status,audio_url,duration_seconds,created_at,is_published,is_flagged')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setSongs((data as Song[]) ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Xato');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // Audio boshqaruv
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (song: Song) => {
    if (!song.audio_url) return;

    // Xuddi shu qo'shiq — pauza
    if (playing === song.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    // Boshqa qo'shiq o'ynayotgan bo'lsa to'xtatamiz
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(song.audio_url);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress(prev => ({
          ...prev,
          [song.id]: (audio.currentTime / audio.duration) * 100,
        }));
      }
    });

    audio.addEventListener('ended', () => {
      setPlaying(null);
      setProgress(prev => ({ ...prev, [song.id]: 0 }));
    });

    audio.play().catch(() => setError('Audio o\'ynashda xato'));
    setPlaying(song.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gold-700">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-admin-900/40 bg-admin-950/20 px-3 py-3 text-sm text-admin-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
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
    <div className="space-y-1">
      <div className="mb-2 text-xs text-gold-700">
        Jami: <span className="font-semibold text-gold-300">{songs.length}</span> ta qo'shiq
      </div>

      {songs.map(song => {
        const isPlaying = playing === song.id;
        const prog      = progress[song.id] ?? 0;
        const canPlay   = !!song.audio_url;

        return (
          <div key={song.id}
            className="group flex items-center gap-3 rounded-xl border border-gold-900/20 bg-midnight-800/40 px-3 py-2.5 hover:bg-midnight-700/40 transition-colors">

            {/* Play button */}
            <button
              type="button"
              onClick={() => togglePlay(song)}
              disabled={!canPlay}
              className={cn(
                'relative grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all',
                canPlay
                  ? 'bg-gradient-gold text-midnight-950 hover:scale-105'
                  : 'bg-midnight-700/60 text-gold-700 cursor-not-allowed',
              )}
            >
              {isPlaying
                ? <Pause className="h-4 w-4" />
                : <Play  className="h-4 w-4 ml-0.5" />}

              {/* Progress ring */}
              {isPlaying && (
                <svg className="absolute inset-0 h-9 w-9 -rotate-90">
                  <circle cx="18" cy="18" r="16"
                    fill="none" stroke="rgba(245,179,66,0.3)" strokeWidth="2" />
                  <circle cx="18" cy="18" r="16"
                    fill="none" stroke="#f5b342" strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - prog / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            {/* Ma'lumot */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-medium text-gold-100">
                  {song.title ?? 'Untitled'}
                </span>
                {song.is_flagged && (
                  <span className="rounded bg-admin-500/20 px-1 py-0.5 text-[9px] font-bold uppercase text-admin-300">
                    Flagged
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gold-700">
                <Clock className="h-3 w-3" />
                {formatDuration(song.duration_seconds)}
                <span>·</span>
                {timeAgo(song.created_at)}
              </div>
            </div>

            {/* Status */}
            <Badge variant={(STATUS_COLOR[song.status ?? ''] ?? 'neutral') as any}>
              {song.status ?? '—'}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
