/**
 * DermaLens Design Tokens
 *
 * Clinical, modern, accessible design system definitions.
 * Conforms to WCAG AA color-contrast and reduced-motion standards.
 */

export const DESIGN_TOKENS = {
  colors: {
    accent: {
      DEFAULT: '#0d9488', // teal-600
      light: '#14b8a6', // teal-500
      dark: '#0f766e', // teal-700
      subtle: 'rgba(13, 148, 136, 0.12)',
    },
    neutral: {
      canvasLight: '#f8fafc', // slate-50
      cardLight: '#ffffff',
      canvasDark: '#090d16', // slate-950 deep
      cardDark: '#0f172a', // slate-900
      borderLight: '#e2e8f0', // slate-200
      borderDark: '#1e293b', // slate-800
      textPrimaryLight: '#0f172a',
      textMutedLight: '#64748b',
      textPrimaryDark: '#f8fafc',
      textMutedDark: '#94a3b8',
    },
    severity: {
      optimal: '#16a34a', // emerald-600 (Healthy / optimal)
      moderate: '#d97706', // amber-600 (Noticeable)
      attention: '#ea580c', // orange-600 (Needs attention, non-alarmist)
      lowConfidence: '#64748b', // slate-500 (Insufficient signal / warning)
    },
  },
  typography: {
    fontSans:
      'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    fontMono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    full: '9999px',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
