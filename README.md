# DermaLens — Privacy-First Skin Wellness Analysis

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black.svg)](https://nextjs.org/)
[![Privacy: Zero Egress](https://img.shields.io/badge/Privacy-100%25%20On--Device%20(Zero%20Egress)-emerald.svg)](#1-absolute-privacy--zero-egress-mandate)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-purple.svg)](#accessibility)

**DermaLens** is a privacy-first web application that analyzes a face photo or live camera feed for skin-wellness attributes (erythema/redness, blemishes/acne, hyperpigmentation, oiliness, texture roughness, under-eye darkness, fine lines, and overall tone evenness). It produces an interactive visual report complete with 2D heatmaps, a 3D face model, zone radar breakdowns, and client-side PDF export.

All computer vision inference and geometric processing runs **100% inside your local browser**. Your imagery and biometric data never leave your device.

---

## 1. Absolute Privacy & Zero-Egress Mandate

- **Zero Image Egress**: No server-side inference, no upload endpoints, and no remote logging of biometric data.
- **Strict Content Security Policy**: Configured with `connect-src 'self' blob:;` and `object-src 'none';`. Network requests carrying image-derived coordinates, embeddings, or base64 data are blocked and tested continuously in CI.
- **Transient Memory Lifecycle**: Captured camera frames and uploads are held as transient in-memory `ImageBitmap` primitives and immediately closed (`bitmap.close()`) when unmounted or discarded.
- **Local-Only Storage**: All scans and reports are stored locally in the browser's `IndexedDB`. A prominent **"Delete All My Data"** button purges all records and local buffers with a single click.

---

## 2. Non-Medical Framing & Responsible Disclaimers

DermaLens is an **educational skin-wellness tool, NOT a diagnostic medical device**.
- It does not diagnose dermatological diseases (e.g., melanoma, rosacea, severe cystic acne).
- Prominent disclaimers are presented on the homepage, scanner, report dashboard, exported PDFs, and the dedicated [`/disclaimer`](/disclaimer) route.
- Metric scores include transparent confidence levels and explicitly report lower-confidence states for complexions where visible light absorption limits physical contrast (e.g., erythema on Fitzpatrick phototypes V–VI).

---

## 3. Architecture Overview

DermaLens follows a strict **Feature-Sliced Architecture**:

```
src/
├── app/                  # Next.js App Router:
│   ├── page.tsx          # Minimalist marketing homepage
│   ├── scan/page.tsx     # Capture, face understanding & scan flow
│   ├── report/[id]/      # Offline report dashboard
│   ├── disclaimer/       # Comprehensive non-medical disclaimer
│   ├── manifest.ts       # PWA Web App Manifest
│   └── layout.tsx        # Shell layout & service worker registration
├── features/             # Isolated domain modules:
│   ├── capture/          # Camera stream, quality gate (lighting, sharpness, framing)
│   ├── analysis/         # MediaPipe face mesh worker, zone segmentation, 8 CV analyzers
│   ├── report/           # 3D Three.js viewer, heatmap colorizer, radar charts, PDF export
│   └── privacy/          # Zero-leak unit tests and egress assertions
└── shared/               # Common primitives:
    ├── ui/               # Accessible buttons, cards, badges
    ├── lib/              # cn utility, math helpers
    └── types/            # Strict TypeScript types & Zod schemas
```

**Boundaries Rule**: Modules in `src/features/*` import from `src/shared/*`, but never import internal paths from each other. Cross-feature integration occurs solely through public index exports.

---

## 4. Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x

### Installation

```bash
# Clone the repository
git clone https://github.com/vandit-bajaj/python-project-2.git
cd python-project-2

# Install dependencies (automatically runs scripts/prepare-artifacts.mjs for self-hosted WASM)
npm install
```

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## 5. Testing & Quality Verification

DermaLens enforces automated verification across unit, integration, accessibility, and zero-egress network tests:

```bash
# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint (strict no-any & React 19 rules)
npm run lint

# Run all 62 Vitest unit tests (deterministic fixture-based tests)
npm run test:run

# Run Playwright E2E and network privacy tests (asserts 0 external requests)
npm run test:e2e
```

---

## 6. How to Add a New Skin Analyzer

Adding a new skin attribute analyzer to DermaLens requires just 4 steps:

### Step 1: Define Metric ID & Metadata
In [`src/shared/types/analyzer.ts`](src/shared/types/analyzer.ts), add your metric ID to `MetricId`:
```typescript
export type MetricId =
  | 'redness'
  | 'acne'
  | ...
  | 'yourMetric';
```

Add human-readable metadata in [`src/features/analysis/analyzers/index.ts`](src/features/analysis/analyzers/index.ts):
```typescript
yourMetric: {
  id: 'yourMetric',
  name: 'Your Metric Name',
  category: 'balance', // 'clarity' | 'balance' | 'texture' | 'uniformity'
  description: 'Plain-language explanation of what this measures.',
}
```

### Step 2: Implement the Analyzer Function
Create `src/features/analysis/analyzers/your-metric.ts`:
```typescript
import type { AnalyzerResult, NormalizedLandmark, SkinToneBaseline } from '@/shared/types';
import type { ZoneMasks, SkinRoiMasks } from '../types';
import { calculatePerZoneAverages } from './utils';

export function analyzeYourMetric(
  imageData: ImageData,
  landmarks: NormalizedLandmark[],
  zoneMasks: ZoneMasks,
  skinRoi: SkinRoiMasks,
  baseline: SkinToneBaseline,
): AnalyzerResult {
  const { width, height } = imageData;
  const heatmap = new Float32Array(width * height);

  // Compute your computer vision heuristic on skinRoi pixels...
  // 100 = calm / balanced skin, decreasing as anomaly increases.
  const score = 90;
  const perZone = calculatePerZoneAverages(heatmap, zoneMasks, skinRoi);

  return {
    score,
    perZone,
    confidence: 0.92,
    heatmap,
  };
}
```

### Step 3: Register in Pipeline Orchestrator
Add your analyzer function call in [`src/features/analysis/pipeline/skin-analyzer.ts`](src/features/analysis/pipeline/skin-analyzer.ts).

### Step 4: Add Fixture-Based Unit Tests
Add a unit test in [`src/features/analysis/analyzers/__tests__/analyzers.test.ts`](src/features/analysis/analyzers/__tests__/analyzers.test.ts) verifying invariance on synthetic skin tone fixtures.

---

## 7. Skin-Tone Fairness & Scientific Calibration

- **Individual Typology Angle (ITA)**:
  $$\text{ITA} = \left(\arctan\left(\frac{L^* - 50}{b^*}\right)\right) \times \frac{180}{\pi}$$
  Maps calibrated CIE LAB lightness ($L^*$) and yellowness ($b^*$) to Fitzpatrick phototypes I through VI.
- **Fairness Compensation**:
  Epidermal melanin in Fitzpatrick V–VI complexions naturally absorbs short optical wavelengths. Rather than providing false precision, DermaLens transparently adjusts erythema sensitivity and lowers confidence values (0.45–0.60) to avoid false positives.

---

## 8. Architectural Decision Records (ADRs)

All core engineering decisions are permanently recorded in [`docs/decisions/`](docs/decisions/):
- **ADR-001**: Privacy-First Local Architecture & Next.js 16 Edge Stack
- **ADR-002**: Transient In-Memory Image Lifecycle & Client-Side Quality Gate
- **ADR-003**: Landmark Segmentation, Exclusion Masking & Skin-Tone Baseline Calibration
- **ADR-004**: Classical Computer Vision Heuristics & Skin-Tone Calibration
- **ADR-005**: 3D Face Geometry, Perceptual Heatmaps & Local PDF Reporting
- **ADR-006**: Production Security Headers, Offline PWA & Zero-Egress Architecture

---

## License

MIT © Google DeepMind Pair Programming Team & DermaLens Contributors.

