# ADR-003: Landmark Segmentation, Exclusion Masking & Skin-Tone Baseline Calibration

## Status

Accepted

## Date

2026-11-04

## Context

DermaLens extracts skin wellness insights (redness, acne, oiliness, texture) from facial images. Raw computer vision analysis on arbitrary face crops faces three critical challenges:

1. **Non-Skin Feature Interference**: Hair, lips, eyebrows, eye sclera, pupils, and background surfaces heavily skew color histograms, edge gradients, and specular reflection detectors.
2. **Skin-Tone Bias & Lighting Variance**: Different ambient illuminants (e.g., warm incandescent vs. cold fluorescent) and natural variations across the Fitzpatrick phototype spectrum (I–VI) can cause classical computer vision heuristics to misidentify natural pigmentation or erythema as defects.
3. **Main-Thread Responsiveness**: MediaPipe landmark detection involves tens of thousands of floating-point neural computations that would cause frame drops if executed on the browser's main UI thread.

## Decision

1. **Web Worker Offloading via Comlink**:
   - MediaPipe Face Landmarker runs exclusively inside a dedicated Web Worker (`face-mesh.worker.ts`), using self-hosted WASM binaries (`/wasm/vision_wasm_internal.*`) and task models (`/models/face_landmarker.task`).
   - The worker initializes with a GPU delegate for WebGL acceleration and automatically falls back to CPU WASM if GPU acceleration is unavailable.
2. **Deterministic Scanline Polygon Rasterization**:
   - 478 MediaPipe landmark indices are mapped to distinct anatomical facial zones (forehead, left/right cheeks, nose, chin, t-zone, under-eyes, and jawline).
   - Zone masks and exclusion masks (eyes, lips, brows) are rasterized using a pure Ray-Casting algorithm in CPU typed arrays (`Uint8ClampedArray`), with no DOM or canvas dependencies.
   - The skin ROI mask performs boolean subtraction of non-skin regions and applies a 3x3 separable box blur for edge feathering, eliminating boundary threshold artifacts.
3. **Lighting Normalization & Individual Typology Angle (ITA)**:
   - Chromatic adaptation normalizes ambient color casts using skin-weighted Von Kries scaling.
   - Images are converted to CIE LAB color space ($L^*, a^*, b^*$).
   - The user's baseline skin phototype is estimated via the Individual Typology Angle:
     $$\text{ITA} = \left(\arctan\left(\frac{L^* - 50}{b^*}\right)\right) \times \frac{180}{\pi}$$
     and categorized across Fitzpatrick phototypes I through VI.
   - Subsequent analyzers in Phase 3 measure anomalies *relative to this individual user baseline*, guaranteeing equitable and unbiased scoring across diverse complexions.

## Consequences

- Zero main-thread UI jank during landmark detection and zone segmentation.
- Robust isolation of valid skin pixels from facial hair, eyes, and lips.
- Scientifically grounded skin-tone baseline calibration ensures fairness and prevents false positives across Fitzpatrick types I–VI.
