import { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Crown, Sparkles, Edit3, Trash2, Loader2,
  Eye, EyeOff, AlertCircle, Check, ExternalLink,
  RefreshCw, Tag,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  PlanEditorModal,
  type SubscriptionPlan,
} from '@/components/subscriptions/plan-editor-modal';
import { cn, timeAgo } from '@/lib/utils';

type Currency = 'usd' | 'uzs' | 'azn' | 'try';
type Lang = 'uz' | 'en' | 'tr' | 'az';

const CURRENCIES: { value: Currency; symbol: string; label: string; format: (n: number) => string }[] = [
  { value: 'usd', symbol: '$',    label: 'USD', format: (n) => `$${n.toFixed(2)}` },
  { value: 'uzs', symbol: "so'm", label: 'UZS', format: (n) => `${new Intl.NumberFormat('uz-UZ').format(n)} so'm` },
  { value: 'azn', symbol: '₼',    label: 'AZN', format: (n) => `${n.toFixed(2)} ₼` },
  { value: 'try', symbol: '₺',    label: 'TRY', format: (n) => `${n.toFixed(0)} ₺` },
];

const LANGS: { value: Lang; flag: string }[] = [
  { value: 'uz', flag: '🇺🇿' },
  { value: 'en', flag: '🇬🇧' },
  { value: 'tr', flag: '🇹🇷' },
  { value: 'az', flag: '🇦🇿' },
];

export function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currency, setCurrency] = useState<Currency>('usd');
  const [lang, setLang] = useState<Lang>('uz');

  const [editorPlan, setEditorPlan] = useState<SubscriptionPlan | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlans = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setPlans((data as SubscriptionPlan[]) ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleNew = () => {
    setEditorPlan(null);
    setEditorOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditorPlan(plan);
    setEditorOpen(true);
  };

  const handleSaved = (saved: SubscriptionPlan) => {
    setPlans((prev) => {
      const existing = prev.findIndex((p) => p.id === saved.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = saved;
        return copy;
      }
      return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order);
    });
    setSuccess(`✅ Tarif "${saved.name_uz}" saqlandi`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    const next = !plan.is_active;
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_active: next } : p)));
    const { error } = await supabase
      .from('subscription_plans').update({ is_active: next }).eq('id', plan.id!);
    if (error) {
      setError(error.message);
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_active: !next } : p)));
    }
  };

  const handleTogglePopular = async (plan: SubscriptionPlan) => {
    const next = !plan.is_popular;
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_popular: next } : p)));
    const { error } = await supabase
      .from('subscription_plans').update({ is_popular: next }).eq('id', plan.id!);
    if (error) {
      setError(error.message);
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_popular: !next } : p)));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    const { error } = await supabase.from('subscription_plans').delete().eq('id', deleteTarget.id);
    setDeleting(false);

    if (error) {
      setError(error.message);
      setDeleteTarget(null);
      return;
    }

    setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setSuccess(`✅ Tarif "${deleteTarget.name_uz}" o'chirildi`);
    setTimeout(() => setSuccess(''), 4000);
    setDeleteTarget(null);
  };

  const formatPrice = (plan: SubscriptionPlan): string => {
    const c = CURRENCIES.find((x) => x.value === currency)!;
    const price = plan[`price_${currency}` as keyof SubscriptionPlan] as number;
    return c.format(price || 0);
  };

  const formatOriginalPrice = (plan: SubscriptionPlan): string | null => {
    const c = CURRENCIES.find((x) => x.value === currency)!;
    const original = plan[`original_price_${currency}` as keyof SubscriptionPlan] as number | null;
    if (!original) return null;
    return c.format(original);
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={CreditCard}
        title="Obuna tariflari"
        subtitle="Monthly / 6-Month / Yearly tariflarni 4 valyutada boshqarish"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadPlans(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-300 transition-colors hover:bg-midnight-700/40 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              Yangilash
            </button>
            <button
              type="button"
              onClick={handleNew}
              className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-midnight-950 shadow-lg transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              Yangi tarif
            </button>
          </div>
        }
      />

      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-admin-900/40 bg-admin-950/30 px-3 py-2 text-sm text-admin-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gold-700">Valyuta:</span>
          <div className="flex gap-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCurrency(c.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  currency === c.value
                    ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                    : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gold-700">Til:</span>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLang(l.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  lang === l.value
                    ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                    : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
                )}
              >
                <span className="text-base leading-none">{l.flag}</span>
                {l.value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gold-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold-900/40 bg-midnight-900/30 py-12 text-center text-sm text-gold-700">
          Hali tarif qo'shilmagan
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currency={currency}
              lang={lang}
              formatPrice={formatPrice(plan)}
              formatOriginalPrice={formatOriginalPrice(plan)}
              onEdit={() => handleEdit(plan)}
              onDelete={() => setDeleteTarget(plan)}
              onToggleActive={() => handleToggleActive(plan)}
              onTogglePopular={() => handleTogglePopular(plan)}
            />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div>
            <div className="text-sm font-semibold text-blue-300">
              Avtomatik sinxronizatsiya (UZ/EN/TR/AZ)
            </div>
            <p className="mt-1 text-xs text-gold-300/80">
              Bu yerdagi o'zgarishlar <code className="rounded bg-midnight-800/60 px-1.5 py-0.5 text-blue-400">orhun-ai.vercel.app</code> dagi Upgrade boʻlimida darhol koʻrinadi.
              4 til: O'zbek, English, Türkçe, Azərbaycan.
            </p>
          </div>
        </div>
      </div>

      <PlanEditorModal
        plan={editorPlan}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
      />

      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Tarifni o'chirish"
          subtitle="Bu amal qaytarib bo'lmaydi"
          width="sm"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 hover:bg-midnight-700/60 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-gradient-admin px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                O'chirish
              </button>
            </div>
          }
        >
          <div className="p-5">
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-200">
              ⚠️ <strong>{deleteTarget.name_uz}</strong> tarifi butunlay o'chiriladi va saytda chiqmaydi.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  currency: Currency;
  lang: Lang;
  formatPrice: string;
  formatOriginalPrice: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onTogglePopular: () => void;
}

function PlanCard({
  plan, currency, lang,
  formatPrice, formatOriginalPrice,
  onEdit, onDelete, onToggleActive, onTogglePopular,
}: PlanCardProps) {
  const name = plan[`name_${lang}` as keyof SubscriptionPlan] as string;
  const description = plan[`description_${lang}` as keyof SubscriptionPlan] as string | null;
  const discountLabel = plan[`discount_label_${lang}` as keyof SubscriptionPlan] as string | null;

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border transition-all',
        plan.is_active
          ? 'border-gold-900/40 bg-midnight-900/60'
          : 'border-gold-900/20 bg-midnight-900/30 opacity-60',
        plan.is_popular && 'ring-2 ring-amber-500/40',
      )}
    >
      {plan.is_popular && (
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="amber" icon={<Crown className="h-3 w-3" />}>
            POPULAR
          </Badge>
        </div>
      )}

      <div className="border-b border-gold-900/30 bg-gradient-to-b from-midnight-800/40 to-transparent p-5">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-display text-lg font-bold text-gold-100">
            {name || '—'}
          </h3>
          {!plan.is_active && <Badge variant="neutral">Yopilgan</Badge>}
        </div>
        {description && (
          <p className="text-xs text-gold-700">{description}</p>
        )}

        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-gold-100">
              {formatPrice}
            </span>
            <span className="text-xs text-gold-700">
              / {plan.duration_months} oy
            </span>
          </div>
          {formatOriginalPrice && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gold-700/60 line-through">
                {formatOriginalPrice}
              </span>
              {discountLabel && (
                <Badge variant="admin" icon={<Tag className="h-3 w-3" />}>
                  {discountLabel}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-gold-300">
          <Sparkles className="h-3 w-3 text-gold-500" />
          <span className="font-semibold">{plan.credits_per_period}</span>
          <span className="text-gold-700">credit / davr</span>
        </div>
      </div>

      <div className="flex-1 p-5">
        {plan.features.length === 0 ? (
          <div className="text-xs italic text-gold-700/50">
            Hali feature yo'q
          </div>
        ) : (
          <ul className="space-y-2">
            {plan.features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="text-gold-200">{feat[lang] || feat.uz || '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gold-900/30 bg-midnight-950/40 p-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-gold-500/10 px-2 py-1.5 text-xs font-medium text-gold-300 transition-colors hover:bg-gold-500/20"
          >
            <Edit3 className="h-3 w-3" />
            Tahrirlash
          </button>
          <button
            type="button"
            onClick={onTogglePopular}
            title={plan.is_popular ? 'Popular tagini olib tashlash' : 'Popular qilish'}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md transition-colors',
              plan.is_popular
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'text-gold-700 hover:bg-amber-500/10 hover:text-amber-400',
            )}
          >
            <Crown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            title={plan.is_active ? "Faolsizlantirish" : "Faollashtirish"}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md transition-colors',
              plan.is_active
                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'text-gold-700 hover:bg-emerald-500/10 hover:text-emerald-400',
            )}
          >
            {plan.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="O'chirish"
            className="grid h-7 w-7 place-items-center rounded-md text-gold-700 transition-colors hover:bg-admin-500/15 hover:text-admin-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-gold-700/60">
          <span className="font-mono">{plan.slug}</span>
          {plan.updated_at && <span>Yangilangan: {timeAgo(plan.updated_at)}</span>}
        </div>
      </div>
    </div>
  );
}
