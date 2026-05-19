import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Modal — qayta ishlatiladigan dialog wrapper.
 * - Backdrop blur + click-to-close
 * - Escape bilan yopish
 * - Scroll lock
 * - 4 ta o'lcham
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  width = 'md',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full overflow-hidden rounded-2xl border border-gold-900/30 bg-midnight-900 shadow-2xl shadow-black/80 animate-fade-in-up',
            WIDTHS[width],
            'max-h-[90vh] flex flex-col',
          )}
        >
          {(title || subtitle) && (
            <div className="flex items-start justify-between gap-4 border-b border-gold-900/30 px-5 py-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="font-display text-lg font-bold text-gold-100">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-xs text-gold-700">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gold-300/70 transition-colors hover:bg-midnight-700/40 hover:text-gold-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {children}
          </div>

          {footer && (
            <div className="border-t border-gold-900/30 bg-midnight-950/40 px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
