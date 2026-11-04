import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names safely resolving Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Clamps a number between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Normalizes a value to a 0-100 wellness score.
 */
export function normalizeScore(val: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((val - min) / (max - min)) * 100;
  return Math.round(clamp(normalized, 0, 100));
}
