# ADR-001: Privacy-First In-Browser Architecture & Zero Data Egress Guarantee

## Status

Accepted

## Date

2026-11-04

## Context

DermaLens analyzes facial images for skin attributes (acne, redness, pigmentation, oiliness, texture, etc.). Biometric and facial data constitute exceptionally sensitive personal data under global privacy frameworks (GDPR, CCPA/CPRA, Illinois BIPA). Users must have mathematically verifiable guarantees that their raw images, facial landmarks, and skin health metrics are never transmitted, inspected, or retained by remote servers.

## Decision

1. **100% Client-Side Processing**: All image processing, facial landmarking (MediaPipe Face Landmarker), computer vision analyzers, and 3D mesh rendering execute exclusively within the user's browser environment using Web Workers, WebAssembly (WASM), and WebGL/WebGPU.
2. **Zero Ingestion/Upload Infrastructure**: The application contains no API routes or serverless functions accepting binary, base64, or vector representations of user imagery.
3. **Strict Content Security Policy (CSP)**: `connect-src 'self' blob:; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline';` prevents exfiltration to unauthorized endpoints.
4. **Transient In-Memory Lifecycle**: Camera frames and uploaded files are converted to transient `ImageBitmap` objects, processed, and immediately disposed. No user imagery is persisted to `localStorage` or `IndexedDB` unless the user explicitly opts into local history (which stores metrics and local-only encrypted blobs with an immediate "Delete all my data" purge option).
5. **Continuous Verification**: Playwright E2E tests inspect all browser network traffic during scanning to assert that zero network packets carry image or biometric payloads.

## Consequences

- Requires bundling and self-hosting all WASM and model files locally under `/public`.
- Eliminates cloud compute server costs for inference.
- Eliminates biometric liability and compliance overhead associated with remote image storage.
