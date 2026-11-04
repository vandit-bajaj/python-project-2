import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
        <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h1 className="text-xl font-bold sm:text-2xl">Medical Disclaimer & Intended Use</h1>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--foreground)]/90">
          <p>
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

      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Our Privacy Commitments</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--muted-foreground)]">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
            <span>Images never leave your web browser under any circumstances.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
            <span>
              No remote servers, no cloud storage, and no biometric training data harvesting.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
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
