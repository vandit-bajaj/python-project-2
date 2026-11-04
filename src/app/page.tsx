import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ShieldCheck, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Wellness Disclaimer Badge */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
        <AlertCircle className="h-4 w-4" />
        <span>Skin-Wellness Insights &bull; Not a Medical Diagnosis</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
        Private, in-browser facial skin analytics.
      </h1>

      <p className="mt-6 text-lg leading-8 text-[var(--muted-foreground)] sm:text-xl">
        Analyze redness, texture, oiliness, and hydration indicators using client-side computer
        vision. Zero uploads, zero servers, 100% on-device privacy.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/scan">
          <Button size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Launch Scanner
          </Button>
        </Link>
        <Link href="/disclaimer">
          <Button variant="outline" size="lg">
            Read Disclaimer
          </Button>
        </Link>
      </div>

      {/* Privacy Guarantees Grid */}
      <div className="mt-20 grid grid-cols-1 gap-8 border-t border-[var(--border)] pt-12 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600">
            <EyeOff className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Zero Image Egress</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Your camera feed and photos are held in transient memory (`ImageBitmap`) only. They are
            never sent across the network or stored in external databases.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Transparent Confidence</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Every attribute score includes confidence metrics calibrated for diverse skin tones,
            acknowledging low-signal conditions honestly.
          </p>
        </div>
      </div>
    </div>
  );
}
