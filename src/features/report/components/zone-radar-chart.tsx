'use client';

import { useMemo } from 'react';
import type { ZoneId } from '@/shared/types';
import { ZONE_IDS } from '@/shared/types';

interface ZoneRadarChartProps {
  zoneScores: Record<ZoneId, number>;
  metricName?: string;
  className?: string;
}

const ZONE_LABELS: Record<ZoneId, string> = {
  forehead: 'Forehead',
  tZone: 'T-Zone',
  nose: 'Nose',
  leftCheek: 'L Cheek',
  rightCheek: 'R Cheek',
  underEyeLeft: 'L Under-Eye',
  underEyeRight: 'R Under-Eye',
  chin: 'Chin',
  jawline: 'Jawline',
};

export function ZoneRadarChart({
  zoneScores,
  metricName = 'Skin Metric',
  className = '',
}: ZoneRadarChartProps) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;
  const numAxes = ZONE_IDS.length;

  const points = useMemo(() => {
    return ZONE_IDS.map((zoneId, i) => {
      const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
      const score = Math.max(0, Math.min(100, zoneScores[zoneId] ?? 100));
      const r = (score / 100) * maxRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);

      // Label coordinate outside the radius
      const labelRadius = maxRadius + 22;
      const lx = center + labelRadius * Math.cos(angle);
      const ly = center + labelRadius * Math.sin(angle);

      return {
        zoneId,
        score,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        lx: Math.round(lx * 10) / 10,
        ly: Math.round(ly * 10) / 10,
        label: ZONE_LABELS[zoneId],
      };
    });
  }, [zoneScores, numAxes, center, maxRadius]);

  const polygonPath = useMemo(() => {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }, [points]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full max-w-[320px] select-none"
        aria-label={`Zone distribution radar chart for ${metricName}`}
        role="img"
      >
        {/* Concentric Grid Guides */}
        {[25, 50, 75, 100].map((level) => {
          const r = (level / 100) * maxRadius;
          return (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeDasharray="2, 2"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
            />
          );
        })}

        {/* Radial Axis Lines */}
        {points.map((p, i) => {
          const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
          const ax = center + maxRadius * Math.cos(angle);
          const ay = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={p.zoneId}
              x1={center}
              y1={center}
              x2={ax}
              y2={ay}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Metric Polygon */}
        <polygon
          points={polygonPath}
          fill="rgba(13, 148, 136, 0.25)"
          stroke="#0d9488"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Data Point Markers */}
        {points.map((p) => (
          <circle
            key={p.zoneId}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#0d9488"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="transition-all"
          >
            <title>{`${p.label}: ${p.score}/100`}</title>
          </circle>
        ))}

        {/* Zone Labels */}
        {points.map((p) => (
          <text
            key={p.zoneId}
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[var(--muted-foreground)] text-[9px] font-medium"
          >
            {p.label}
          </text>
        ))}
      </svg>

      {/* Screen Reader Accessible Table */}
      <table className="sr-only">
        <caption>{`Facial Zone Breakdown for ${metricName}`}</caption>
        <thead>
          <tr>
            <th>Zone</th>
            <th>Score (0-100)</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.zoneId}>
              <td>{p.label}</td>
              <td>{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

