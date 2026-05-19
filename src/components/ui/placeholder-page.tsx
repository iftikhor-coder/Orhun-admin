import { type LucideIcon, Construction } from 'lucide-react';
import { PageHeader } from './page-header';

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  phase: string;
  features: string[];
}

/**
 * PlaceholderPage — keyingi fazalarda ishlanadigan sahifalar uchun.
 * Faza nomi va kelajakda qoʻshiladigan funksiyalar roʻyxatini koʻrsatadi.
 */
export function PlaceholderPage({
  icon,
  title,
  subtitle,
  phase,
  features,
}: PlaceholderPageProps) {
  return (
    <div className="p-6 lg:p-8">
      <PageHeader icon={icon} title={title} subtitle={subtitle} />

      <div className="rounded-xl border border-dashed border-gold-900/40 bg-midnight-900/30 p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
            <Construction className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">
            {phase}
          </p>
          <h2 className="mt-2 text-lg font-bold text-gold-100">
            Bu boʻlim ishlanmoqda
          </h2>
          <p className="mt-2 text-sm text-gold-700">
            Keyingi fazada bu yerga quyidagi funksiyalar qoʻshiladi:
          </p>
        </div>

        <ul className="mx-auto mt-6 max-w-md space-y-2">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg bg-midnight-800/40 px-3 py-2 text-sm text-gold-200/80"
            >
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold-500/15 text-[10px] font-bold text-gold-400">
                {i + 1}
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
