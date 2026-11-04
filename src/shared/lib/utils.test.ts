import { describe, it, expect } from 'vitest';
import { cn, clamp, normalizeScore } from './utils';

describe('Utility Functions', () => {
  describe('cn (Tailwind class merging)', () => {
    it('merges classnames correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('resolves conflicting tailwind classes cleanly', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('handles falsy expressions and conditionals', () => {
      const condition = false;
      expect(cn('base-class', condition && 'never-rendered', undefined, null)).toBe('base-class');
    });
  });

  describe('clamp', () => {
    it('clamps values below minimum', () => {
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    it('clamps values above maximum', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('retains values within bounds', () => {
      expect(clamp(42, 0, 100)).toBe(42);
    });
  });

  describe('normalizeScore', () => {
    it('scales linear range into 0-100', () => {
      expect(normalizeScore(5, 0, 10)).toBe(50);
      expect(normalizeScore(0, 0, 10)).toBe(0);
      expect(normalizeScore(10, 0, 10)).toBe(100);
    });

    it('handles zero span without division by zero', () => {
      expect(normalizeScore(5, 5, 5)).toBe(50);
    });
  });
});

