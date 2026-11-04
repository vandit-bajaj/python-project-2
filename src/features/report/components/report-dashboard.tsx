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
  AlertTriangle,
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
    if (confirm('Permanently delete all stored scans, reports, and transient buffers from your device? This cannot be undone.')) {
      await deleteAllUserData();
      setDataDeleted(true);
    }
  };

  const getScoreVerdict = (score: number) => {
    if (score >= 85) return { label: 'Optimal Balance', color: 'text-teal-600 dark:text-teal-400' };
    if (score >= 70) return { label: 'Healthy / Mild Reactivity', color: 'text-teal-600 dark:text-teal-400' };
    if (score >= 50) return { label: 'Moderate Sensitivity', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'High Sensitivity / Active Care', color: 'text-rose-600 dark:text-rose-400' };
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
          All transient images, IndexedDB reports, and local cache entries have been permanently erased from this browser.
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
      {/* Top Banner Actions & Legal Notice */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Client-Side Offline Report
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Facial Wellness Insights</h1>
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
            <Button size="sm" onClick={onNewScan} className="bg-teal-600 text-xs text-white hover:bg-teal-700">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              New Scan
            </Button>
          ) : (
            <Link href="/scan">
              <Button size="sm" className="bg-teal-600 text-xs text-white hover:bg-teal-700">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                New Scan
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Prominent Non-Medical Disclaimer Alert */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="font-semibold">Non-Medical Educational Wellness Report</p>
          <p className="leading-relaxed opacity-90">{report.disclaimer}</p>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Overall Score Card */}
        <div className="lg:col-span-4">
          <Card className="h-full border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Skin-Wellness Score
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-[var(--foreground)]">
                  {report.overallScore}
                </span>
                <span className="text-sm font-medium text-[var(--muted-foreground)]">/ 100</span>
              </div>
              <p className={`mt-2 text-sm font-bold ${verdict.color}`}>{verdict.label}</p>
              <p className="mt-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                Aggregated composite index factoring erythema, texture smoothness, sebum balance, and pigment uniformity.
              </p>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Skin Phototype:</span>
                <Badge variant="outline" className="text-[11px] font-semibold">
                  Fitzpatrick Type {report.baseline.fitzpatrickScale}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Analysis Confidence:</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {Math.round(report.confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 pt-2 text-[11px] text-teal-700 dark:text-teal-300">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Zero network egress &bull; Analyzed locally</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Interactive 3D / Heatmap Visualizer */}
        <div className="lg:col-span-8">
          <Card className="border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
            {/* Visualizer Mode Switcher */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex gap-1.5">
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

            {/* Visualizer Content */}
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
                    zoneScores={report.metrics[selectedMetric]?.perZone ?? report.metrics.redness.perZone}
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

      {/* Detailed Metrics Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Per-Attribute Breakdown</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Individual wellness indicators scored 0–100 with zone breakdown and localized confidence metrics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(report.metrics).map((m) => (
            <Card
              key={m.metricId}
              className="border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-all hover:shadow-md"
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
                <CardTitle className="text-base font-semibold">{m.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-[var(--foreground)]">{m.score}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {m.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
