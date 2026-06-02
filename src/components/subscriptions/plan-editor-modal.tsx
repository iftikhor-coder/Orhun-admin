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
  { value: 'usd', symbol: '$',    label: 'USD' },
  { value: 'uzs', symbol: "so'm", label: 'UZS' },
  { value: 'azn', symbol: '₼',    label: 'AZN' },
  { value: 'try', symbol: '₺',    label: 'TRY' },
];

export interface PlanFeature {
  uz: string; en: string; tr: string; az: string;
}

export interface SubscriptionPlan {
  id?: string;
  slug: string;
  duration_months: number;
  name_uz: string; name_en: string; name_tr: string; name_az: string;
  description_uz: string | null; description_en: string | null;
  description_tr: string | null; description_az: string | null;
  price_usd: number; price_uzs: number; price_azn: number; price_try: number;
  original_price_usd: number | null; original_price_uzs: number | null;
  original_price_azn: number | null; original_price_try: number | null;
  discount_label_uz: string | null; discount_label_en: string | null;
  discount_label_tr: string | null; discount_label_az: string | null;
  features: PlanFeature[];
  credits_per_period: number;
  is_popular: boolean; is_active: boolean; sort_order: number;
  created_at?: string; updated_at?: string;
}

export function emptyPlan(): SubscriptionPlan {
  return {
    slug: '', duration_months: 1,
    name_uz: '', name_en: '', name_tr: '', name_az: '',
    description_uz: '', description_en: '', description_tr: '', description_az: '',
    price_usd: 0, price_uzs: 0, price_azn: 0, price_try: 0,
    original_price_usd: null, original_price_uzs: null,
    original_price_azn: null, original_price_try: null,
    discount_label_uz: '', discount_label_en: '', discount_label_tr: '', discount_label_az: '',
    features: [], credits_per_period: 100,
    is_popular: false, is_active: true, sort_order: 99,
  };
}

interface Props {
  plan: SubscriptionPlan | null;
  open: boolean;
  onClose: () => void;
  onSaved: (plan: SubscriptionPlan) => void;
}

export function PlanEditorModal({ plan, open, onClose, onSaved }: Props) {
  const [draft, setDraft]         = useState<SubscriptionPlan>(emptyPlan());
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const isNew = !plan?.id;

  useEffect(() => {
    if (open) {
      const normalizedFeatures = Array.isArray(plan?.features)
        ? plan!.features.map((f: any) =>
            typeof f === 'string'
              ? { uz: f, en: f, tr: f, az: f }
              : { uz: f?.uz||'', en: f?.en||'', tr: f?.tr||'', az: f?.az||'' }
          )
        : [];
      setDraft(plan ? { ...plan, features: normalizedFeatures } : emptyPlan());
      setActiveLang('uz');
      setError('');
    }
  }, [open, plan]);

  const update = <K extends keyof SubscriptionPlan>(key: K, value: SubscriptionPlan[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const addFeature = () =>
    setDraft((p) => ({ ...p, features: [...p.features, { uz: '', en: '', tr: '', az: '' }] }));

  const updateFeature = (idx: number, lang: Lang, value: string) =>
    setDraft((p) => ({ ...p, features: p.features.map((f, i) => i === idx ? { ...f, [lang]: value } : f) }));

  const removeFeature = (idx: number) =>
    setDraft((p) => ({ ...p, features: p.features.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    setError('');
    if (!draft.slug.trim()) return setError('Slug majburiy');
    if (!/^[a-z0-9_-]+$/.test(draft.slug)) return setError("Slug faqat a-z, 0-9, _, - bo'lsin");
    if (!draft.name_uz.trim() || !draft.name_en.trim() || !draft.name_tr.trim() || !draft.name_az.trim())
      return setError('Hamma 4 tilda nom to\'ldirilishi kerak');
    if (draft.duration_months < 1) return setError("Davomiyligi 1 oydan kam bo'lmasin");

    setSaving(true);
    const payload: any = {
      slug: draft.slug.trim(), duration_months: draft.duration_months,
      name_uz: draft.name_uz, name_en: draft.name_en, name_tr: draft.name_tr, name_az: draft.name_az,
      description_uz: draft.description_uz || null, description_en: draft.description_en || null,
      description_tr: draft.description_tr || null, description_az: draft.description_az || null,
      price_usd: draft.price_usd, price_uzs: draft.price_uzs,
      price_azn: draft.price_azn, price_try: draft.price_try,
      original_price_usd: draft.original_price_usd, original_price_uzs: draft.original_price_uzs,
      original_price_azn: draft.original_price_azn, original_price_try: draft.original_price_try,
      discount_label_uz: draft.discount_label_uz || null, discount_label_en: draft.discount_label_en || null,
      discount_label_tr: draft.discount_label_tr || null, discount_label_az: draft.discount_label_az || null,
      features: draft.features
        .filter((f) => f && (typeof f === 'object') && (f?.uz?.trim() || f?.en?.trim()))
        .map((f) => ({ uz: f.uz||'', en: f.en||'', tr: f.tr||'', az: f.az||'' })),
      credits_per_period: draft.credits_per_period,
      is_popular: draft.is_popular, is_active: draft.is_active, sort_order: draft.sort_order,
    };

    const result = isNew
      ? await supabase.from('subscription_plans').insert(payload).select().single()
      : await supabase.from('subscription_plans').update(payload).eq('id', plan!.id!).select().single();

    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    onSaved(result.data as SubscriptionPlan);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="xl"
      title={isNew ? 'Yangi tarif yaratish' : `Tahrirlash: ${plan?.name_uz}`}
      subtitle={isNew ? 'Hamma maydonlarni to\'ldiring' : plan?.slug}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50">
            Bekor qilish
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-midnight-950 hover:scale-[1.02] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isNew ? 'Yaratish' : 'Saqlash'}
          </button>
        </div>
      }
    >
      {/* OVERLAP FIX: overflow-y-auto va max-height */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 140px)', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* Asosiy */}
          <Section title="Asosiy" icon={CreditCard}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <Field label="Slug" required>
                <input type="text" value={draft.slug}
                  onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="monthly" disabled={!isNew} className="pe-input" />
              </Field>
              <Field label="Davomiyligi (oy)" required>
                <input type="number" min={1} value={draft.duration_months}
                  onChange={(e) => update('duration_months', parseInt(e.target.value) || 1)}
                  className="pe-input" />
              </Field>
              <Field label="Credits / davr" required>
                <input type="number" min={0} value={draft.credits_per_period}
                  onChange={(e) => update('credits_per_period', parseInt(e.target.value) || 0)}
                  className="pe-input" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
              <Field label="Sort order">
                <input type="number" value={draft.sort_order}
                  onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)}
                  className="pe-input" />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                border: '1px solid rgba(58,38,11,0.4)', borderRadius: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.is_active}
                  onChange={(e) => update('is_active', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }} />
                <span style={{ fontSize: '13px', color: '#fff0d4' }}>Faol</span>
                {draft.is_active && <Badge variant="emerald">Yoqilgan</Badge>}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                border: '1px solid rgba(58,38,11,0.4)', borderRadius: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.is_popular}
                  onChange={(e) => update('is_popular', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }} />
                <Crown style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
                <span style={{ fontSize: '13px', color: '#fff0d4' }}>Popular</span>
              </label>
            </div>
          </Section>

          {/* 4 til nom */}
          <Section title="Nom (4 til: UZ/EN/TR/AZ)" icon={Globe} required>
            <LangTabs activeLang={activeLang} onChange={setActiveLang} draft={draft} />
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text"
                value={(draft as any)[`name_${activeLang}`] || ''}
                onChange={(e) => update(`name_${activeLang}` as any, e.target.value as any)}
                placeholder={`Nom (${activeLang.toUpperCase()}) — majburiy`}
                maxLength={50} className="pe-input" />
              <textarea
                value={(draft as any)[`description_${activeLang}`] || ''}
                onChange={(e) => update(`description_${activeLang}` as any, (e.target.value || null) as any)}
                placeholder={`Tavsif (${activeLang.toUpperCase()}) — ixtiyoriy`}
                rows={2} className="pe-input" style={{ resize: 'none' }} />
              <input type="text"
                value={(draft as any)[`discount_label_${activeLang}`] || ''}
                onChange={(e) => update(`discount_label_${activeLang}` as any, (e.target.value || null) as any)}
                placeholder={`Chegirma (${activeLang.toUpperCase()}) — masalan "Save 17%"`}
                maxLength={30} className="pe-input" />
            </div>
          </Section>

          {/* Narxlar */}
          <Section title="Narxlar (4 valyuta)" icon={DollarSign} required>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {CURRENCIES.map((c) => (
                <Field key={c.value} label={`${c.label} (${c.symbol})`}>
                  <input type="number" min={0} step={c.value === 'uzs' ? 1000 : 0.01}
                    value={(draft as any)[`price_${c.value}`] || 0}
                    onChange={(e) => update(`price_${c.value}` as any, parseFloat(e.target.value) || 0 as any)}
                    className="pe-input" />
                </Field>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(58,38,11,0.2)', marginTop: '12px', paddingTop: '12px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(143,94,22,0.7)', marginBottom: '8px' }}>
                Eski narx (ixtiyoriy)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {CURRENCIES.map((c) => (
                  <Field key={c.value} label={c.label}>
                    <input type="number" min={0} step={c.value === 'uzs' ? 1000 : 0.01}
                      value={(draft as any)[`original_price_${c.value}`] || ''}
                      onChange={(e) => update(`original_price_${c.value}` as any, (e.target.value === '' ? null : parseFloat(e.target.value)) as any)}
                      placeholder="—" className="pe-input" />
                  </Field>
                ))}
              </div>
            </div>
          </Section>

          {/* Features */}
          <Section title="Imkoniyatlar (4 tilda)" icon={Sparkles}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {draft.features.length === 0 && (
                <div style={{ border: '1px dashed rgba(58,38,11,0.4)', borderRadius: '6px', padding: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(143,94,22,0.7)' }}>
                  Hech qanday feature qo'shilmagan
                </div>
              )}
              {draft.features.map((feat, idx) => (
                <div key={idx} style={{ border: '1px solid rgba(58,38,11,0.3)', borderRadius: '8px', padding: '12px', background: 'rgba(19,31,63,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(143,94,22,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <GripVertical style={{ width: '12px', height: '12px' }} />Feature {idx + 1}
                    </span>
                    <button type="button" onClick={() => removeFeature(idx)}
                      style={{ width: '24px', height: '24px', display: 'grid', placeItems: 'center', borderRadius: '4px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(143,94,22,0.7)' }}>
                      <X style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {LANGS.map((l) => (
                      <div key={l.value} style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', lineHeight: 1 }}>
                          {l.flag}
                        </span>
                        <input type="text" value={feat[l.value]}
                          onChange={(e) => updateFeature(idx, l.value, e.target.value)}
                          placeholder={`Feature (${l.value.toUpperCase()})`}
                          style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                            border: '1px solid rgba(58,38,11,0.4)', background: 'rgba(19,31,63,0.4)',
                            borderRadius: '6px', fontSize: '13px', color: '#fff0d4', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFeature}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  border: '1px dashed rgba(58,38,11,0.4)', borderRadius: '6px', padding: '8px 12px',
                  fontSize: '13px', color: 'rgba(200,160,70,0.7)', background: 'rgba(19,31,63,0.3)', cursor: 'pointer' }}>
                <Plus style={{ width: '14px', height: '14px' }} />
                Feature qo'shish
              </button>
            </div>
          </Section>

        </div>
      </div>

      <style>{`
        .pe-input {
          width: 100%;
          border: 1px solid rgba(58, 38, 11, 0.4);
          background: rgba(19, 31, 63, 0.4);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: #fff0d4;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          display: block;
        }
        .pe-input::placeholder { color: rgba(143, 94, 22, 0.4); }
        .pe-input:focus { border-color: rgba(245, 179, 66, 0.6); }
        .pe-input:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </Modal>
  );
}

function Section({ title, icon: Icon, required, children }: {
  title: string; icon: any; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid rgba(58,38,11,0.3)', borderRadius: '12px', background: 'rgba(5,10,30,0.4)', padding: '16px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#e8c882', marginBottom: '12px', marginTop: 0 }}>
        <Icon style={{ width: '14px', height: '14px', color: '#e25c5c' }} />
        {title}
        {required && <span style={{ color: '#e25c5c' }}>*</span>}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(143,94,22,0.8)' }}>
        {label}{required && <span style={{ color: '#e25c5c' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function LangTabs({ activeLang, onChange, draft }: { activeLang: Lang; onChange: (l: Lang) => void; draft: SubscriptionPlan }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {LANGS.map((l) => {
        const filled = !!((draft as any)[`name_${l.value}`] as string)?.trim();
        const isActive = activeLang === l.value;
        return (
          <button key={l.value} type="button" onClick={() => onChange(l.value)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 12px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none',
              background: isActive ? 'rgba(226,92,92,0.1)' : 'transparent',
              color: isActive ? '#e25c5c' : 'rgba(200,160,70,0.7)',
              outline: isActive ? '1px solid rgba(226,92,92,0.3)' : 'none' }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{l.flag}</span>
            {l.value.toUpperCase()}
            {filled && <Check style={{ width: '12px', height: '12px', color: '#10b981' }} />}
          </button>
        );
      })}
    </div>
  );
}
