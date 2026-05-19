import { useState, useEffect } from 'react';
import { Tags, Hash, Globe, Palette, Loader2, Check, AlertCircle, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Lang = 'uz' | 'en' | 'tr' | 'az';

const LANGS: { value: Lang; flag: string; name: string }[] = [
  { value: 'uz', flag: '🇺🇿', name: 'UZ' },
  { value: 'en', flag: '🇬🇧', name: 'EN' },
  { value: 'tr', flag: '🇹🇷', name: 'TR' },
  { value: 'az', flag: '🇦🇿', name: 'AZ' },
];

export interface Genre {
  id?: string;
  slug: string;
  name_uz: string; name_en: string; name_tr: string; name_az: string;
  description_uz: string | null; description_en: string | null;
  description_tr: string | null; description_az: string | null;
  icon: string | null;
  color: string;
  is_hybrid: boolean;
  hybrid_prompt: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function emptyGenre(): Genre {
  return {
    slug: '',
    name_uz: '', name_en: '', name_tr: '', name_az: '',
    description_uz: null, description_en: null, description_tr: null, description_az: null,
    icon: '🎵', color: '#f5b342',
    is_hybrid: false, hybrid_prompt: null,
    sort_order: 99, is_active: true,
  };
}

const QUICK_EMOJIS = [
  '🎵','🎶','🎤','🎸','🎻','🎹','🥁','🎺',
  '🎷','🪕','🎧','🎛️','✨','🔥','⚡','🌟',
  '🔮','💫','🌙','☀️','🌊','🏔️','🌌','🪐',
];

const QUICK_COLORS = [
  '#f5b342','#dc2626','#ec4899','#8b5cf6','#06b6d4',
  '#10b981','#84cc16','#f59e0b','#7c3aed','#a16207',
];

interface Props {
  genre: Genre | null;
  open: boolean;
  onClose: () => void;
  onSaved: (genre: Genre) => void;
}

export function GenreEditorModal({ genre, open, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<Genre>(emptyGenre());
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isNew = !genre?.id;

  useEffect(() => {
    if (open) { setDraft(genre ? { ...genre } : emptyGenre()); setActiveLang('uz'); setError(''); }
  }, [open, genre]);

  const update = <K extends keyof Genre>(key: K, value: Genre[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setError('');
    if (!draft.slug.trim()) return setError('Slug majburiy');
    if (!/^[a-z0-9_-]+$/.test(draft.slug)) return setError('Slug faqat a-z, 0-9, _, - belgilaridan');
    if (!draft.name_uz.trim() || !draft.name_en.trim() || !draft.name_tr.trim() || !draft.name_az.trim())
      return setError('Hamma 4 tilda (UZ/EN/TR/AZ) nom majburiy');
    if (draft.is_hybrid && !draft.hybrid_prompt?.trim())
      return setError('Hybrid janr uchun hybrid prompt majburiy');

    setSaving(true);
    const payload = {
      slug: draft.slug.trim(),
      name_uz: draft.name_uz, name_en: draft.name_en, name_tr: draft.name_tr, name_az: draft.name_az,
      description_uz: draft.description_uz?.trim() || null,
      description_en: draft.description_en?.trim() || null,
      description_tr: draft.description_tr?.trim() || null,
      description_az: draft.description_az?.trim() || null,
      icon: draft.icon || null, color: draft.color,
      is_hybrid: draft.is_hybrid,
      hybrid_prompt: draft.is_hybrid ? draft.hybrid_prompt?.trim() || null : null,
      sort_order: draft.sort_order, is_active: draft.is_active,
    };

    const result = isNew
      ? await supabase.from('genres').insert(payload).select().single()
      : await supabase.from('genres').update(payload).eq('id', genre!.id!).select().single();

    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    onSaved(result.data as Genre);
    onClose();
  };

  return (
    <Modal
      open={open} onClose={onClose} width="lg"
      title={isNew ? 'Yangi janr yaratish' : `Tahrirlash: ${genre?.name_uz}`}
      subtitle={isNew ? 'UZ/EN/TR/AZ toʻldiring' : genre?.slug}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
            Bekor
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-midnight-950 hover:scale-[1.02] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isNew ? 'Yaratish' : 'Saqlash'}
          </button>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-xl border border-gold-900/30 bg-midnight-800/40 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-gold-700">Preview</div>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl text-2xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${draft.color}40, ${draft.color}10)`, border: `1px solid ${draft.color}60` }}>
              {draft.icon || '🎵'}
            </div>
            <div>
              <div className="font-semibold text-gold-100">
                {draft[`name_${activeLang}`] || <span className="italic text-gold-700/50">Nom...</span>}
              </div>
              <div className="text-xs text-gold-700">
                {draft[`description_${activeLang}`] || <span className="italic text-gold-700/40">Tavsif...</span>}
              </div>
              {draft.is_hybrid && <Badge variant="blue" className="mt-1">Hybrid</Badge>}
            </div>
          </div>
        </div>

        {/* Asosiy */}
        <Section title="Asosiy" icon={Hash}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">Slug *</label>
              <input type="text" value={draft.slug}
                onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="folk" disabled={!isNew} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">Sort order</label>
              <input type="number" value={draft.sort_order}
                onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)} className="input" />
            </div>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
            <input type="checkbox" checked={draft.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-emerald-500" />
            <span className="text-sm text-gold-100">Faol</span>
            {draft.is_active && <Badge variant="emerald">Yoqilgan</Badge>}
          </label>
        </Section>

        {/* Ikona + rang */}
        <Section title="Ikona va rang" icon={Palette}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">Emoji</label>
              <input type="text" value={draft.icon || ''} onChange={(e) => update('icon', e.target.value)}
                placeholder="🎵" maxLength={4} className="input text-center text-2xl" />
              <div className="mt-2 flex flex-wrap gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => update('icon', emoji)}
                    className={cn('grid h-8 w-8 place-items-center rounded text-base',
                      draft.icon === emoji ? 'bg-gold-500/20 ring-1 ring-gold-500/60' : 'bg-midnight-800/40 hover:bg-midnight-700/60')}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">Rang</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.color} onChange={(e) => update('color', e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-gold-900/40 bg-transparent" />
                <input type="text" value={draft.color} onChange={(e) => update('color', e.target.value)}
                  className="input flex-1 font-mono" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {QUICK_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => update('color', c)}
                    className={cn('h-8 w-8 rounded',
                      draft.color === c && 'ring-2 ring-gold-500 ring-offset-2 ring-offset-midnight-900')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 4 til nom */}
        <Section title="Nom va tavsif (UZ/EN/TR/AZ)" icon={Globe} required>
          <div className="mb-3 flex gap-1">
            {LANGS.map((l) => {
              const filled = !!(draft[`name_${l.value}` as keyof Genre] as string)?.trim();
              return (
                <button key={l.value} type="button" onClick={() => setActiveLang(l.value)}
                  className={cn('flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium',
                    activeLang === l.value
                      ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                      : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100')}>
                  <span className="text-base leading-none">{l.flag}</span>
                  {l.value.toUpperCase()}
                  {filled && <Check className="h-3 w-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <input type="text"
              value={(draft[`name_${activeLang}` as keyof Genre] as string) || ''}
              onChange={(e) => update(`name_${activeLang}` as keyof Genre, e.target.value as any)}
              placeholder={`Nom (${activeLang.toUpperCase()}) — majburiy`} maxLength={50} className="input" />
            <textarea
              value={(draft[`description_${activeLang}` as keyof Genre] as string) || ''}
              onChange={(e) => update(`description_${activeLang}` as keyof Genre, (e.target.value || null) as any)}
              placeholder={`Tavsif (${activeLang.toUpperCase()}) — ixtiyoriy`}
              rows={2} className="input resize-none" />
          </div>
        </Section>

        {/* Hybrid */}
        <Section title="Hybrid prompt (backend)" icon={Wand2}>
          <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
            <input type="checkbox" checked={draft.is_hybrid}
              onChange={(e) => update('is_hybrid', e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-500" />
            <div>
              <div className="text-sm font-medium text-gold-100">Hybrid janr</div>
              <p className="mt-0.5 text-[11px] text-gold-700">
                Backend <code className="rounded bg-midnight-900/60 px-1 text-blue-400">HYBRID_GENRE_PROMPTS</code> ga qo'shiladi
              </p>
            </div>
          </label>
          {draft.is_hybrid && (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">
                Hybrid prompt (ingliz tilida)
              </label>
              <textarea value={draft.hybrid_prompt || ''}
                onChange={(e) => update('hybrid_prompt', e.target.value || null)}
                placeholder="Combine traditional Turkic musical elements with..."
                rows={5} className="input resize-none font-mono text-xs" />
            </div>
          )}
        </Section>
      </div>

      <style>{`
        .input { width:100%; border:1px solid rgba(58,38,11,0.4); background:rgba(19,31,63,0.4);
          border-radius:6px; padding:8px 12px; font-size:13px; color:#fff0d4; outline:none; }
        .input::placeholder { color:rgba(143,94,22,0.4); }
        .input:focus { border-color:rgba(245,179,66,0.6); }
        .input:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>
    </Modal>
  );
}

function Section({ title, icon: Icon, required, children }: {
  title: string; icon: React.ComponentType<{ className?: string }>;
  required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gold-200">
        <Icon className="h-3.5 w-3.5 text-admin-300" />
        {title}{required && <span className="text-admin-400">*</span>}
      </h3>
      {children}
    </div>
  );
}
