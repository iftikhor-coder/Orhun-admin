import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'gold' | 'admin' | 'emerald' | 'amber' | 'blue' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  gold:    'bg-gold-500/15 text-gold-300 ring-gold-500/30',
  admin:   'bg-admin-500/15 text-admin-300 ring-admin-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  amber:   'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  blue:    'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  neutral: 'bg-white/5 text-gold-300/70 ring-white/10',
};

/**
 * Badge — rangli yorliq (admin, banlangan, faol va h.k.)
 */
export function Badge({ variant = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1',
        VARIANTS[variant],
        className,
      )}
    >
      {icon && <span className="h-3 w-3">{icon}</span>}
      {children}
    </span>
  );
}
