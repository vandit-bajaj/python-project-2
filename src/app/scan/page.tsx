import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Camera, Shield } from 'lucide-react';

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600 shadow-sm">
        <Camera className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Skin Wellness Capture</h1>

      <p className="mt-4 text-base text-[var(--muted-foreground)]">
        Live camera streaming and image drag-and-drop with real-time quality guidance will
        initialize in Phase 1.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
        <Shield className="h-3.5 w-3.5" />
        <span>100% Client-Side Processing</span>
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
