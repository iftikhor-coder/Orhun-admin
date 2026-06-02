import { useI18nStore, LOCALES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLocale(l.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            locale === l.value
              ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
              : 'text-gold-300/70 hover:bg-midnight-700/40 hover:text-gold-100',
          )}
        >
          <img src={l.flag} alt={l.label} className="h-3.5 w-5 rounded-sm object-cover" />
          {l.label}
        </button>
      ))}
    </div>
  );
}