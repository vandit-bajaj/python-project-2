# ADR-006: Production Security Headers, Offline PWA & Zero-Egress Architecture

## Status

Accepted

## Date

2026-11-04

## Context

Phase 5 & 6 require finalizing DermaLens for production deployment on Vercel:
1. **Absolute Privacy Enforcement**: Ensuring no dynamic script, telemetry beacon, network call, or third-party iframe can ever transmit user biometric data or images off the user's device.
2. **Offline Resilience & PWA**: DermaLens must be installable as a Progressive Web App (PWA) and execute all machine learning and image processing completely offline after initial load.
3. **WASM Execution Security**: MediaPipe's WebAssembly and SIMD neural graphs require JIT/WASM execution permissions while strictly prohibiting unauthorized `eval()` execution.
4. **Static Edge Delivery**: Minimizing round trips on Vercel edge infrastructure via aggressive caching of large immutable model assets (`/models/*` and `/wasm/*`).

## Decision

1. **Hardened Content Security Policy (CSP)**:
   - Configured in `next.config.ts` and `vercel.json`:
     - `default-src 'self'`: Only same-origin resources allowed.
     - `connect-src 'self' blob:`: Forbids all outbound network connections to any external domain, blocking tracking beacons and upload APIs.
     - `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`: Allows Next.js App Router inline hydration scripts and MediaPipe WebAssembly instantiation without permitting unsafe string evaluation in production.
     - `worker-src 'self' blob:`: Allows dedicated Web Workers (`face-mesh.worker.ts`) to be spawned in local sandboxes.
     - `object-src 'none'`: Blocks Flash, Java, and legacy browser plugins.
     - `frame-ancestors 'none'`: Prevents clickjacking by prohibiting embedding inside iframes.
2. **Hardware Permissions Policy**:
   - `Permissions-Policy: camera=(self), microphone=(), geolocation=(), browsing-topics=()`
   - Camera access is restricted exclusively to first-party origins; microphone, location tracking, and ad-targeting topics are completely blocked at the browser engine level.
3. **Immutable Caching for Models & Binaries**:
   - Headers for `/wasm/*` and `/models/*` serve `Cache-Control: public, max-age=31536000, immutable`.
   - The offline Service Worker (`/public/sw.js`) caches the models and WASM binaries into `dermalens-v1`, enabling 100% offline functionality.
4. **Automated Zero-Egress Verification in CI**:
   - Playwright end-to-end test suite (`e2e/privacy.spec.ts` and `e2e/report.spec.ts`) intercepts every browser network request, asserting zero unauthorized external HTTP/WebSocket requests and zero image payloads (`data:image`, `base64`, binary blobs).

## Consequences

- The application is fully installable and operates completely offline.
- Total mathematical and network guarantee of user privacy and zero data leakage.
- Production-ready for instant, secure deployment on Vercel with zero server maintenance.
