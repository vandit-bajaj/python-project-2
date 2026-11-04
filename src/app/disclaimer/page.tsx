import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Muted Slate Framing for Medical Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Medical Disclaimer & Intended Use
          </h1>
        </div>

        <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            <strong>
              DermaLens is NOT a medical device, nor does it provide medical advice, diagnosis,
              treatment, or prevention of any skin disease or pathological condition.
            </strong>
          </p>
          <p>
            The scores, heatmaps, and evaluations provided by DermaLens are computed exclusively via
            automated client-side computer vision heuristics designed for general skin wellness,
            cosmetic appearance, and surface uniformity observation.
          </p>
          <p>
            Computer vision metrics can be influenced by ambient lighting, camera sensor
            calibration, skin phototype, facial hair, and cosmetics. They should never substitute
            for professional clinical dermatological evaluation.
          </p>
          <p>
            If you have concerns about suspicious moles, changing lesions, persistent rashes,
            melanoma risk, severe acne, or any other dermatological symptoms, consult a qualified,
            board-certified physician or dermatologist immediately.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Our Privacy Commitments</h2>
        <ul className="mt-4 space-y-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>Images never leave your web browser under any circumstances.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>
              No remote servers, no cloud storage, and no biometric training data harvesting.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>
              Analysis confidence is openly reported; low-quality conditions trigger transparent
              warnings rather than misleading estimations.
            </span>
          </li>
        </ul>

        <div className="mt-8">
          <Link href="/scan">
            <Button>Proceed to Scanner</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
