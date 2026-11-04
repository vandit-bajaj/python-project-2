'use client';

import { useMemo, useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import type { NormalizedLandmark, MetricId } from '@/shared/types';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';
import { computeFaceTriangulation, computeFaceUVs } from '../lib/face-triangulation';
import { createHeatmapImageData } from '../lib/heatmap-colorizer';
import { Button } from '@/shared/ui/button';
import { Rotate3d, Layers, Eye } from 'lucide-react';

const emptySubscribe = () => () => {};

interface Face3DViewerProps {
  landmarks: NormalizedLandmark[];
  report: ComprehensiveSkinReport;
  faceBitmap?: ImageBitmap | null;
  className?: string;
}

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

interface FaceMeshProps {
  landmarks: NormalizedLandmark[];
  indices: Uint16Array;
  faceBitmap?: ImageBitmap | null;
  report: ComprehensiveSkinReport;
  activeMetric: MetricId;
  showHeatmap: boolean;
  wireframe: boolean;
}

function FaceMesh({
  landmarks,
  indices,
  faceBitmap,
  report,
  activeMetric,
  showHeatmap,
  wireframe,
}: FaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate buffer geometry centered at origin
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = landmarks.length;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const lm = landmarks[i]!;
      positions[i * 3] = (lm.x - 0.5) * 2.0;
      positions[i * 3 + 1] = -(lm.y - 0.5) * 2.0;
      positions[i * 3 + 2] = -(lm.z ?? 0) * 2.0;
    }

    const uvs = computeFaceUVs(landmarks);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    return geo;
  }, [landmarks, indices]);

  // Generate texture with optional heatmap blend
  const texture = useMemo(() => {
    if (!faceBitmap) return null;

    try {
      const texWidth = report.imageWidth || faceBitmap.width || 400;
      const texHeight = report.imageHeight || faceBitmap.height || 500;

      const canvas = document.createElement('canvas');
      canvas.width = texWidth;
      canvas.height = texHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(faceBitmap, 0, 0, texWidth, texHeight);

      if (showHeatmap && report.metrics[activeMetric]) {
        const heatmapData = report.metrics[activeMetric].heatmap;
        const heatmapImg = createHeatmapImageData(heatmapData, texWidth, texHeight);
        const hmCanvas = document.createElement('canvas');
        hmCanvas.width = texWidth;
        hmCanvas.height = texHeight;
        hmCanvas.getContext('2d')?.putImageData(heatmapImg, 0, 0);

        ctx.globalAlpha = 0.65;
        ctx.drawImage(hmCanvas, 0, 0);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    } catch {
      return null;
    }
  }, [faceBitmap, report, activeMetric, showHeatmap]);

  useEffect(() => {
    return () => {
      texture?.dispose();
      geometry.dispose();
    };
  }, [texture, geometry]);

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#0d9488'}
          roughness={0.55}
          metalness={0.1}
          wireframe={wireframe}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Center>
  );
}

export function Face3DViewer({
  landmarks,
  report,
  faceBitmap,
  className = '',
}: Face3DViewerProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const webGLSupported = useSyncExternalStore(
    emptySubscribe,
    () => isWebGLAvailable(),
    () => true,
  );

  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [activeMetric, setActiveMetric] = useState<MetricId>('redness');
  const [showHeatmapTexture, setShowHeatmapTexture] = useState<boolean>(true);

  const indices = useMemo(() => {
    return computeFaceTriangulation(landmarks);
  }, [landmarks]);

  if (!isMounted) {
    return (
      <div
        className={`relative flex aspect-3/4 w-full items-center justify-center overflow-hidden rounded-2xl bg-black/95 ${className}`}
      >
        <Rotate3d className="h-8 w-8 animate-spin text-teal-400/60" />
      </div>
    );
  }

  if (!webGLSupported || landmarks.length === 0 || indices.length === 0) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-8 text-center">
        <Rotate3d className="h-10 w-10 text-[var(--muted-foreground)]" />
        <p className="mt-3 text-sm font-semibold">3D WebGL Acceleration Unavailable</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Rendering high-fidelity 2D heatmap view on your device.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black/95 shadow-xl ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div
        className="aspect-3/4 w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D facial topology model"
        role="img"
      >
        <Canvas
          camera={{ position: [0, 0, 2.3], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[1, 2, 3]} intensity={0.8} />
          <directionalLight position={[-1, -1, 2]} intensity={0.3} />
          <FaceMesh
            landmarks={landmarks}
            indices={indices}
            faceBitmap={faceBitmap}
            report={report}
            activeMetric={activeMetric}
            showHeatmap={showHeatmapTexture}
            wireframe={wireframeMode}
          />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 3}
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>
      </div>

      {/* Floating 3D Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 rounded-xl bg-black/60 p-1.5 backdrop-blur-md">
        <Button
          size="sm"
          variant={wireframeMode ? 'default' : 'secondary'}
          className="h-7 text-xs"
          onClick={() => setWireframeMode((v) => !v)}
        >
          <Layers className="mr-1 h-3.5 w-3.5" />
          Wireframe
        </Button>
        <Button
          size="sm"
          variant={showHeatmapTexture ? 'default' : 'secondary'}
          className="h-7 text-xs"
          onClick={() => setShowHeatmapTexture((v) => !v)}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          Heatmap
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between rounded-xl bg-black/70 px-3 py-2 text-[11px] text-white/80 backdrop-blur-md">
        <span>Drag or swipe to rotate 3D head mesh</span>
        <select
          value={activeMetric}
          onChange={(e) => setActiveMetric(e.target.value as MetricId)}
          className="rounded-lg border border-white/20 bg-black/50 px-2 py-1 text-[11px] text-white focus:outline-none"
        >
          <option value="redness">Redness Heatmap</option>
          <option value="acne">Blemishes Heatmap</option>
          <option value="pigmentation">Pigmentation Heatmap</option>
          <option value="oiliness">Oiliness Heatmap</option>
          <option value="texture">Texture Roughness</option>
        </select>
      </div>
    </div>
  );
}
