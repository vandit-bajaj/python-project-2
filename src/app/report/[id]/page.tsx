'use client';

import { useEffect, useState, use } from 'react';
import type { ComprehensiveSkinReport } from '@/features/analysis/types';
import { getReportById, ReportDashboard } from '@/features/report';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { FileQuestion, Loader2, ArrowLeft } from 'lucide-react';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [report, setReport] = useState<ComprehensiveSkinReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getReportById(id).then((res) => {
      if (isMounted) {
        setReport(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <p className="mt-4 text-xs text-[var(--muted-foreground)]">Loading confidential local report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--warning)]/10 text-[var(--warning)]">
          <FileQuestion className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Report Not Found on Device</h1>
        <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
          Because DermaLens operates under a strict Zero-Egress mandate, reports are held solely in your local browser storage and never uploaded to any cloud server.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/scan">
            <Button size="sm">Start New Scan</Button>
          </Link>
          <Link href="/">
            <Button size="sm" variant="outline">Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <ReportDashboard report={report} />
    </div>
  );
}
