# ADR 0008: Semantic Light Mode and Zero-FOWT Theme System

## Status
Accepted

## Context
DermaLens launched with an approved, clinical dark theme. To expand usability in bright daylight environments, clinical consulting rooms, and diverse ambient lighting conditions, a polished light mode was required.
The implementation had to meet strict architectural requirements:
1. **No Alteration to Dark Mode**: Dark mode's visual layout, styling, and behavior must remain completely intact.
2. **Strict Privacy & Zero-Egress**: Theme switching must not generate any telemetry or store biometric state; only a lightweight theme identifier (`'light'`, `'dark'`, `'system'`) may be stored in `localStorage`.
3. **Zero Flash of Wrong Theme (Zero-FOWT) under Strict CSP**: The application runs under a strict Content Security Policy (`connect-src 'self' blob:; object-src 'none'; script-src 'self' 'wasm-unsafe-eval'`). The theme initializer must execute synchronously before initial body render without violating CSP or requiring `'unsafe-inline'`.
4. **WCAG 2.1 AA Contrast**: All body text must achieve $\ge 4.5:1$ contrast against light surfaces, with UI components and interactive borders achieving $\ge 3:1$.
5. **Data Visualization Parity**: 3D mesh rendering, scientific 2D heatmaps, zone radar graphs, and progress meters must adapt dynamically without component remounting or flicker.

## Decisions

### 1. Semantic Token Architecture
We introduced a centralized semantic token system in `src/app/globals.css` with dedicated `:root, [data-theme="light"], .light` and `[data-theme="dark"], .dark` blocks, mapped to Tailwind CSS v4 via `@custom-variant dark (&:where(.dark, [data-theme=dark], .dark *, [data-theme=dark] *));`.

- **Warm Paper Canvas** (`--background: #FAFAF9`): Soft, natural tone avoiding harsh blinding pure-white `#FFFFFF`.
- **Elevated Surfaces** (`--card: #FFFFFF`): Subtle card depth with crisp 1px borders (`--border: #E4E4E7`).
- **High-Contrast Typography** (`--foreground: #18181B`): Achieving 16.7:1 contrast on canvas (exceeding WCAG AAA).
- **Secondary & Muted Typography** (`--secondary-foreground: #52525B` [7.3:1 AAA], `--muted-foreground: #71717A` [4.6:1 AA]).
- **Brand Teal Primary** (`--primary: #0F766E` in light [4.9:1 AA], `#14B8A6` in dark).
- **Status Tokens**: `--success: #15803D`, `--warning: #B45309`, `--danger: #B91C1C`.

### 2. Zero-FOWT Synchronous Initializer (`public/theme-init.js`)
To prevent FOWT without `'unsafe-inline'` script tags:
- A self-hosted script `public/theme-init.js` is loaded via `<Script src="/theme-init.js" strategy="beforeInteractive" />` in `<head>`.
- Being served from the same origin (`'self'`), it complies with strict CSP.
- It parses `localStorage.getItem('theme')` (or system `prefers-color-scheme`) synchronously before DOM parsing, attaching `data-theme` and `.light` / `.dark` classes to `<html>`.
- React manages ongoing transitions via `useSyncExternalStore`, dynamically listening to `prefers-color-scheme: dark` when set to `system`.

### 3. Data Visuals & 3D WebGL Adaptation
- **3D Face Viewer (`Face3DViewer`)**: The Three.js canvas utilizes an alpha transparent background nested in a themed container (`bg-[var(--subtle)] dark:bg-black/95`). Studio lighting adapts dynamically (`ambientLight 1.1` in light vs `0.9` in dark) with zero geometry reload or remount flicker.
- **Scientific Heatmaps (`HeatmapView`)**: Retains Turbo/Viridis/Magma perceptual color maps on the user's face portrait while theming controls, borders, and opacity sliders.
- **Radar & Bar Charts**: Axis guides, radar polygon strokes, and confidence indicators bind to CSS variables (`var(--border)`, `var(--primary)`).

### 4. PDF Export Theme Decision
- **Decision**: Exported PDF wellness reports will **always use a dedicated, print-friendly light layout** on clean white A4 paper with dark ink and teal accents, regardless of the active UI theme.
- **Rationale**: Rendering dark backgrounds in PDF reports wastes ink/toner, causes severe physical banding when printed on standard office printers, and is inconsistent with standard clinical documentation practices.

## Consequences
- DermaLens offers seamless Light, Dark, and System theme switching.
- 100% pass across all 70 unit tests and 12 Playwright E2E tests (including Axe automated contrast and WCAG AA audits).
- Zero console CSP violations and zero data egress verified.
