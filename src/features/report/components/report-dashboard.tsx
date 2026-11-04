'use client';

import { useState } from 'react';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';
import type { MetricId, NormalizedLandmark } from '@/shared/types';
import { Face3DViewer } from './face-3d-viewer';
import { HeatmapView } from './heatmap-view';
import { ZoneRadarChart } from './zone-radar-chart';
import { MetricBarChart } from './metric-bar-chart';
import { BeforeAfterSlider } from './before-after-slider';
import { exportReportToPDF } from '../lib/pdf-exporter';
import { deleteAllUserData } from '../lib/storage';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import Link from 'next/link';
import {
  Download,
  Trash2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Rotate3d,
  Layers,
  SplitSquareVertical,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface ReportDashboardProps {
  report: ComprehensiveSkinReport;
  landmarks?: NormalizedLandmark[];
  faceBitmap?: ImageBitmap | null;
  onNewScan?: () => void;
}

function CircularScoreRing({ score }: { score: number }) {
  const radius = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = 'var(--primary)';
  if (score < 50) strokeColor = 'var(--danger)';
  else if (score < 70) strokeColor = 'var(--warning)';

  return (
    <div className="relative flex items-center justify-center py-2">
      <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          className="stroke-[var(--border)] fill-transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold tracking-tight tabular-nums text-[var(--foreground)]">
          {score}
        </span>
        <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          / 100
        </span>
      </div>
    </div>
  );
}

export function ReportDashboard({
  report,
  landmarks = [],
  faceBitmap,
  onNewScan,
}: ReportDashboardProps) {
  const [activeTab, setActiveTab] = useState<'3d' | 'heatmap' | 'slider' | 'radar'>('heatmap');
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('redness');
  const [dataDeleted, setDataDeleted] = useState<boolean>(false);

  const handleDeleteData = async () => {
    if (
      confirm(
        'Permanently delete all stored scans, reports, and transient buffers from your device? This cannot be undone.',
      )
    ) {
      await deleteAllUserData();
      setDataDeleted(true);
    }
  };

  const getScoreVerdict = (score: number) => {
    if (score >= 85) return { label: 'Optimal Balance', color: 'text-teal-700 dark:text-teal-400' };
    if (score >= 70)
      return { label: 'Healthy / Mild Reactivity', color: 'text-teal-700 dark:text-teal-400' };
    if (score >= 50)
      return { label: 'Moderate Sensitivity', color: 'text-amber-700 dark:text-amber-400' };
    return { label: 'High Sensitivity / Active Care', color: 'text-rose-700 dark:text-rose-400' };
  };

  const getToneDescriptor = (type: number) => {
    switch (type) {
      case 1:
        return 'Very Fair / Pale';
      case 2:
        return 'Fair / Light';
      case 3:
        return 'Intermediate';
      case 4:
        return 'Tan / Olive';
      case 5:
        return 'Brown';
      case 6:
        return 'Deep / Dark';
      default:
        return 'Custom';
    }
  };

  const verdict = getScoreVerdict(report.overallScore);

  if (dataDeleted) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">All User Data Purged</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          All transient images, IndexedDB reports, and local cache entries have been permanently
          erased from this browser.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Client-Side Offline Report
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-[var(--foreground)]">
            Facial Wellness Insights
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReportToPDF(report)}
            className="text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteData}
            className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete All My Data
          </Button>

          {onNewScan ? (
            <Button size="sm" onClick={onNewScan} className="text-xs">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              New Scan
            </Button>
          ) : (
            <Link href="/scan">
              <Button size="sm" className="text-xs">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                New Scan
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Prominent Non-Medical Disclaimer (Muted Slate Framing) */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Non-Medical Educational Wellness Report
          </p>
          <p className="leading-relaxed opacity-90">{report.disclaimer}</p>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (4 cols): Score & Calibrated Baseline */}
        <div className="space-y-6 lg:col-span-4">
          {/* Overall Wellness Score Card */}
          <Card className="p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Skin-Wellness Score
              </span>

              {/* Circular Progress Ring */}
              <div className="mt-3">
                <CircularScoreRing score={report.overallScore} />
              </div>

              <div className="text-center mt-2">
                <p className={`text-sm font-bold ${verdict.color}`}>{verdict.label}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Aggregated composite index factoring erythema, texture smoothness, sebum balance,
                  and pigment uniformity.
                </p>
              </div>
            </div>

            {/* Baseline Calibrated Parameters */}
            <div className="mt-6 border-t border-[var(--border)] pt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Skin Phototype:</span>
                <Badge variant="outline" className="text-[11px] font-semibold">
                  Fitzpatrick Type {report.baseline.fitzpatrickScale} •{' '}
                  {getToneDescriptor(report.baseline.fitzpatrickScale)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Lightness L*:</span>
                <span className="font-mono font-medium text-[var(--foreground)]">
                  {report.baseline.baselineLightness}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Melanin Index:</span>
                <span className="font-mono font-medium text-[var(--foreground)]">
                  {report.baseline.baselineMelanin}
                </span>
              </div>
              {report.baseline.ita !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Typology Angle (ITA):</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">
                    {report.baseline.ita > 0 ? '+' : ''}
                    {report.baseline.ita}°
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Analysis Confidence:</span>
                <span className="font-semibold text-[var(--primary)]">
                  {Math.round(report.confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-2 text-[11px] text-[var(--primary)]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Zero network egress • Analyzed locally</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (8 cols): Interactive Visualizer */}
        <div className="lg:col-span-8">
          <Card className="p-4 shadow-xs">
            {/* Visualizer Mode Switcher */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={activeTab === 'heatmap' ? 'default' : 'outline'}
                  className="h-8 text-xs font-semibold"
                  onClick={() => setActiveTab('heatmap')}
                >
                  <Layers className="mr-1.5 h-3.5 w-3.5" />
                  Heatmap Overlay
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === '3d' ? 'default' : 'outline'}
                  className="h-8 text-xs font-semibold"
                  onClick={() => setActiveTab('3d')}
                >
                  <Rotate3d className="mr-1.5 h-3.5 w-3.5" />
                  3D Face Model
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === 'slider' ? 'default' : 'outline'}
                  className="h-8 text-xs font-semibold"
                  onClick={() => setActiveTab('slider')}
                >
                  <SplitSquareVertical className="mr-1.5 h-3.5 w-3.5" />
                  Before / After
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === 'radar' ? 'default' : 'outline'}
                  className="h-8 text-xs font-semibold"
                  onClick={() => setActiveTab('radar')}
                >
                  <Activity className="mr-1.5 h-3.5 w-3.5" />
                  Zone Radar
                </Button>
              </div>
            </div>

            {/* Visualizer Body */}
            {activeTab === 'heatmap' && (
              <HeatmapView report={report} faceBitmap={faceBitmap} />
            )}

            {activeTab === '3d' && (
              <Face3DViewer
                landmarks={landmarks}
                report={report}
                faceBitmap={faceBitmap}
              />
            )}

            {activeTab === 'slider' && (
              <BeforeAfterSlider report={report} faceBitmap={faceBitmap} />
            )}

            {activeTab === 'radar' && (
              <div className="grid gap-6 py-4 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                  <ZoneRadarChart
                    zoneScores={
                      report.metrics[selectedMetric]?.perZone ?? report.metrics.redness.perZone
                    }
                    metricName={report.metrics[selectedMetric]?.name ?? 'Metric'}
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Select Metric For Radar Breakdown
                  </h3>
                  <MetricBarChart
                    metrics={report.metrics}
                    selectedMetric={selectedMetric}
                    onSelectMetric={setSelectedMetric}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Detailed Metrics Grid (4 columns desktop, 2 col tablet, 1 col mob) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Per-Attribute Breakdown
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Individual wellness indicators scored 0–100 with zone breakdown and localized confidence
            metrics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(report.metrics).map((m) => {
            const scorePercent = Math.min(100, Math.max(0, m.score));
            return (
              <Card
                key={m.metricId}
                className="p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      {m.category}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {Math.round(m.confidence * 100)}% conf
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1 text-[var(--foreground)]">
                    {m.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight tabular-nums text-[var(--foreground)]">
                        {m.score}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
                    </div>
                  </div>

                  {/* Subtle Mini Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>

                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {m.summary}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
