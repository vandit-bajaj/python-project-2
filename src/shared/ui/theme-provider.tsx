'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'theme';
const THEME_CHANGE_EVENT = 'dermalens-theme-change';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(theme: Theme): ResolvedTheme {
  if (typeof document === 'undefined') return 'dark';
  const resolved = theme === 'system' ? getSystemPreference() : theme;
  const root = document.documentElement;
  const isDark = resolved === 'dark';

  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;

  return resolved;
}

function subscribeToTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    mediaQuery.removeEventListener('change', callback);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Restricted environment
  }
  return 'system';
}

function getServerThemeSnapshot(): Theme {
  return 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? getSystemPreference() : theme;

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Storage unavailable
    }
    applyThemeToDocument(newTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

const emptySubscribe = () => () => {};

/**
 * Accessible Theme Toggle with 3 options: Light, System, Dark
 * Fully keyboard navigable, visible focus ring, screen reader friendly.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) {
    return (
      <div
        className={`flex h-8 w-24 items-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-0.5 opacity-60 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light mode', icon: <Sun className="h-3.5 w-3.5" /> },
    { value: 'system', label: 'System theme', icon: <Laptop className="h-3.5 w-3.5" /> },
    { value: 'dark', label: 'Dark mode', icon: <Moon className="h-3.5 w-3.5" /> },
  ];

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className={`flex items-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] p-0.5 shadow-2xs ${className}`}
    >
      {options.map((opt) => {
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={isSelected}
            aria-label={opt.label}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              isSelected
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
