import { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle, Loader2, Send, Check, Filter, RefreshCw,
  AlertCircle, Bug, Sparkles, Frown, MessageSquare,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, timeAgo, cn } from '@/lib/utils';

type FStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
type FType   = 'general' | 'bug' | 'feature' | 'complaint';

interface FeedbackRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  subject: string | null;
  message: string;
  type: FType;
  status: FStatus;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

const TYPE_META: Record<FType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string; color: string;
}> = {
  general:   { icon: MessageSquare, label: 'Umumiy',         color: 'neutral' },
  bug:       { icon: Bug,           label: 'Xatolik',        color: 'admin'   },
  feature:   { icon: Sparkles,      label: 'Yangi imkoniyat',color: 'blue'    },
  complaint: { icon: Frown,         label: 'Shikoyat',       color: 'amber'   },
};

const STATUS_META: Record<FStatus, { label: string; color: string }> = {
  new:         { label: 'Yangi',         color: 'admin'   },
  in_progress: { label: 'Jarayonda',    color: 'amber'   },
  resolved:    { label: 'Hal qilingan', color: 'emerald' },
  closed:      { label: 'Yopilgan',     color: 'neutral' },
};

const FILTERS: { key: FStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'Hammasi'      },
  { key: 'new',         label: 'Yangi'        },
  { key: 'in_progress', label: 'Jarayonda'   },
  { key: 'resolved',    label: 'Hal qilingan'},
  { key: 'closed',      label: 'Yopilgan'    },
];

export function FeedbackTab() {
  const [items,    setItems]    = useState<FeedbackRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FStatus | 'all'>('all');
  const [selected, setSelected] = useState<FeedbackRow | null>(null);
  const [response, setResponse] = useState('');
  const [rStatus,  setRStatus]  = useState<FStatus>('resolved');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setItems((data as FeedbackRow[]) ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    filter === 'all' ? items : items.filter(f => f.status === filter),
    [items, filter]
  );

  const counts = useMemo(() => ({
    all:         items.length,
    new:         items.filter(f => f.status === 'new').length,
    in_progress: items.filter(f => f.status === 'in_progress').length,
    resolved:    items.filter(f => f.status === 'resolved').length,
    closed:      items.filter(f => f.status === 'closed').length,
  }), [items]);

  const open = (fb: FeedbackRow) => {
    setSelected(fb);
    setResponse(fb.admin_response ?? "");
    setRStatus(fb.status === 'new' ? 'resolved' : fb.status);
    setError('');
  };

  const handleSend = async () => {
    if (!selected || !response.trim()) return;
    setSending(true); setError('');
    try {
      const { error } = await supabase.rpc('admin_respond_feedback', {
        p_feedback_id: selected.id,
        p_response: response.trim(),
        p_status: rStatus,
      });
      if (error) throw error;
      setSuccess('✅ Javob yuborildi — foydalanuvchiga notification jonatildi');
      setTimeout(() => setSuccess(''), 4000);
      setItems(prev => prev.map(f =>
        f.id === selected.id
          ? { ...f, admin_response: response.trim(), responded_at: new Date().toISOString(), status: rStatus }
          : f
      ));
      setSelected(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-900/40 bg-blue-950/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-blue-400" />
          <div>
            <div className="text-sm font-semibold text-blue-300">Foydalanuvchi xabarlari</div>
            <div className="text-[10px] text-gold-700">
              Yangi: <span className="font-bold text-admin-300">{counts.new}</span> ·
              Jarayonda: {counts.in_progress}
            </div>
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-xs text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50">
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
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
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.key
                ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
            )}>
            <Filter className="h-3 w-3" />
            {f.label}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              filter === f.key ? 'bg-admin-500/30 text-admin-100' : 'bg-white/5 text-gold-700',
            )}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gold-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold-900/40 bg-midnight-900/30 py-12 text-center text-sm text-gold-700">
          Feedback yoʻq
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(fb => {
            const tm = TYPE_META[fb.type] || TYPE_META.general;
            const sm = STATUS_META[fb.status] || STATUS_META.new;
            const TIcon = tm.icon;
            return (
              <button key={fb.id} type="button" onClick={() => open(fb)}
                className={cn(
                  'group block w-full rounded-xl border p-4 text-left transition-all',
                  fb.status === 'new'
                    ? 'border-admin-500/40 bg-admin-950/10 hover:bg-admin-950/20'
                    : 'border-gold-900/30 bg-midnight-900/40 hover:bg-midnight-800/40',
                )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1',
                    tm.color === 'admin'   && 'bg-admin-500/10 text-admin-300 ring-admin-500/30',
                    tm.color === 'blue'    && 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
                    tm.color === 'amber'   && 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
                    tm.color === 'neutral' && 'bg-white/5 text-gold-300 ring-white/10',
                  )}>
                    <TIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant={tm.color as any}>{tm.label}</Badge>
                      <Badge variant={sm.color as any}>{sm.label}</Badge>
                      <span className="text-[10px] text-gold-700">· {timeAgo(fb.created_at)}</span>
                    </div>
                    {fb.subject && <div className="font-medium text-gold-100">{fb.subject}</div>}
                    <p className="mt-0.5 line-clamp-2 text-xs text-gold-300/80">{fb.message}</p>
                    <div className="mt-1 text-[10px] text-gold-700">
                      {fb.user_email || fb.user_id || '—'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Javob modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} width="lg"
          title={selected.subject || 'Feedback'}
          subtitle={`${selected.user_email || selected.user_id} · ${formatDateTime(selected.created_at)}`}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} disabled={sending}
                className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
                Yopish
              </button>
              <button type="button" onClick={handleSend} disabled={sending || !response.trim()}
                className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-midnight-950 hover:scale-[1.02] disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Javob yuborish
              </button>
            </div>
          }>
          <div className="space-y-4 p-5">
            {/* Foydalanuvchi xabari */}
            <div className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge variant={TYPE_META[selected.type]?.color as any}>
                  {TYPE_META[selected.type]?.label}
                </Badge>
                <Badge variant={STATUS_META[selected.status]?.color as any}>
                  {STATUS_META[selected.status]?.label}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gold-200">{selected.message}</p>
            </div>

            {/* Avvalgi javob */}
            {selected.admin_response && (
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Check className="h-3.5 w-3.5" />
                  Avvalgi javob
                  {selected.responded_at && ` (${timeAgo(selected.responded_at)})`}
                </div>
                <p className="whitespace-pre-wrap text-sm text-gold-200">{selected.admin_response}</p>
              </div>
            )}

            {/* Yangi javob */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gold-200">Javob matni</label>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={5}
                placeholder="Foydalanuvchi notification orqali bu javobni oladi..."
                className="w-full resize-none rounded-md border border-gold-900/40 bg-midnight-900/60 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-gold-500/60 focus:outline-none" />
            </div>

            {/* Holat tanlash */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gold-200">Yangi holat</label>
              <div className="flex gap-1.5">
                {(['in_progress', 'resolved', 'closed'] as FStatus[]).map(s => (
                  <button key={s} type="button" onClick={() => setRStatus(s)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      rStatus === s
                        ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                        : 'bg-midnight-800/40 text-gold-300/70 hover:bg-midnight-700/40',
                    )}>
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
                {error}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
