import { type LucideIcon, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'gold' | 'admin' | 'emerald' | 'amber' | 'blue';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: { value: number; label?: string };
  accent?: AccentColor;
  loading?: boolean;
}

const ACCENT_CLASSES: Record<
  AccentColor,
  { icon: string; bg: string; ring: string }
> = {
  gold: {
    icon: 'text-gold-300',
    bg: 'bg-gold-500/10',
    ring: 'ring-gold-500/20',
  },
  admin: {
    icon: 'text-admin-300',
    bg: 'bg-admin-500/10',
    ring: 'ring-admin-500/20',
  },
  emerald: {
    icon: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    icon: 'text-amber-300',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  blue: {
    icon: 'text-blue-300',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  accent = 'gold',
  loading,
}: StatCardProps) {
  const accentCls = ACCENT_CLASSES[accent];
  const deltaPositive = delta && delta.value > 0;
  const deltaNegative = delta && delta.value < 0;

  return (
    <div className="rounded-xl border border-gold-900/30 bg-midnight-900/50 p-5 transition-colors hover:border-gold-900/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-gold-700">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gold-700" />
            ) : (
              <span className="text-2xl font-bold text-gold-100">{value}</span>
            )}
          </div>
          {delta && !loading && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs',
                deltaPositive && 'text-emerald-400',
                deltaNegative && 'text-admin-400',
                delta.value === 0 && 'text-gold-700',
              )}
            >
              {deltaPositive && <TrendingUp className="h-3 w-3" />}
              {deltaNegative && <TrendingDown className="h-3 w-3" />}
              <span>
                {delta.value > 0 ? '+' : ''}
                {delta.value}% {delta.label && `· ${delta.label}`}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1',
            accentCls.bg,
            accentCls.ring,
          )}
        >
          <Icon className={cn('h-5 w-5', accentCls.icon)} />
        </div>
      </div>
    </div>
  );
}
