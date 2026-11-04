'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { NormalizedLandmark, MetricId } from '@/shared/types';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';
import { computeFaceTriangulation } from '../lib/face-triangulation';
import { createHeatmapImageData } from '../lib/heatmap-colorizer';
import { Button } from '@/shared/ui/button';
import { Rotate3d, Layers, Eye } from 'lucide-react';

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

export function Face3DViewer({
  landmarks,
  report,
  faceBitmap,
  className = '',
}: Face3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGLSupported] = useState<boolean>(() => isWebGLAvailable());
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [activeMetric, setActiveMetric] = useState<MetricId>('redness');
  const [showHeatmapTexture, setShowHeatmapTexture] = useState<boolean>(true);

  // Pre-calculate Delaunay triangle index array
  const indices = useMemo(() => {
    return computeFaceTriangulation(landmarks);
  }, [landmarks]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !landmarks || landmarks.length === 0 || indices.length === 0) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    let cleanupFn: (() => void) | undefined;

    try {
      // 1. Scene setup
      const scene = new THREE.Scene();
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 450;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 2.5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(1, 2, 3);
      scene.add(dirLight);

      // 2. Build 3D Mesh Geometry
      const geometry = new THREE.BufferGeometry();
      const vertexCount = landmarks.length;
      const positions = new Float32Array(vertexCount * 3);
      const uvs = new Float32Array(vertexCount * 2);

      for (let i = 0; i < vertexCount; i++) {
        const lm = landmarks[i]!;
        positions[i * 3] = (lm.x - 0.5) * 2.2;
        positions[i * 3 + 1] = -(lm.y - 0.5) * 2.2;
        positions[i * 3 + 2] = -(lm.z ?? 0) * 2.2;

        uvs[i * 2] = lm.x;
        uvs[i * 2 + 1] = 1.0 - lm.y;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      geometry.computeVertexNormals();

      // 3. Create textures
      let texture: THREE.Texture | null = null;

      const texWidth = report.imageWidth || (faceBitmap?.width ?? 400);
      const texHeight = report.imageHeight || (faceBitmap?.height ?? 500);

      if (faceBitmap) {
        try {
          const texCanvas = document.createElement('canvas');
          texCanvas.width = texWidth;
          texCanvas.height = texHeight;
          const ctx = texCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(faceBitmap, 0, 0, texWidth, texHeight);

            // If heatmap mode enabled, blend heatmap onto texture
            if (showHeatmapTexture && report.metrics[activeMetric]) {
              const heatmapData = report.metrics[activeMetric].heatmap;
              const heatmapImg = createHeatmapImageData(heatmapData, texWidth, texHeight);
              const hmCanvas = document.createElement('canvas');
              hmCanvas.width = texWidth;
              hmCanvas.height = texHeight;
              hmCanvas.getContext('2d')?.putImageData(heatmapImg, 0, 0);

              ctx.globalAlpha = 0.65;
              ctx.drawImage(hmCanvas, 0, 0);
            }

            texture = new THREE.CanvasTexture(texCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
          }
        } catch {
          // Handled if bitmap is detached
        }
      }

      // Material
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        color: texture ? 0xffffff : 0x0d9488,
        roughness: 0.6,
        metalness: 0.1,
        wireframe: wireframeMode,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Mouse drag rotation controls
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;
      let targetRotY = 0;
      let targetRotX = 0;

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
        targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const domElem = renderer.domElement;
      domElem.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Render loop with smooth damping
      const animate = () => {
        mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;
        mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;

        renderer?.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();

      cleanupFn = () => {
        cancelAnimationFrame(animationFrameId);
        domElem.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        geometry.dispose();
        material.dispose();
        texture?.dispose();
        if (renderer) {
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        }
      };
    } catch {
      // Graceful fallback handled by initial webGLSupported check
    }

    return () => {
      cleanupFn?.();
    };
  }, [landmarks, indices, faceBitmap, wireframeMode, showHeatmapTexture, activeMetric, report]);

  if (!webGLSupported) {
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
        ref={containerRef}
        className="aspect-3/4 w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D facial topology model"
        role="img"
      />

      {/* Floating 3D Controls */}
      <div className="absolute top-3 right-3 flex gap-1.5 rounded-xl bg-black/60 p-1.5 backdrop-blur-md">
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

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-black/70 px-3 py-2 text-[11px] text-white/80 backdrop-blur-md">
        <span>Drag to rotate 3D head mesh</span>
        <select
          value={activeMetric}
          onChange={(e) => setActiveMetric(e.target.value as MetricId)}
          className="rounded-lg bg-black/50 px-2 py-1 text-[11px] text-white border border-white/20 focus:outline-none"
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
