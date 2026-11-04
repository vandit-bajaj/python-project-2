# ADR-005: 3D Face Geometry, Perceptual Heatmaps & Local PDF Reporting

## Status

Accepted

## Date

2026-11-04

## Context

Phase 4 of DermaLens requires rendering rich visual representations of facial skin metrics:
1. An interactive 3D face viewer mapping the 478 MediaPipe facial landmarks to a 3D topology.
2. 2D multi-metric heatmap overlays with dynamic opacity and color-blind safe palettes.
3. Zone radar and metric bar charts for spatial breakdown.
4. Before/after comparison slider.
5. Client-side PDF export without transmitting data to external servers.
6. Local persistence in IndexedDB with an instantaneous data wipe capability.

Under our Absolute Privacy mandate, zero images, derived biometric meshes, or health metrics may ever be sent to any server.

## Decision

1. **Client-Side 3D Mesh Triangulation via Three.js**:
   - The 478 normalized facial landmarks are projected to 3D Cartesian coordinates $(x, y, z)$.
   - A watertight triangular mesh is constructed using Bowyer-Watson Delaunay triangulation computed directly in client memory.
   - The user's captured face photo is mapped to the mesh as a transient `THREE.CanvasTexture` in local memory and smoothly blended with metric heatmaps.
   - Interactive orbit controls (mouse and touch drag rotation) allow full 3D spatial inspection.
   - If WebGL acceleration is unavailable in restricted or low-power environments, the viewer gracefully falls back to a high-resolution 2D heatmap.

2. **Perceptual Color-Blind Safe Heatmap Colorization**:
   - Floating-point metric intensity buffers are translated into RGBA canvas layers using an accessible Magma/Plasma gradient (Cool Cyan $\rightarrow$ Amber $\rightarrow$ Bright Orange $\rightarrow$ Vivid Crimson).
   - Near-zero baseline regions remain completely transparent, preserving underlying natural skin visibility.

3. **In-Browser Vector PDF Generation**:
   - Reports are rendered into multi-page confidential PDFs via `jsPDF` entirely within the browser's JavaScript execution thread.
   - Includes full score breakdowns, confidence percentages, Fitzpatrick scale baseline, and the mandatory non-medical disclaimer banner.

4. **IndexedDB Local History & One-Click Purge**:
   - Reports are cached in browser `IndexedDB` (`dermalens_local_db`) for longitudinal tracking.
   - A prominent "Delete All My Data" button provides an immediate, verified purge of IndexedDB, LocalStorage, SessionStorage, and in-memory caches.

## Consequences

- 100% client-side rendering with zero server compute or data leakage.
- Rich, engaging 3D and 2D visualization accessible on desktop and mobile browsers.
- Satisfies all WCAG AA contrast guidelines with color-blind safe palettes and screen-reader accessible tables.

