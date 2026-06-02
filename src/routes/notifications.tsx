import { useState, useEffect } from 'react';
import {
  Bell, Send, Megaphone, AlertTriangle, RefreshCcw, Sparkles,
  Loader2, Check, AlertCircle, ChevronRight, Users, Globe,
  Calendar, ExternalLink, ArrowDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { PreviewCard } from '@/components/notifications/preview-card';
import { formatDateTime, timeAgo, cn } from '@/lib/utils';

type BroadcastType = 'admin_announcement' | 'update' | 'warning' | 'credits_refreshed';
type Target = 'all' | 'active' | 'admins';
type Lang = 'uz' | 'en' | 'az' | 'tr';

interface BroadcastHistoryRow {
  id: string;
  sent_by_email: string | null;
  type: string;
  title_uz: string;
  title_en: string | null;
  title_az: string | null;
  title_tr: string | null;
  message_uz: string;
  message_en: string | null;
  message_az: string | null;
  message_tr: string | null;
  action_url: string | null;
  recipients_count: number;
  send_email: boolean;
  created_at: string;
}

const TYPES: { value: BroadcastType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'admin_announcement', label: "Eʼlon",        icon: Megaphone,     color: 'amber'   },
  { value: 'update',             label: 'Yangilanish',  icon: RefreshCcw,    color: 'blue'    },
  { value: 'warning',            label: 'Ogohlantirish',icon: AlertTriangle, color: 'admin'   },
  { value: 'credits_refreshed',  label: 'Credits',      icon: Sparkles,      color: 'emerald' },
];

const TARGETS: { value: Target; label: string; description: string }[] = [
  { value: 'all',    label: 'Hammasi',     description: 'Barcha foydalanuvchilar' },
  { value: 'active', label: 'Faollar',     description: 'Banlangan emaslar' },
  { value: 'admins', label: 'Adminlar',    description: 'Faqat administratorlar' },
];

const LANGS: { value: Lang; flag: string; name: string }[] = [
  { value: 'uz', flag: 'https://flagcdn.com/w20/uz.png', name: "O'zbekcha (majburiy)" },
  { value: 'en', flag: 'https://flagcdn.com/w20/gb.png', name: 'English' },
  { value: 'az', flag: 'https://flagcdn.com/w20/az.png', name: 'Azərbaycanca' },
  { value: 'tr', flag: 'https://flagcdn.com/w20/tr.png', name: 'Türkçe' },
];

export function NotificationsPage() {
  // Forma state
  const [type, setType] = useState<BroadcastType>('admin_announcement');
  const [target, setTarget] = useState<Target>('all');
  const [actionUrl, setActionUrl] = useState('');
  const [sendEmail, setSendEmail] = useState(false);

  // 4 til
  const [titles, setTitles] = useState<Record<Lang, string>>({ uz: '', en: '', az: '', tr: '' });
  const [messages, setMessages] = useState<Record<Lang, string>>({ uz: '', en: '', az: '', tr: '' });
  const [activeLang, setActiveLang] = useState<Lang>('uz');

  // Recipients count (live)
  const [recipientsCount, setRecipientsCount] = useState<number | null>(null);

  // Submit
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tarix
  const [history, setHistory] = useState<BroadcastHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<BroadcastHistoryRow | null>(null);

  // Target o'zgarsa recipients count yangilanadi
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc(
        'admin_broadcast_count_recipients',
        { p_target: target },
      );
      if (!error && typeof data === 'number') setRecipientsCount(data);
    })();
  }, [target]);

  // Tarix yuklash
  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('broadcast_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setHistory(data as BroadcastHistoryRow[]);
    setHistoryLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Validatsiya
  const canSend =
    titles.uz.trim().length > 0 &&
    messages.uz.trim().length > 0 &&
    !sending;

  // Yuborish
  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setSending(true);

    const { data, error } = await supabase.rpc('admin_broadcast_notification', {
      p_type: type,
      p_title_uz: titles.uz.trim(),
      p_title_en: titles.en.trim() || null,
      p_title_az: titles.az.trim() || null,
      p_title_tr: titles.tr.trim() || null,
      p_message_uz: messages.uz.trim(),
      p_message_en: messages.en.trim() || null,
      p_message_az: messages.az.trim() || null,
      p_message_tr: messages.tr.trim() || null,
      p_action_url: actionUrl.trim() || null,
      p_send_email: sendEmail,
      p_target: target,
    });

    setSending(false);
    setConfirmOpen(false);

    if (error) {
      setError(error.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setSuccess(`✅ Xabar yuborildi — ${row?.recipients_count ?? 0} ta foydalanuvchiga`);

    // Formani tozalash
    setTitles({ uz: '', en: '', ru: '', tr: '' });
    setMessages({ uz: '', en: '', ru: '', tr: '' });
    setActionUrl('');

    // Tarixni yangilash
    loadHistory();
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        icon={Bell}
        title="Bildirishnomalar (Broadcast)"
        subtitle="Massiv xabar yuborish, 4 til, tarix"
      />

      {/* Xabarlar */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* ============ Forma ============ */}
        <div className="space-y-5">
          {/* Tip tanlash */}
          <FormSection title="1. Xabar turi" icon={Bell}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all',
                    type === t.value
                      ? 'border-admin-500/60 bg-admin-500/10 text-admin-300'
                      : 'border-gold-900/30 bg-midnight-800/40 text-gold-300/70 hover:border-gold-900/50',
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </FormSection>

          {/* Kimga */}
          <FormSection title="2. Kimga yuborilsin" icon={Users}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TARGETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTarget(t.value)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-all',
                    target === t.value
                      ? 'border-admin-500/60 bg-admin-500/10'
                      : 'border-gold-900/30 bg-midnight-800/40 hover:border-gold-900/50',
                  )}
                >
                  <span className={cn(
                    'text-sm font-semibold',
                    target === t.value ? 'text-admin-300' : 'text-gold-100',
                  )}>
                    {t.label}
                  </span>
                  <span className="text-[10px] text-gold-700">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
            {recipientsCount !== null && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2 text-xs text-gold-300">
                <Users className="h-3.5 w-3.5 text-gold-500" />
                Yuboriladi:{' '}
                <span className="font-bold text-gold-100">{recipientsCount}</span>{' '}
                ta foydalanuvchiga
              </div>
            )}
          </FormSection>

          {/* 4 til kontent */}
          <FormSection title="3. Sarlavha va matn (4 til)" icon={Globe}>
            {/* Lang tabs */}
            <div className="mb-3 flex gap-1">
              {LANGS.map((l) => {
                const filled = titles[l.value].trim() && messages[l.value].trim();
                const required = l.value === 'uz';
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setActiveLang(l.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      activeLang === l.value
                        ? 'bg-admin-500/10 text-admin-300 ring-1 ring-admin-500/30'
                        : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
                    )}
                  >
                    <img src={l.flag} alt={l.value} className="h-4 w-5 rounded-sm object-cover" />
                    <span>{l.value.toUpperCase()}</span>
                    {required && (
                      <span className="text-[9px] text-admin-400">*</span>
                    )}
                    {filled && (
                      <Check className="h-3 w-3 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inputs */}
            <div className="space-y-2">
              <input
                type="text"
                value={titles[activeLang]}
                onChange={(e) =>
                  setTitles((p) => ({ ...p, [activeLang]: e.target.value }))
                }
                placeholder={`Sarlavha (${activeLang.toUpperCase()})${activeLang === 'uz' ? ' — majburiy' : ''}`}
                maxLength={100}
                className="w-full rounded-md border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none"
              />
              <textarea
                value={messages[activeLang]}
                onChange={(e) =>
                  setMessages((p) => ({ ...p, [activeLang]: e.target.value }))
                }
                placeholder={`Matn (${activeLang.toUpperCase()})${activeLang === 'uz' ? ' — majburiy' : ''}`}
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-md border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-gold-700">
                <span>
                  {LANGS.find((l) => l.value === activeLang)?.name}
                </span>
                <span>
                  {messages[activeLang].length} / 500
                </span>
              </div>
            </div>
          </FormSection>

          {/* Optional URL */}
          <FormSection title="4. Havola (ixtiyoriy)" icon={ExternalLink}>
            <input
              type="url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="https://example.com/..."
              className="w-full rounded-md border border-gold-900/40 bg-midnight-800/40 px-3 py-2 text-sm text-gold-100 placeholder:text-gold-700/40 focus:border-admin-500/60 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-gold-700">
              Xabar bosilganda shu URL ochiladi. Bo'sh qoldirsangiz — xabar oddiy notification bo'ladi.
            </p>
          </FormSection>

          {/* Email checkbox */}
          <FormSection title="5. Email yuborish" icon={Send}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3 hover:border-gold-900/50">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-admin-500"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gold-100">
                  Email bilan ham yuborish
                </div>
                <p className="mt-0.5 text-[11px] text-gold-700">
                  In-app notification bilan birga email ham yuboriladi. Email yuborish Python API (Faza 7) ulangach faollashadi.
                </p>
              </div>
            </label>
          </FormSection>

          {/* Submit */}
          <button
            type="button"
            disabled={!canSend}
            onClick={() => setConfirmOpen(true)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
              'bg-gradient-admin text-white shadow-lg shadow-admin-900/40',
              'hover:shadow-xl hover:shadow-admin-900/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <Send className="h-4 w-4" />
            Yuborish ({recipientsCount ?? '...'} ta foydalanuvchiga)
          </button>
        </div>

        {/* ============ Preview ============ */}
        <div className="space-y-3">
          <div className="sticky top-0 flex items-center gap-2 text-xs uppercase tracking-wider text-gold-700">
            <ArrowDown className="h-3 w-3" />
            Preview — foydalanuvchi koʻrinishi
          </div>
          {LANGS.map((l) => (
            <PreviewCard
              key={l.value}
              type={type}
              title={titles[l.value] || titles.uz}
              message={messages[l.value] || messages.uz}
              actionUrl={actionUrl}
              lang={l.value}
            />
          ))}
        </div>
      </div>

      {/* ============ Tarix ============ */}
      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-gold-100">
          <Calendar className="h-4 w-4 text-admin-300" />
          Yuborilgan xabarlar tarixi
        </h2>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12 text-gold-700">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gold-900/40 bg-midnight-900/30 py-12 text-center text-sm text-gold-700">
            Hali xabar yuborilmagan
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gold-900/30 bg-midnight-900/40">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-900/30 bg-midnight-950/60 text-left text-[10px] uppercase tracking-wider text-gold-700">
                  <th className="px-4 py-3 font-semibold">Sarlavha (UZ)</th>
                  <th className="px-4 py-3 font-semibold">Turi</th>
                  <th className="px-4 py-3 font-semibold">Kim yuborgan</th>
                  <th className="px-4 py-3 font-semibold">Oluvchilar</th>
                  <th className="px-4 py-3 font-semibold">Vaqt</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => setSelectedHistory(h)}
                    className="group cursor-pointer border-b border-gold-900/20 transition-colors hover:bg-midnight-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="truncate text-sm font-medium text-gold-100">
                        {h.title_uz}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-gold-700">
                        {h.message_uz}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={h.type as BroadcastType} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gold-300/80">
                      {h.sent_by_email || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-bold text-gold-100">{h.recipients_count}</span>
                      {h.send_email && (
                        <Badge variant="blue" className="ml-2">📧</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gold-700">
                      {timeAgo(h.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-gold-700 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === Tasdiqlash modali === */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Yuborishni tasdiqlang"
        subtitle={`${recipientsCount ?? 0} ta foydalanuvchiga yuboriladi`}
        width="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
              className="rounded-lg bg-midnight-700/40 px-4 py-2 text-sm text-gold-100/80 transition-colors hover:bg-midnight-700/60 disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-gradient-admin px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-admin-900/40 transition-all hover:shadow-xl disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Tasdiqlash va yuborish
            </button>
          </div>
        }
      >
        <div className="p-5 space-y-3">
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-200">
            ⚠️ Bu amal qaytarib bo'lmaydi. Xabar darhol barcha oluvchilarga yetkaziladi.
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Turi"><TypeBadge type={type} /></Row>
            <Row label="Kimga">{TARGETS.find((t) => t.value === target)?.label} ({recipientsCount} ta)</Row>
            <Row label="Sarlavha (UZ)">{titles.uz}</Row>
            <Row label="Til'lar">
              {LANGS.filter((l) => titles[l.value].trim() || messages[l.value].trim()).map((l) => l.flag).join(' ')}
            </Row>
            {actionUrl && <Row label="URL">{actionUrl}</Row>}
            {sendEmail && <Row label="Email"><Badge variant="blue">Ha</Badge></Row>}
          </div>
        </div>
      </Modal>

      {/* === Tarix detal modali === */}
      {selectedHistory && (
        <Modal
          open={!!selectedHistory}
          onClose={() => setSelectedHistory(null)}
          title={selectedHistory.title_uz}
          subtitle={`${formatDateTime(selectedHistory.created_at)} · ${selectedHistory.recipients_count} ta foydalanuvchi`}
          width="lg"
        >
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <TypeBadge type={selectedHistory.type as BroadcastType} />
              {selectedHistory.send_email && <Badge variant="blue">📧 Email yuborilgan</Badge>}
              <span className="text-xs text-gold-700">
                · {selectedHistory.sent_by_email}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {LANGS.map((l) => {
                const title = selectedHistory[`title_${l.value}` as keyof BroadcastHistoryRow] as string | null;
                const message = selectedHistory[`message_${l.value}` as keyof BroadcastHistoryRow] as string | null;
                if (!title && !message) return null;
                return (
                  <div key={l.value} className="rounded-lg border border-gold-900/30 bg-midnight-800/40 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold-700">
                      <img src={l.flag} alt={l.value} className="h-4 w-5 rounded-sm object-cover" />
                      {l.value.toUpperCase()}
                    </div>
                    <h4 className="text-sm font-semibold text-gold-100">{title}</h4>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-gold-300/80">{message}</p>
                  </div>
                );
              })}
            </div>

            {selectedHistory.action_url && (
              <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-blue-400">
                  <ExternalLink className="h-3 w-3" />
                  Havola
                </div>
                <p className="break-all text-sm text-blue-300">{selectedHistory.action_url}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
 *  Yordamchi komponentlar
 * =========================================================== */

function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gold-200">
        <Icon className="h-3.5 w-3.5 text-admin-300" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gold-900/20 py-1.5 last:border-0">
      <span className="shrink-0 text-xs uppercase tracking-wider text-gold-700">
        {label}
      </span>
      <span className="text-right text-sm text-gold-100">{children}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: BroadcastType }) {
  const meta = TYPES.find((t) => t.value === type);
  if (!meta) return <Badge>{type}</Badge>;
  const Icon = meta.icon;
  return (
    <Badge variant={meta.color as any} icon={<Icon className="h-3 w-3" />}>
      {meta.label}
    </Badge>
  );
}
