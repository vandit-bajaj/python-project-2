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
  // Generous 340x340 coordinate space with 95px radius provides ample margin on all sides
  const size = 340;
  const center = size / 2;
  const maxRadius = 95;
  const numAxes = ZONE_IDS.length;

  const points = useMemo(() => {
    return ZONE_IDS.map((zoneId, i) => {
      const angle = (i / numAxes) * 2 * Math.PI - Math.PI / 2;
      const score = Math.max(0, Math.min(100, zoneScores[zoneId] ?? 100));
      const r = (score / 100) * maxRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);

      // Label coordinate comfortably positioned outside the outer grid
      const labelRadius = maxRadius + 26;
      const lx = center + labelRadius * Math.cos(angle);
      const ly = center + labelRadius * Math.sin(angle);

      // Dynamic text anchor based on angle to avoid edge clipping
      const cosVal = Math.cos(angle);
      let textAnchor: 'start' | 'end' | 'middle' = 'middle';
      if (cosVal > 0.15) textAnchor = 'start';
      else if (cosVal < -0.15) textAnchor = 'end';

      return {
        zoneId,
        score,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        lx: Math.round(lx * 10) / 10,
        ly: Math.round(ly * 10) / 10,
        label: ZONE_LABELS[zoneId],
        textAnchor,
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
        className="h-full w-full max-w-[340px] select-none"
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
              className="text-[var(--border)]"
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
              className="text-[var(--border)]"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Metric Polygon */}
        <polygon
          points={polygonPath}
          fill="rgba(15, 118, 110, 0.2)"
          stroke="var(--primary)"
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
            fill="var(--primary)"
            stroke="var(--card)"
            strokeWidth="1.5"
            className="transition-all"
          >
            <title>{`${p.label}: ${p.score}/100`}</title>
          </circle>
        ))}

        {/* Zone Labels with Dynamic Anchor */}
        {points.map((p) => (
          <text
            key={p.zoneId}
            x={p.lx}
            y={p.ly}
            textAnchor={p.textAnchor}
            dominantBaseline="central"
            className="fill-[var(--muted-foreground)] text-[10px] font-medium"
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
