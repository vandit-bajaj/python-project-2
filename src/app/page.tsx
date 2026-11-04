import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ShieldCheck, EyeOff, Sparkles, Camera, Upload, Scale } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Centered Editorial Hero Section */}
      <div className="text-center">
        {/* Eyebrow Badges */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1 text-xs font-medium text-[var(--primary)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span>100% On-Device Facial Wellness Analysis • No Cloud Uploads</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            <span>Skin-Wellness Insights • Not a Medical Diagnosis</span>
          </div>
        </div>

        {/* Editorial Headline */}
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--foreground)]">
          Private skin wellness intelligence.
          <br className="hidden sm:inline" />
          <span className="text-[var(--primary)]"> Directly in your browser.</span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
          Clinical-grade computer vision assessing erythema, texture, sebum balance, and pigment
          clarity. Zero latency, zero data egress.
        </p>

        {/* Clear Interactive CTA Group */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/scan">
            <Button size="lg" className="gap-2.5">
              <Camera className="h-4 w-4" />
              Start Live Scan
            </Button>
          </Link>
          <Link href="/scan">
            <Button variant="secondary" size="lg" className="gap-2.5">
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
          </Link>
          <Link href="/disclaimer">
            <Button variant="ghost" size="lg">
              Read Disclaimer
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Refined Value Cards */}
      <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <EyeOff className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">Strict Zero-Egress</h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Facial imagery is processed in volatile device memory and immediately discarded. No
            remote servers, no cloud storage, zero tracking.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Scale className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">
            Personal Baseline Calibration
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Metrics adapt to your personal skin phototype using individual typology angle (ITA)
            modeling across all Fitzpatrick scales I–VI.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">
            Non-Diagnostic Transparency
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Clear wellness insights paired with empirical confidence ratings, never exaggerated
            precision or false medical claims.
          </p>
        </div>
      </div>
    </div>
  );
}
