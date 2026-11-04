'use client';

import { useState, useRef, useEffect } from 'react';
import type { ZoneId } from '@/shared/types';
import type { FaceUnderstandingResult } from '../types';
import { FaceMeshOverlay } from './face-mesh-overlay';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Eye, Layers, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

interface FaceUnderstandingViewProps {
  bitmap: ImageBitmap;
  result: FaceUnderstandingResult;
  onRetake: () => void;
  onProceed?: () => void;
}

const FITZPATRICK_DESCRIPTIONS: Record<number, { name: string; desc: string; color: string }> = {
  1: { name: 'Type I', desc: 'Very Light / Pale', color: 'bg-[#fef2f2] text-amber-900 border-amber-200' },
  2: { name: 'Type II', desc: 'Light / Fair', color: 'bg-[#fffbeb] text-amber-900 border-amber-200' },
  3: { name: 'Type III', desc: 'Medium / Olive Undertone', color: 'bg-[#fef3c7] text-amber-950 border-amber-300' },
  4: { name: 'Type IV', desc: 'Moderate Brown / Olive', color: 'bg-[#fed7aa] text-amber-950 border-amber-400' },
  5: { name: 'Type V', desc: 'Dark Brown', color: 'bg-[#d97706] text-white border-amber-600' },
  6: { name: 'Type VI', desc: 'Deeply Pigmented Dark', color: 'bg-[#78350f] text-white border-amber-800' },
};

const ZONES_LIST: { id: ZoneId; label: string }[] = [
  { id: 'forehead', label: 'Forehead' },
  { id: 'tZone', label: 'T-Zone' },
  { id: 'nose', label: 'Nose' },
  { id: 'leftCheek', label: 'Left Cheek' },
  { id: 'rightCheek', label: 'Right Cheek' },
  { id: 'underEyeLeft', label: 'Left Under-Eye' },
  { id: 'underEyeRight', label: 'Right Under-Eye' },
  { id: 'chin', label: 'Chin' },
  { id: 'jawline', label: 'Jawline' },
];

export function FaceUnderstandingView({
  bitmap,
  result,
  onRetake,
  onProceed,
}: FaceUnderstandingViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneId | null>('forehead');
  const [showMesh, setShowMesh] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);

  // Draw bitmap to preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
      }
    } catch {
      // In-memory bitmap may have been closed or detached
    }
  }, [bitmap]);

  const fitzInfo = FITZPATRICK_DESCRIPTIONS[result.baseline.fitzpatrickScale] ?? FITZPATRICK_DESCRIPTIONS[3]!;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Face Mesh Viewer */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-lg">
            <div className="relative aspect-3/4 w-full overflow-hidden bg-black/90">
              <canvas
                ref={canvasRef}
                className="h-full w-full object-contain"
                aria-label="Captured facial portrait"
              />

              {/* Real-time Face Mesh & Zone Overlay */}
              <FaceMeshOverlay
                landmarks={result.landmarks}
                activeZone={activeZone}
                onSelectZone={setActiveZone}
                showMesh={showMesh}
                showZones={showZones}
              />

              {/* View Overlay Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-black/60 p-2 backdrop-blur-md">
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant={showMesh ? 'default' : 'secondary'}
                    className="h-7 text-xs"
                    onClick={() => setShowMesh((v) => !v)}
                  >
                    <Layers className="mr-1.5 h-3.5 w-3.5" />
                    Mesh {showMesh ? 'On' : 'Off'}
                  </Button>
                  <Button
                    size="sm"
                    variant={showZones ? 'default' : 'secondary'}
                    className="h-7 text-xs"
                    onClick={() => setShowZones((v) => !v)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Zones {showZones ? 'On' : 'Off'}
                  </Button>
                </div>
                <span className="text-[10px] text-white/70">
                  {result.landmarks.length} Landmarks Detected
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Details & Calibration Data */}
        <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
          <div className="space-y-4">
            {/* Tone Calibration Card */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Skin-Tone Baseline</CardTitle>
                  <Badge variant="outline" className={`px-2 py-0.5 text-xs font-semibold ${fitzInfo.color}`}>
                    {fitzInfo.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  Calibrated via chromatic adaptation and Individual Typology Angle (ITA) to ensure unbiased skin-wellness metric scoring.
                </p>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--muted)]/50 p-3 text-center">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Lightness L*</span>
                    <span className="text-sm font-bold">{result.baseline.baselineLightness}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Redness a*</span>
                    <span className="text-sm font-bold">{result.baseline.baselineRedness}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Melanin Idx</span>
                    <span className="text-sm font-bold">{result.baseline.baselineMelanin}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zone Selector */}
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Segmented Facial Zones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {ZONES_LIST.map((zone) => {
                    const isSelected = activeZone === zone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setActiveZone(zone.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80 hover:text-[var(--foreground)]'
                        }`}
                      >
                        {zone.label}
                      </button>
                    );
                  })}
                </div>
                <p className="pt-2 text-[11px] text-[var(--muted-foreground)]">
                  Click any zone button or polygon overlay to inspect segmented boundaries.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {onProceed && (
              <Button
                size="lg"
                className="w-full font-semibold shadow-md"
                onClick={onProceed}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Skin Metrics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="w-full text-xs font-medium"
              onClick={onRetake}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Retake / Discard Photo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
