import { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, Globe, Sparkles, Crown, Tag,
  Plus, X, Check, Loader2, AlertCircle, GripVertical,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Lang = 'uz' | 'en' | 'tr' | 'az';
type Currency = 'usd' | 'uzs' | 'azn' | 'try';

const LANGS: { value: Lang; flag: string; name: string }[] = [
  { value: 'uz', flag: '🇺🇿', name: 'UZ' },
  { value: 'en', flag: '🇬🇧', name: 'EN' },
  { value: 'tr', flag: '🇹🇷', name: 'TR' },
  { value: 'az', flag: '🇦🇿', name: 'AZ' },
];

const CURRENCIES: { value: Currency; symbol: string; label: string }[] = [
  { value: 'usd', symbol: '$',   label: 'USD' },
  { value: 'uzs', symbol: "so'm", label: 'UZS' },
  { value: 'azn', symbol: '₼',   label: 'AZN' },
  { value: 'try', symbol: '₺',   label: 'TRY' },
];

export interface PlanFeature {
  uz: string;
  en: string;
  tr: string;
  az: string;
}

export interface SubscriptionPlan {
  id?: string;
  slug: string;
  duration_months: number;
  name_uz: string;
  name_en: string;
  name_tr: string;
  name_az: string;
  description_uz: string | null;
  description_en: string | null;
  description_tr: string | null;
  description_az: string | null;
  price_usd: number;
  price_uzs: number;
  price_azn: number;
  price_try: number;
  original_price_usd: number | null;
  original_price_uzs: number | null;
  original_price_azn: number | null;
  original_price_try: number | null;
  discount_label_uz: string | null;
  discount_label_en: string | null;
  discount_label_tr: string | null;
  discount_label_az: string | null;
  features: PlanFeature[];
  credits_per_period: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export function emptyPlan(): SubscriptionPlan {
  return {
    slug: '',
    duration_months: 1,
    name_uz: '', name_en: '', name_tr: '', name_az: '',
    description_uz: '', description_en: '', description_tr: '', description_az: '',
    price_usd: 0, price_uzs: 0, price_azn: 0, price_try: 0,
    original_price_usd: null, original_price_uzs: null, original_price_azn: null, original_price_try: null,
    discount_label_uz: '', discount_label_en: '', discount_label_tr: '', discount_label_az: '',
    features: [],
    credits_per_period: 100,
    is_popular: false,
    is_active: true,
    sort_order: 99,
  };
}

interface Props {
  plan: SubscriptionPlan | null;
  open: boolean;
  onClose: () => void;
  onSaved: (plan: SubscriptionPlan) => void;
}

export function PlanEditorModal({ plan, open, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<SubscriptionPlan>(emptyPlan());
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isNew = !plan?.id;

  useEffect(() => {
    if (open) {
      setDraft(plan ? { ...plan } : emptyPlan());
      setActiveLang('uz');
      setError('');
    }
  }, [open, plan]);

  const update = <K extends keyof SubscriptionPlan>(key: K, value: SubscriptionPlan[K]) => {
    setDraft((p) => ({ ...p, [key]: value }));
  };

  const addFeature = () => {
    setDraft((p) => ({
      ...p,
      features: [...p.features, { uz: '', en: '', tr: '', az: '' }],
    }));
  };

  const updateFeature = (idx: number, lang: Lang, value: string) => {
    setDraft((p) => ({
      ...p,
      features: p.features.map((f, i) => (i === idx ? { ...f, [lang]: value } : f)),
    }));
  };

  const removeFeature = (idx: number) => {
    setDraft((p) => ({
      ...p,
      features: p.features.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setError('');

    if (!draft.slug.trim()) return setError('Slug majburiy');
    if (!/^[a-z0-9_-]+$/.test(draft.slug)) return setError('Slug faqat a-z, 0-9, _, - belgilaridan iborat boʻlsin');
    if (!draft.name_uz.trim() || !draft.name_en.trim() || !draft.name_tr.trim() || !draft.name_az.trim()) {
      return setError('Hamma 4 tilda (UZ/EN/TR/AZ) nom toʻldirilishi kerak');
    }
    if (draft.duration_months < 1) return setError("Davomiyligi 1 oydan kam bo'lmasin");
    if (draft.price_usd < 0) return setError("Narx manfiy bo'la olmaydi");

    setSaving(true);

    const payload: any = {
      slug: draft.slug.trim(),
      duration_months: draft.duration_months,
      name_uz: draft.name_uz, name_en: draft.name_en, name_tr: draft.name_tr, name_az: draft.name_az,
      description_uz: draft.description_uz || null,
      description_en: draft.description_en || null,
      description_tr: draft.description_tr || null,
      description_az: draft.description_az || null,
      price_usd: draft.price_usd, price_uzs: draft.price_uzs,
      price_azn: draft.price_azn, price_try: draft.price_try,
      original_price_usd: draft.original_price_usd,
      original_price_uzs: draft.original_price_uzs,
      original_price_azn: draft.original_price_azn,
      original_price_try: draft.original_price_try,
      discount_label_uz: draft.discount_label_uz || null,
      discount_label_en: draft.discount_label_en || null,
      discount_label_tr: draft.discount_label_tr || null,
      discount_label_az: draft.discount_label_az || null,
      features: draft.features.filter((f) => f.uz.trim() || f.en.trim()),
      credits_per_period: draft.credits_per_period,
      is_popular: draft.is_popular,
      is_active: draft.is_active,
      sort_order: draft.sort_order,
    };

    let result;
    if (isNew) {
      result = await supabase.from('subscription_plans').insert(payload).select().single();
    } else {
      result = await supabase
        .from('subscription_plans').update(payload).eq('id', plan!.id!).select().single();
    }

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSaved(result.data as SubscriptionPlan);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="xl"
      title={isNew ? 'Yangi tarif yaratish' : `Tahrirlash: ${plan?.name_uz}`}
      subtitle={isNew ? 'Hamma maydonlarni toʻldiring' : plan?.slug}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 transition-colors hover:bg-midnight-700/60 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-midnight-950 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isNew ? 'Yaratish' : 'Saqlash'}
          </button>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* === Asosiy === */}
        <Section title="Asosiy" icon={CreditCard}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Slug (unique ID)" required>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="monthly"
                disabled={!isNew}
                className="input"
              />
            </Field>
            <Field label="Davomiyligi (oy)" required>
              <input
                type="number"
                min={1}
                value={draft.duration_months}
                onChange={(e) => update('duration_months', parseInt(e.target.value) || 1)}
                className="input"
              />
            </Field>
            <Field label="Credits / davr" required>
              <input
                type="number"
                min={0}
                value={draft.credits_per_period}
                onChange={(e) => update('credits_per_period', parseInt(e.target.value) || 0)}
                className="input"
              />
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Sort order">
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)}
                className="input"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 self-end rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3 hover:border-gold-900/50">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => update('is_active', e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-emerald-500"
              />
              <span className="text-sm text-gold-100">Faol</span>
              {draft.is_active && <Badge variant="emerald">Yoqilgan</Badge>}
            </label>
            <label className="flex cursor-pointer items-center gap-2 self-end rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3 hover:border-gold-900/50">
              <input
                type="checkbox"
                checked={draft.is_popular}
                onChange={(e) => update('is_popular', e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-amber-500"
              />
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm text-gold-100">Popular</span>
            </label>
          </div>
        </Section>

        {/* === 4 til nom === */}
        <Section title="Nom (4 til: UZ/EN/TR/AZ)" icon={Globe} required>
          <LangTabs activeLang={activeLang} onChange={setActiveLang} draft={draft} />
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={draft[`name_${activeLang}` as keyof SubscriptionPlan] as string || ''}
              onChange={(e) => update(`name_${activeLang}` as keyof SubscriptionPlan, e.target.value as any)}
              placeholder={`Nom (${activeLang.toUpperCase()}) — majburiy`}
              maxLength={50}
              className="input"
            />
            <textarea
              value={draft[`description_${activeLang}` as keyof SubscriptionPlan] as string || ''}
              onChange={(e) => update(`description_${activeLang}` as keyof SubscriptionPlan, (e.target.value || null) as any)}
              placeholder={`Tavsif (${activeLang.toUpperCase()}) — ixtiyoriy`}
              rows={2}
              className="input resize-none"
            />
            <input
              type="text"
              value={draft[`discount_label_${activeLang}` as keyof SubscriptionPlan] as string || ''}
              onChange={(e) => update(`discount_label_${activeLang}` as keyof SubscriptionPlan, (e.target.value || null) as any)}
              placeholder={`Chegirma yorlig'i (${activeLang.toUpperCase()}) — masalan "-50%"`}
              maxLength={30}
              className="input"
            />
          </div>
        </Section>

        {/* === Narxlar === */}
        <Section title="Narxlar (4 valyuta)" icon={DollarSign} required>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CURRENCIES.map((c) => (
              <div key={c.value}>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">
                  {c.label} ({c.symbol})
                </label>
                <input
                  type="number"
                  min={0}
                  step={c.value === 'uzs' ? 1000 : 0.01}
                  value={draft[`price_${c.value}` as keyof SubscriptionPlan] as number || 0}
                  onChange={(e) => update(`price_${c.value}` as keyof SubscriptionPlan, parseFloat(e.target.value) || 0 as any)}
                  className="input"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gold-900/20 pt-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-gold-700">
              Eski narx (ixtiyoriy)
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CURRENCIES.map((c) => (
                <div key={c.value}>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700/70">
                    {c.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={c.value === 'uzs' ? 1000 : 0.01}
                    value={draft[`original_price_${c.value}` as keyof SubscriptionPlan] as number || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      update(`original_price_${c.value}` as keyof SubscriptionPlan, (v === '' ? null : parseFloat(v)) as any);
                    }}
                    placeholder="—"
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* === Features === */}
        <Section title="Imkoniyatlar (Features)" icon={Sparkles}>
          <div className="space-y-2">
            {draft.features.length === 0 && (
              <div className="rounded-lg border border-dashed border-gold-900/40 bg-midnight-900/30 py-6 text-center text-sm text-gold-700">
                Hech qanday feature qoʻshilmagan
              </div>
            )}
            {draft.features.map((feat, idx) => (
              <div key={idx} className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold-700">
                    <GripVertical className="h-3 w-3" />
                    Feature {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="grid h-6 w-6 place-items-center rounded text-gold-700 hover:bg-admin-500/20 hover:text-admin-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {LANGS.map((l) => (
                    <div key={l.value} className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-base leading-none">
                        {l.flag}
                      </span>
                      <input
                        type="text"
                        value={feat[l.value]}
                        onChange={(e) => updateFeature(idx, l.value, e.target.value)}
                        placeholder={`Feature (${l.value.toUpperCase()})`}
                        className="input pl-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gold-900/40 bg-midnight-900/30 px-3 py-2 text-sm text-gold-300/70 transition-colors hover:border-gold-900/60 hover:text-gold-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Feature qoʻshish
            </button>
          </div>
        </Section>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgba(58, 38, 11, 0.4);
          background: rgba(19, 31, 63, 0.4);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: #fff0d4;
          outline: none;
          transition: border-color 0.15s;
        }
        .input::placeholder { color: rgba(143, 94, 22, 0.4); }
        .input:focus { border-color: rgba(245, 179, 66, 0.6); }
        .input:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </Modal>
  );
}

function Section({ title, icon: Icon, required, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gold-200">
        <Icon className="h-3.5 w-3.5 text-admin-300" />
        {title}
        {required && <span className="text-admin-400">*</span>}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-gold-700">
        {label}
        {required && <span className="text-admin-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

function LangTabs({ activeLang, onChange, draft }: {
  activeLang: Lang;
  onChange: (l: Lang) => void;
  draft: SubscriptionPlan;
}) {
  return (
    <div className="flex gap-1">
      {LANGS.map((l) => {
        const filled = !!(draft[`name_${l.value}` as keyof SubscriptionPlan] as string)?.trim();
        return (
          <button
            key={l.value}
            type="button"
            onClick={() => onChange(l.value)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              activeLang === l.value
                ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
            )}
          >
            <span className="text-base leading-none">{l.flag}</span>
            {l.value.toUpperCase()}
            {filled && <Check className="h-3 w-3 text-emerald-400" />}
          </button>
        );
      })}
    </div>
  );
}
