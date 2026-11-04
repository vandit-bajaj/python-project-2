import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-[var(--primary)] text-white shadow-xs',
    secondary: 'border-transparent bg-[var(--muted)] text-[var(--foreground)]',
    outline: 'text-[var(--foreground)] border border-[var(--border)] bg-transparent',
    destructive: 'border-transparent bg-rose-600 text-white',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
        variantStyles,
        className,
      )}
      {...props}
    />
  );
}

export { Badge };

