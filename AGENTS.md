# AGENTS.md — Engineering Rules for DermaLens

This document outlines mandatory engineering rules, architectural constraints, and coding standards for all AI coding agents and human contributors working on DermaLens. These rules override any general preferences.

## 1. Absolute Privacy & Zero-Egress Mandate (Non-Negotiable)

- **User images must never leave the device.**
- There are no upload endpoints, no server-side inference, no remote logging of biometric data, and no third-party telemetry scripts.
- No network request (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `WebRTC`, or dynamic script tag) may carry image data, image-derived data, coordinates, or biometric embeddings.
- Every commit affecting data handling or network boundaries must pass automated privacy tests asserting zero image-derived payload transmission.
- In-memory images must be held as `ImageBitmap` or `ArrayBuffer` only during active analysis and explicitly released / revoked immediately thereafter.

## 2. Non-Medical Framing & Responsible Disclaimers

- DermaLens produces skin-wellness insights, **not medical diagnoses**.
- The disclaimer must be displayed prominently in the report and on the `/disclaimer` route.
- Metric scores must report explicit confidence intervals and "low confidence" states rather than exaggerated precision.
- Skin-tone fairness is a first-class requirement across all analyzers.

## 3. Strict Typing & Code Quality Standards

- TypeScript `strict: true` is strictly enforced.
- **Forbidden:** `any`, `unknown` casts without runtime narrowing, `@ts-ignore`, and `@ts-nocheck` without an approved justification.
- Validate all external, user-supplied, and persisted structures using Zod schemas.
- Heavy computations (image processing, landmarking, computer vision, WebGL transforms) **must run in Web Workers**, never on the main thread.
- Prefer pure functions and composition. Keep UI components small, modular, and presentational where possible.

## 4. Feature-Sliced Architecture Boundaries

```
src/
  app/         # Routes only: /, /scan, /report/[id], /disclaimer
  features/    # Isolated domain modules (capture, analysis, report, privacy)
  shared/      # Common primitives (ui, lib, types, config)
```

- Modules in `src/features/*` may import from `src/shared/*`.
- Modules in `src/features/*` must **never import from other features' internal paths**. Cross-feature communication must occur through explicit public interfaces or pipeline orchestrators.

## 5. Testing & Verification Rules

- **No untested code ships.** Every new module must include unit tests.
- Metric analyzers must include deterministic fixture-based tests verifying invariance to harmless transformations.
- Pipeline integrations must include end-to-end integration tests.
- Accessibility standards (WCAG AA): keyboard navigability, semantic HTML, screen reader labels, color-blind safe palettes, and `prefers-reduced-motion` compliance.

## 6. Git & Change Discipline

- All work is performed on feature branches named `phase-N/short-description`. Never commit directly to `main`.
- Follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`. Keep commits small and atomic.
- Run `npm run typecheck`, `npm run lint`, and `npm run test:run` before opening a PR.
- Record all significant architectural decisions in `docs/decisions/` as ADRs.
- **Never commit secrets, `.env` files, or test face photos.**

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
