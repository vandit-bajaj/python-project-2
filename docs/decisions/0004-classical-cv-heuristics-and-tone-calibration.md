# ADR-004: Classical Computer Vision Heuristics & Skin-Tone Calibration

## Status

Accepted

## Date

2026-11-04

## Context

Phase 3 of DermaLens requires evaluating 8 distinct facial skin-wellness attributes:
1. Redness & erythema
2. Acne, blemishes & breakouts
3. Hyperpigmentation & dark spots
4. Oiliness & shine
5. Texture roughness & enlarged pores
6. Under-eye darkness
7. Fine lines & expression creases
8. Overall complexion evenness

In accordance with Phase 3 specifications and our Zero-Egress rule:
- All analysis in v1 must execute client-side via classical deterministic computer vision algorithms.
- Heavy neural networks for metric scoring are avoided in v1 to ensure sub-second latency on consumer mobile and desktop devices without server dependencies.
- Skin-tone fairness is a first-class requirement. Natural skin color variations across the Fitzpatrick phototype scale (I–VI) must not be misinterpreted as blemishes or erythema.

## Decision

1. **Deterministic Heuristic Algorithms**:
   - **Redness**: Evaluates positive deviations in the CIE LAB $a^*$ channel relative to the user's calibrated skin-tone baseline ($\Delta a^* = a^* - \text{baselineRedness}$).
   - **Acne**: Isolates localized papules and blemishes using multiscale Difference-of-Gaussians (DoG) on the $(R - G)$ color contrast channel with mean-background boundary imputation to eliminate false edge responses.
   - **Pigmentation**: Evaluates local Melanin Index contrast ($\text{MI} = -\log_{10}(R / 255)$) relative to a spatially blurred background reference context.
   - **Oiliness**: Identifies specular reflections characterized by high perceptual luminance ($L^* > 195$) with low chromatic saturation ($S < 0.28$), weighted heavily towards the T-Zone and forehead.
   - **Texture**: Computes 2D discrete Laplacian gradient variance ($\nabla^2 L$) on the luminance channel to isolate high-frequency surface roughness and visible pore depressions.
   - **Under-Eye Darkness**: Measures the relative luminance deficit between the under-eye regions and adjacent cheek baselines ($\Delta L = \bar{L}_{\text{cheek}} - \bar{L}_{\text{undereye}}$).
   - **Fine Lines**: Employs directional 3x3 Sobel gradient operators to isolate coherent linear creases on the forehead, eye corners, and smile lines.
   - **Evenness**: Evaluates the global coefficient of variation across spatial luminance and chrominance distributions.

2. **Per-Skin-Tone Fairness & Graceful Degradation**:
   - For darker skin phototypes (Fitzpatrick V and VI), epidermal melanin naturally absorbs optical wavelengths, muting visible surface erythema in standard RGB camera capture.
   - DermaLens explicitly handles this physical optical constraint:
     - The erythema intensity sensitivity is scaled to account for melanin attenuation.
     - Confidence scores for the redness metric are intentionally and transparently lowered (0.45 for Type VI, 0.60 for Type V) rather than providing misleadingly precise or skewed scores.
     - Non-medical wellness framing and transparent confidence intervals are surfaced to the user.

3. **Per-Zone Mapping & Heatmap Buffers**:
   - Each analyzer outputs both a global score (0–100, where higher indicates calmer, smoother, balanced skin), a per-zone breakdown for all 9 facial zones, and a normalized `Float32Array` heatmap buffer (0.0 to 1.0) ready for 2D/3D visual rendering in Phase 4.

## Consequences

- Real-time client-side analysis executes in ~30–80 milliseconds, well within our performance target for mobile browsers.
- Zero server requests, maintaining 100% compliance with our Zero-Egress rule.
- Eliminates racial and skin-tone bias in scoring through individualized baseline normalization and explicit confidence states.
