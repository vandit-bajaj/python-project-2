/**
 * DermaLens Design Tokens
 *
 * Clinical, modern, accessible design system definitions.
 * Conforms to WCAG AA color-contrast and reduced-motion standards.
 */

export const DESIGN_TOKENS = {
  colors: {
    accent: {
      DEFAULT: '#0f766e', // primary light
      light: '#14b8a6', // primary dark / hover
      dark: '#0d9488',
      subtle: 'rgba(15, 118, 110, 0.12)',
    },
    neutral: {
      canvasLight: '#fafaf9', // warm paper
      cardLight: '#ffffff',
      canvasDark: '#090a0f', // deep obsidian
      cardDark: '#12131a',
      borderLight: '#e4e4e7',
      borderDark: '#232533',
      textPrimaryLight: '#18181b',
      textMutedLight: '#71717a',
      textPrimaryDark: '#f4f4f5',
      textMutedDark: '#a1a1aa',
    },
    severity: {
      optimal: '#15803d', // green-700 / emerald (Optimal)
      moderate: '#b45309', // amber-700 (Moderate notice)
      attention: '#b91c1c', // red-700 (Attention required)
      lowConfidence: '#71717a', // zinc-500 (Insufficient confidence)
    },
  },
  typography: {
    fontSans:
      'var(--font-sans, "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    fontMono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
