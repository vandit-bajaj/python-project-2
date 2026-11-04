import { cn } from '@/shared/lib/utils';
import type { QualityAssessment } from '../types';

export interface FaceGuideOverlayProps {
  quality: QualityAssessment | null;
  className?: string;
}

export function FaceGuideOverlay({ quality, className }: FaceGuideOverlayProps) {
  const isAcceptable = quality?.isAcceptable ?? false;
  const strokeColor = isAcceptable ? '#0d9488' : '#d97706'; // Teal if aligned, amber if adjusting

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center',
        className,
      )}
    >
      <svg
        className="h-full w-full max-w-md p-4 transition-colors duration-300"
        viewBox="0 0 400 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Soft vignette mask outside oval */}
        <defs>
          <mask id="faceGuideMask">
            <rect width="400" height="500" fill="white" />
            <ellipse cx="200" cy="240" rx="120" ry="160" fill="black" />
          </mask>
        </defs>

        <rect width="400" height="500" fill="black" fillOpacity="0.25" mask="url(#faceGuideMask)" />

        {/* Main Oval Guide */}
        <ellipse
          cx="200"
          cy="240"
          rx="120"
          ry="160"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray={isAcceptable ? 'none' : '8 6'}
          className="transition-all duration-300"
        />

        {/* Horizontal eye-level alignment line */}
        <line
          x1="160"
          y1="210"
          x2="240"
          y2="210"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="4 4"
        />

        {/* Vertical facial symmetry line */}
        <line
          x1="200"
          y1="160"
          x2="200"
          y2="320"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="4 4"
        />

        {/* Corner guide brackets */}
        <path
          d="M 60 70 L 40 70 L 40 90"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 340 70 L 360 70 L 360 90"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 40 410 L 40 430 L 60 430"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 360 410 L 360 430 L 340 430"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
