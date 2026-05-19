import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * PageHeader — har bir admin sahifasining yuqori qismi.
 * Standart koʻrinish: ikonka + sarlavha + subtitle + (ixtiyoriy) action tugma.
 */
export function PageHeader({ icon: Icon, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-admin-500/10 ring-1 ring-admin-500/30">
          <Icon className="h-5 w-5 text-admin-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gold-700">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
