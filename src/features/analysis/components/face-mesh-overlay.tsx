'use client';

import { useId, useMemo } from 'react';
import type { NormalizedLandmark, ZoneId } from '@/shared/types';
import { ZONE_LANDMARK_MAP, LANDMARK_INDEXES } from '../lib/landmarks-definitions';

interface FaceMeshOverlayProps {
  landmarks: NormalizedLandmark[];
  activeZone?: ZoneId | null;
  onSelectZone?: (zone: ZoneId) => void;
  showMesh?: boolean;
  showZones?: boolean;
  className?: string;
}

const ZONE_LABELS: Record<ZoneId, string> = {
  forehead: 'Forehead',
  leftCheek: 'Left Cheek',
  rightCheek: 'Right Cheek',
  nose: 'Nose',
  chin: 'Chin',
  tZone: 'T-Zone',
  underEyeLeft: 'Left Under-Eye',
  underEyeRight: 'Right Under-Eye',
  jawline: 'Jawline',
};

export function FaceMeshOverlay({
  landmarks,
  activeZone = null,
  onSelectZone,
  showMesh = true,
  showZones = true,
  className = '',
}: FaceMeshOverlayProps) {
  const filterId = useId();

  // Pre-calculate SVG polygon points for each zone
  const zonePolygons = useMemo(() => {
    if (!landmarks || landmarks.length === 0) return {};

    const polys: Partial<Record<ZoneId, string>> = {};
    for (const [zoneKey, indices] of Object.entries(ZONE_LANDMARK_MAP) as [ZoneId, readonly number[]][]) {
      const points = indices
        .map((idx) => {
          const lm = landmarks[idx];
          return lm ? `${lm.x * 100},${lm.y * 100}` : null;
        })
        .filter(Boolean)
        .join(' ');

      polys[zoneKey] = points;
    }
    return polys;
  }, [landmarks]);

  // Pre-calculate line paths for key facial features (eyes, lips, contours)
  const featurePaths = useMemo(() => {
    if (!landmarks || landmarks.length === 0) return [];

    const featureKeys: (keyof typeof LANDMARK_INDEXES)[] = [
      'faceContour',
      'leftEye',
      'rightEye',
      'lips',
      'leftEyebrow',
      'rightEyebrow',
      'nose',
    ];

    return featureKeys.map((key) => {
      const indices = LANDMARK_INDEXES[key];
      const d = indices
        .map((idx, i) => {
          const lm = landmarks[idx];
          if (!lm) return '';
          return `${i === 0 ? 'M' : 'L'} ${lm.x * 100} ${lm.y * 100}`;
        })
        .filter(Boolean)
        .join(' ');
      return { key, d };
    });
  }, [landmarks]);

  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 pointer-events-auto h-full w-full select-none ${className}`}
      aria-label="Facial landmark topology and skin zones visualizer"
      role="region"
    >
      <defs>
        <radialGradient id={`glow-${filterId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Feature contour wireframes */}
      {showMesh && (
        <g className="transition-opacity duration-300" opacity={0.6}>
          {featurePaths.map(({ key, d }) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="vector-effect-non-scaling-stroke opacity-70"
            />
          ))}

          {/* Key landmark points */}
          {landmarks.filter((_, i) => i % 4 === 0).map((lm, i) => (
            <circle
              key={i}
              cx={lm.x * 100}
              cy={lm.y * 100}
              r="0.35"
              fill="#22d3ee"
              className="transition-all hover:r-1"
            />
          ))}
        </g>
      )}

      {/* Interactive Zones */}
      {showZones && (
        <g>
          {(Object.entries(zonePolygons) as [ZoneId, string][]).map(([zoneId, points]) => {
            const isActive = activeZone === zoneId;
            return (
              <polygon
                key={zoneId}
                points={points}
                fill={isActive ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.03)'}
                stroke={isActive ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth={isActive ? '0.6' : '0.2'}
                strokeDasharray={isActive ? 'none' : '0.5, 0.5'}
                className="cursor-pointer transition-all duration-200 hover:fill-cyan-500/25 hover:stroke-cyan-400"
                onClick={() => onSelectZone?.(zoneId)}
                aria-label={ZONE_LABELS[zoneId]}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectZone?.(zoneId);
                  }
                }}
              >
                <title>{ZONE_LABELS[zoneId]}</title>
              </polygon>
            );
          })}
        </g>
      )}
    </svg>
  );
}
