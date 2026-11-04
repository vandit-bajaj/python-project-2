import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-teal-600 text-white shadow hover:bg-teal-700',
    secondary: 'border-transparent bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80',
    outline: 'text-[var(--foreground)] border border-[var(--border)]',
    destructive: 'border-transparent bg-rose-600 text-white hover:bg-rose-700',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
        variantStyles,
        className,
      )}
      {...props}
    />
  );
}

export { Badge };

