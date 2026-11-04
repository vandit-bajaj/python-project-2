# ADR 0007: Rigorous Inspection Rebuild and Zero-Egress Verification

## Status
Accepted

## Context
Following a comprehensive technical inspection by the Principal Engineer and Design Lead (`docs/INSPECTION_REPORT.md`), multiple critical regressions and architectural flaws were discovered in the initial prototype:
1. **Memory Lifecycle & Quality Gate (F-01, F-02, F-03)**: Unacceptable/blurry images bypassed gating, and non-face inputs caused unhandled exceptions or fake landmark renderings.
2. **Anatomical Landmarks & Tone Calibration (F-04, F-05)**: The calibration step failed to display the captured photo behind landmarks, and ITA calculations required robust fallback calibration for diverse lighting conditions.
3. **Metric Analyzer Mathematical Collapse (F-06, F-07)**: Analyzers suffered from binary step-function thresholds collapsing scores to 0 or 100, and heatmaps suffered from stride shearing due to hardcoded dimension assumptions.
4. **Distorted 3D Mesh (F-08, F-09)**: Dynamic 2D Delaunay triangulation bridged closed eyelids, lips, and facial borders, creating webbed visual artifacts, while raw Three.js canvas management lacked robust touch gesture controls.
5. **Visual Design & Mobile Usability (F-10, F-11, F-12)**: Inconsistent color palettes, clipped radar charts on mobile, and small touch targets impaired usability.

## Decisions

### 1. Canonical MediaPipe Face Tesselation & R3F Migration (WP-4)
- Replaced dynamic 2D Bowyer-Watson Delaunay triangulation with the canonical MediaPipe `FACEMESH_TESSELATION` index buffer (852 triangles, 2556 indices).
- Anatomical cavities (eyes, mouth, nostril openings) remain naturally open and unmeshed.
- Migrated 3D viewport to `@react-three/fiber` `<Canvas>`, `@react-three/drei` `<OrbitControls>` and `<Center>`, enabling smooth touch rotation, inertia damping, and automatic bounds fitting with zero clipping.

### 2. Sigmoidal Logistic Score Transfer Function (WP-3)
- Replaced non-linear threshold jumps with continuous logistic functions:
  $$S(x) = \frac{100}{1 + \exp(k(x - x_0))}$$
- Re-calibrated midpoints ($x_0$) and slopes ($k$) across all 8 analyzers (redness, acne, pigmentation, oiliness, texture, dark circles, fine lines, tone evenness), ensuring continuous score distribution $[10, 95]$ and realistic variance across facial zones.
- Embedded `imageWidth` and `imageHeight` into `ComprehensiveSkinReport` and configured dynamic buffer strides in `HeatmapView`, eliminating horizontal scanline shear.

### 3. Mobile Ergonomics & Responsive Charting (WP-5 & WP-6)
- Expanded `ZoneRadarChart` coordinate space to $340 \times 340$ with $95\text{px}$ radius and dynamic cosine-based SVG text anchoring (`start`, `end`, `middle`), completely eliminating label truncation on mobile viewports.
- Implemented horizontal swipeable metric pill selector in `HeatmapView` guaranteeing $\ge 44\text{px}$ touch targets.
- Added `scroll-pt-20` to `layout.tsx` to prevent sticky headers from intercepting touch events during anchor scrolling.

### 4. Zero-Egress & Security Hardening (WP-1 & WP-7)
- Validated strict CSP (`connect-src 'self' blob:`, `object-src 'none'`) and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- Confirmed zero outbound network calls and zero transmission of image/biometric data across unit and Playwright E2E suites.

## Consequences
- 100% test pass rate across 16 test files (70 unit tests) and 7 Playwright E2E suites.
- Strict TypeScript (`tsc --noEmit`) passes with 0 errors.
- ESLint passes with 0 warnings.
- Production Next.js build compiles cleanly with zero hydration or client/server mismatch issues.
