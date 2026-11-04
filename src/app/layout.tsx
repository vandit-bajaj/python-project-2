import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import { ServiceWorkerRegister } from '@/shared/ui/sw-register';

export const metadata: Metadata = {
  title: 'DermaLens — Privacy-First Skin Wellness Analysis',
  description:
    'On-device computer vision skin wellness analytics. Your face and data never leave your browser.',
  keywords: ['skin wellness', 'privacy first', 'in-browser ML', 'facial analysis'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#090a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-pt-20">
      <body className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 text-base font-bold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-800 dark:bg-teal-500 font-bold text-white dark:text-black shadow-xs">
                DL
              </span>
              <span>DermaLens</span>
            </Link>
            <nav className="flex items-center gap-5 text-xs font-semibold">
              <Link
                href="/scan"
                className="text-[var(--foreground)] transition-colors hover:text-teal-700 dark:hover:text-teal-400"
              >
                Scan
              </Link>
              <Link
                href="/disclaimer"
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                Disclaimer
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>
        <ServiceWorkerRegister />

        <footer className="border-t border-[var(--border)] bg-[var(--background)] py-8 text-center text-xs text-[var(--muted-foreground)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="mb-2">
              <strong>Notice:</strong> DermaLens provides non-diagnostic skin-wellness observations
              only and is not a medical device.
            </p>
            <p>
              Privacy Guarantee: 100% in-browser processing. No imagery or biometric data ever
              leaves this device.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
