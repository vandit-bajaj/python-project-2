import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImagePreview } from '../image-preview';
import type { ProcessedCapture } from '../../types';

describe('ImagePreview Component (Quality Gate Enforcement)', () => {
  const baseMockCapture: ProcessedCapture = {
    bitmap: {
      width: 400,
      height: 500,
      close: vi.fn(),
    } as unknown as ImageBitmap,
    width: 400,
    height: 500,
    timestamp: Date.now(),
    quality: {
      isAcceptable: true,
      score: 85,
      lighting: { status: 'good', averageLuminance: 120, message: 'Lighting is balanced' },
      sharpness: { status: 'sharp', variance: 45, message: 'Focus is sharp' },
      framing: { status: 'centered', message: 'Position centered' },
      overallMessage: 'Ready for analysis',
    },
  };

  it('enables the Analyze button when photo quality is acceptable', () => {
    render(
      <ImagePreview
        capture={baseMockCapture}
        onRetake={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    expect(analyzeBtn).toBeEnabled();
    expect(screen.queryByText(/Quality requirements not met/i)).not.toBeInTheDocument();
  });

  it('disables the Analyze button and renders warning when quality is unacceptable', () => {
    const poorCapture: ProcessedCapture = {
      ...baseMockCapture,
      quality: {
        isAcceptable: false,
        score: 20,
        lighting: { status: 'too_dark', averageLuminance: 15, message: 'Face the light; environment is too dark' },
        sharpness: { status: 'blurry', variance: 8, message: 'Hold still; image is blurry' },
        framing: { status: 'off_center', message: 'Position face in oval' },
        overallMessage: 'Face the light',
      },
    };

    render(
      <ImagePreview
        capture={poorCapture}
        onRetake={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    expect(analyzeBtn).toBeDisabled();
    expect(screen.getByText(/Quality requirements not met/i)).toBeInTheDocument();
  });
});
