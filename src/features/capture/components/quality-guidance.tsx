import { Sun, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { QualityAssessment } from '../types';

export interface QualityGuidanceProps {
  quality: QualityAssessment | null;
  className?: string;
}

export function QualityGuidance({ quality, className }: QualityGuidanceProps) {
  if (!quality) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-full bg-slate-900/60 px-4 py-1.5 text-xs text-white backdrop-blur-md',
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-teal-400" />
        <span>Align your face with the guide</span>
      </div>
    );
  }

  const { isAcceptable, overallMessage, lighting, sharpness, framing } = quality;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Primary Guidance Pill */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md transition-all duration-300',
          isAcceptable ? 'bg-teal-600/90 text-white' : 'bg-amber-600/90 text-white',
        )}
      >
        {isAcceptable ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <span>{overallMessage}</span>
      </div>

      {/* Secondary Metric Badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        {/* Lighting badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 backdrop-blur-sm',
            lighting.status === 'good'
              ? 'bg-emerald-500/20 text-emerald-200'
              : 'bg-amber-500/20 text-amber-200',
          )}
        >
          <Sun className="h-3 w-3" />
          <span>
            {lighting.status === 'good'
              ? 'Light OK'
              : lighting.status === 'too_dark'
                ? 'Dark'
                : 'Glare'}
          </span>
        </span>

        {/* Sharpness badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 backdrop-blur-sm',
            sharpness.status === 'sharp'
              ? 'bg-emerald-500/20 text-emerald-200'
              : 'bg-amber-500/20 text-amber-200',
          )}
        >
          <span>{sharpness.status === 'sharp' ? 'Sharp' : 'Blurry'}</span>
        </span>

        {/* Framing badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 backdrop-blur-sm',
            framing.status === 'centered'
              ? 'bg-emerald-500/20 text-emerald-200'
              : 'bg-amber-500/20 text-amber-200',
          )}
        >
          <span>{framing.status === 'centered' ? 'Centered' : 'Off-center'}</span>
        </span>
      </div>
    </div>
  );
}
