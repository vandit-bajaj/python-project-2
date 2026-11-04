import { ShieldCheck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface PrivacyBadgeProps {
  className?: string;
  variant?: 'pill' | 'banner';
}

export function PrivacyBadge({ className, variant = 'pill' }: PrivacyBadgeProps) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 p-4 text-xs text-[var(--primary)]',
          className,
        )}
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--primary)]" />
        <div>
          <p className="font-semibold">Local-Only Processing Guarantee</p>
          <p className="text-[var(--muted-foreground)]">
            Your face is analyzed entirely in browser memory. No photos, landmarks, or embeddings
            ever leave this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary)] shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
      <span>Processed 100% on your device</span>
    </div>
  );
}
