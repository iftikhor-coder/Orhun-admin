import { useState, useEffect, useMemo } from 'react';
import {
  Tags, Plus, Edit3, Trash2, Loader2, RefreshCw, Check, AlertCircle,
  GripVertical, Wand2, Eye, EyeOff, Save, X, Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { GenreEditorModal, type Genre } from '@/components/genres/genre-editor-modal';
import { cn, timeAgo } from '@/lib/utils';

type Lang = 'uz' | 'en' | 'tr' | 'az';

const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: 'uz', label: 'UZ', flag: 'https://flagcdn.com/w20/uz.png' },
  { value: 'en', label: 'EN', flag: 'https://flagcdn.com/w20/gb.png' },
  { value: 'tr', label: 'TR', flag: 'https://flagcdn.com/w20/tr.png' },
  { value: 'az', label: 'AZ', flag: 'https://flagcdn.com/w20/az.png' },
];

export function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<Lang>('uz');

  const [editorGenre, setEditorGenre] = useState<Genre | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drag-and-drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);

  const loadGenres = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    const { data, error } = await supabase
      .from('genres').select('*').order('sort_order', { ascending: true });
    if (error) { setError(error.message); } else {
      setGenres((data as Genre[]) ?? []);
      setOrderChanged(false);
    }
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { loadGenres(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return genres;
    return genres.filter((g) => {
      const h = [g.slug, g.name_uz, g.name_en, g.name_tr, g.name_az,
        g.description_uz, g.description_en, g.description_tr, g.description_az]
        .filter(Boolean).join(' ').toLowerCase();
      return h.includes(term);
    });
  }, [genres, search]);

  const showSuccess = (msg: string) => {
    setSuccess(msg); setTimeout(() => setSuccess(''), 4000);
  };

  const handleSaved = (saved: Genre) => {
    setGenres((prev) => {
      const idx = prev.findIndex((g) => g.id === saved.id);
      if (idx >= 0) { const c = [...prev]; c[idx] = saved; return c; }
      return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order);
    });
    showSuccess(`✅ Janr "${saved.name_uz}" saqlandi`);
  };

  const handleToggleActive = async (genre: Genre) => {
    const next = !genre.is_active;
    setGenres((prev) => prev.map((g) => g.id === genre.id ? { ...g, is_active: next } : g));
    const { error } = await supabase.from('genres').update({ is_active: next }).eq('id', genre.id!);
    if (error) {
      setError(error.message);
      setGenres((prev) => prev.map((g) => g.id === genre.id ? { ...g, is_active: !next } : g));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    const { error } = await supabase.from('genres').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) { setError(error.message); setDeleteTarget(null); return; }
    setGenres((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    showSuccess(`✅ "${deleteTarget.name_uz}" oʻchirildi`);
    setDeleteTarget(null);
  };

  // Drag-and-drop
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) setDragOverId(id);
  };
  const handleDragLeave = () => setDragOverId(null);
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }
    setGenres((prev) => {
      const next = [...prev];
      const from = next.findIndex((g) => g.id === draggedId);
      const to = next.findIndex((g) => g.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedId(null); setDragOverId(null); setOrderChanged(true);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  const saveOrder = async () => {
    setReordering(true); setError('');
    const { error } = await supabase.rpc('admin_reorder_genres', {
      p_ordered_ids: genres.map((g) => g.id!),
    });
    setReordering(false);
    if (error) { setError(error.message); return; }
    setGenres((prev) => prev.map((g, i) => ({ ...g, sort_order: i + 1 })));
    setOrderChanged(false);
    showSuccess('✅ Tartib saqlandi');
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Tags}
        title="Janrlar boshqaruvi"
        subtitle="4 til (UZ/EN/TR/AZ), hybrid prompt, sort order"
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => loadGenres(true)} disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-300 hover:bg-midnight-700/40 disabled:opacity-50">
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              Yangilash
            </button>
            <button type="button" onClick={() => { setEditorGenre(null); setEditorOpen(true); }}
              className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-midnight-950 shadow-lg hover:scale-[1.02]">
              <Plus className="h-4 w-4" />Yangi janr
            </button>
          </div>
        }
      />

      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Tartib o'zgardi banneri */}
      {orderChanged && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-200">
            <GripVertical className="h-4 w-4" />Tartib o'zgartirildi. Saqlanmagan.
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => loadGenres(true)} disabled={reordering}
              className="flex items-center gap-1.5 rounded-md bg-midnight-700/40 px-3 py-1.5 text-xs text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
              <X className="h-3 w-3" />Bekor
            </button>
            <button type="button" onClick={saveOrder} disabled={reordering}
              className="flex items-center gap-1.5 rounded-md bg-gradient-gold px-3 py-1.5 text-xs font-semibold text-midnight-950 hover:scale-[1.02] disabled:opacity-50">
              {reordering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Saqlash
            </button>
          </div>
        </div>
      )}

      {/* Til + qidiruv */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gold-700">Til:</span>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button key={l.value} type="button" onClick={() => setLang(l.value)}
                className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
                  lang === l.value
                    ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                    : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100')}>
                <img src={l.flag} alt={l.label} className="h-4 w-5 rounded-sm object-cover" />
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold-700" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Slug, nom bo'yicha qidiruv..."
            className="w-full rounded-lg border border-gold-900/40 bg-midnight-800/40 py-2 pl-9 pr-3 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none lg:w-[300px]" />
        </div>
      </div>

      {/* Jadval */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gold-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold-900/40 bg-midnight-900/30 py-12 text-center text-sm text-gold-700">
          {search ? "Hech narsa topilmadi" : "Janrlar yo'q"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gold-900/30 bg-midnight-900/40">
          <div className="border-b border-gold-900/30 bg-midnight-950/60 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-gold-700">
              <span className="w-10">#</span>
              <span className="w-10">Ikona</span>
              <span className="flex-1">Nom & Slug</span>
              <span className="w-20">Hybrid</span>
              <span className="w-20">Holat</span>
              <span className="w-28 text-right">Amallar</span>
            </div>
          </div>
          {filtered.map((genre, idx) => (
            <GenreRow
              key={genre.id}
              genre={genre}
              lang={lang}
              index={idx}
              isDragging={draggedId === genre.id}
              isDragOver={dragOverId === genre.id && !!draggedId}
              onDragStart={() => handleDragStart(genre.id!)}
              onDragOver={(e) => handleDragOver(e, genre.id!)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, genre.id!)}
              onDragEnd={handleDragEnd}
              onEdit={() => { setEditorGenre(genre); setEditorOpen(true); }}
              onDelete={() => setDeleteTarget(genre)}
              onToggleActive={() => handleToggleActive(genre)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-3 text-xs text-gold-700">
          {filtered.length} ta janr · <GripVertical className="inline h-3 w-3" /> ushlab tortib tartib o'zgartiring
        </div>
      )}

      <GenreEditorModal
        genre={editorGenre} open={editorOpen}
        onClose={() => setEditorOpen(false)} onSaved={handleSaved} />

      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
          title="Janrni o'chirish" subtitle="Qaytarib bo'lmaydi" width="sm"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
                Bekor
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-gradient-admin px-4 py-2 text-sm font-semibold text-white hover:scale-[1.02] disabled:opacity-50">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                O'chirish
              </button>
            </div>
          }>
          <div className="p-5">
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-200">
              ⚠️ <strong>{deleteTarget.name_uz}</strong> janri o'chiriladi.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface GenreRowProps {
  genre: Genre; lang: Lang; index: number;
  isDragging: boolean; isDragOver: boolean;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void; onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void; onEdit: () => void;
  onDelete: () => void; onToggleActive: () => void;
}

function GenreRow({
  genre, lang, index, isDragging, isDragOver,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onEdit, onDelete, onToggleActive,
}: GenreRowProps) {
  const name = genre[`name_${lang}` as keyof Genre] as string;
  const description = genre[`description_${lang}` as keyof Genre] as string | null;

  return (
    <div
      draggable
      onDragStart={onDragStart} onDragOver={onDragOver}
      onDragLeave={onDragLeave} onDrop={onDrop} onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-3 border-b border-gold-900/20 px-4 py-3 transition-all last:border-0 hover:bg-midnight-800/40',
        isDragging && 'opacity-30',
        isDragOver && 'bg-admin-500/10 ring-2 ring-admin-500/40',
        !genre.is_active && 'opacity-50',
      )}
    >
      <div className="cursor-grab text-gold-700/60 hover:text-gold-300 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="w-6 font-mono text-xs text-gold-700">#{index + 1}</div>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl"
        style={{ background: `linear-gradient(135deg, ${genre.color}30, ${genre.color}10)`, border: `1px solid ${genre.color}50` }}>
        {genre.icon || '🎵'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gold-100">{name || '—'}</span>
          <code className="rounded bg-midnight-800/60 px-1.5 py-0.5 font-mono text-[10px] text-gold-700">
            {genre.slug}
          </code>
        </div>
        {description && (
          <div className="mt-0.5 line-clamp-1 text-[11px] text-gold-700">{description}</div>
        )}
      </div>
      <div className="w-20">
        {genre.is_hybrid
          ? <Badge variant="blue" icon={<Wand2 className="h-3 w-3" />}>Hybrid</Badge>
          : <span className="text-[10px] text-gold-700/40">—</span>}
      </div>
      <div className="w-20">
        <button type="button" onClick={onToggleActive}
          className={cn('flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
            genre.is_active
              ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
              : 'bg-white/5 text-gold-700/70 hover:bg-white/10')}>
          {genre.is_active
            ? <><Eye className="h-3 w-3" />Faol</>
            : <><EyeOff className="h-3 w-3" />Yopiq</>}
        </button>
      </div>
      <div className="flex w-28 items-center justify-end gap-1">
        <button type="button" onClick={onEdit}
          className="grid h-7 w-7 place-items-center rounded-md bg-gold-500/10 text-gold-300 hover:bg-gold-500/20">
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete}
          className="grid h-7 w-7 place-items-center rounded-md text-gold-700 hover:bg-admin-500/15 hover:text-admin-300">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
