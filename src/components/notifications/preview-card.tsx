import {
  Bell, Sparkles, Megaphone, AlertTriangle, RefreshCcw, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BroadcastType = 'admin_announcement' | 'update' | 'warning' | 'credits_refreshed';

interface Props {
  type: BroadcastType;
  title: string;
  message: string;
  actionUrl?: string | null;
  lang: 'uz' | 'en' | 'az' | 'tr';
}

const TYPE_META: Record<
  BroadcastType,
  {
    icon: React.ComponentType<{ className?: string }>;
    colorRing: string;
    colorIcon: string;
    labelByLang: Record<'uz' | 'en' | 'az' | 'tr', string>;
  }
> = {
  admin_announcement: {
    icon: Megaphone,
    colorRing: 'ring-amber-500/30 bg-amber-500/10',
    colorIcon: 'text-amber-400',
    labelByLang: { uz: 'Eʼlon', en: 'Announcement', az: 'Elan', tr: 'Duyuru' },
  },
  update: {
    icon: RefreshCcw,
    colorRing: 'ring-blue-500/30 bg-blue-500/10',
    colorIcon: 'text-blue-400',
    labelByLang: { uz: 'Yangilanish', en: 'Update', az: 'Yeniləmə', tr: 'Güncelleme' },
  },
  warning: {
    icon: AlertTriangle,
    colorRing: 'ring-admin-500/30 bg-admin-500/10',
    colorIcon: 'text-admin-400',
    labelByLang: { uz: 'Ogohlantirish', en: 'Warning', az: 'Xəbərdarlıq', tr: 'Uyarı' },
  },
  credits_refreshed: {
    icon: Sparkles,
    colorRing: 'ring-emerald-500/30 bg-emerald-500/10',
    colorIcon: 'text-emerald-400',
    labelByLang: { uz: 'Credits', en: 'Credits', az: 'Kreditlər', tr: 'Krediler' },
  },
};

const FLAG: Record<'uz' | 'en' | 'az' | 'tr', string> = {
  uz: 'https://flagcdn.com/w20/uz.png',
  en: 'https://flagcdn.com/w20/gb.png',
  az: 'https://flagcdn.com/w20/az.png',
  tr: 'https://flagcdn.com/w20/tr.png',
};

const LANG_NAME: Record<'uz' | 'en' | 'az' | 'tr', string> = {
  uz: "O'zbekcha", en: 'English', az: 'Azərbaycanca', tr: 'Türkçe',
};

/**
 * PreviewCard — foydalanuvchi qanday ko'rishini ko'rsatadi
 */
export function PreviewCard({ type, title, message, actionUrl, lang }: Props) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const hasContent = title.trim() || message.trim();

  return (
    <div className="overflow-hidden rounded-xl border border-gold-900/30 bg-midnight-900/60">
      {/* Lang header */}
      <div className="flex items-center justify-between border-b border-gold-900/30 bg-midnight-950/60 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gold-300">
          <img src={FLAG[lang]} alt={lang} className="h-4 w-5 rounded-sm object-cover" />
          {LANG_NAME[lang]}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-gold-700">
          Preview
        </span>
      </div>

      {/* Notification mockup */}
      {hasContent ? (
        <div className="space-y-3 p-3">
          <div className="flex items-start gap-3 rounded-lg bg-midnight-800/40 p-3">
            <div
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1',
                meta.colorRing,
              )}
            >
              <Icon className={cn('h-4 w-4', meta.colorIcon)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                  meta.colorRing,
                  meta.colorIcon,
                )}>
                  {meta.labelByLang[lang]}
                </span>
                <span className="text-[10px] text-gold-700">hozir</span>
              </div>
              <h4 className="mt-1 text-sm font-semibold text-gold-100">
                {title || <span className="italic text-gold-700/50">Sarlavha...</span>}
              </h4>
              <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-gold-300/80">
                {message || <span className="italic text-gold-700/50">Matn...</span>}
              </p>
              {actionUrl && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-400">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{actionUrl}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-gold-700/60">
          <Bell className="h-4 w-4" />
          Maydonlarni toʻldiring
        </div>
      )}
    </div>
  );
}
