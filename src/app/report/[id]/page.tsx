import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { FileText } from 'lucide-react';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600 shadow-sm">
        <FileText className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Skin Wellness Report</h1>

      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Report ID: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">{id}</code>
      </p>

      <p className="mt-4 text-base text-[var(--muted-foreground)]">
        Interactive 3D face viewer, heatmaps, and metric cards will render here in Phase 4.
      </p>

      <div className="mt-8">
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
