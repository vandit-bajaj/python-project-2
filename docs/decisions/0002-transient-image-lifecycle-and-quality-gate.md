# ADR-002: Transient In-Memory Image Lifecycle & Client-Side Quality Gate

## Status

Accepted

## Date

2026-11-04

## Context

DermaLens requires high-resolution face images to analyze skin attributes (redness, pores, acne, texture). Handling high-resolution camera feeds and photo uploads in the browser introduces two major architectural risks:

1. **Privacy & Data Persistence Risk**: Accidental persistence of biometric photos in browser storage (`localStorage`, cache, or unreleased object URLs) violates our Zero-Egress and Absolute Privacy mandate.
2. **Compute Inefficiency & OOM**: Running heavy computer vision pipelines on poorly illuminated, out-of-focus, or uncentered images produces untrustworthy scores and wastes device battery and GPU/WASM memory.

## Decision

1. **Exclusive In-Memory `ImageBitmap` Lifecycle**:
   - All captured camera frames and uploaded photos are decoded directly into transient `ImageBitmap` primitives.
   - Any temporary `Blob` or `ObjectURL` created for element bridging is revoked immediately after bitmap creation.
   - Every module holding a bitmap must invoke `bitmap.close()` immediately upon unmounting, retaking, or pipeline completion.
2. **Zero-Metadata Normalization (EXIF Stripping)**:
   - Images are processed via `createImageBitmap(blob, { imageOrientation: 'from-image' })` followed by canvas redraw, completely stripping GPS coordinates, camera serial numbers, and device timestamps.
   - Images are downscaled to a maximum dimension of 1920px preserving aspect ratio to conserve memory while retaining fine textural fidelity.
3. **Real-Time Client-Side Quality Gate**:
   - Before committing an image to ML processing, a lightweight quality gate evaluates frames at 4Hz:
     - **Lighting**: Mean perceptual luminance ($Y = 0.299R + 0.587G + 0.114B$) detects underexposure (<45) and overexposure (>220).
     - **Sharpness**: Variance of the discrete 2D Laplacian operator assesses edge sharpness without neural overhead.
     - **Framing**: Horizontal symmetry and contrast ratios ensure face centering and proximity in the oval guide.
   - Live visual guidance pills ("Face the light", "Move closer", "Hold still") prevent low-confidence scans before execution.

## Consequences

- Guaranteed zero residual image data left in browser storage after analysis.
- Low-end mobile devices remain within memory budgets without browser tab crashes.
- Prevents garbage-in/garbage-out scenarios for subsequent ML landmarking in Phase 2.
