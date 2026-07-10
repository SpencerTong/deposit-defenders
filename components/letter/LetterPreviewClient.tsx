"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { analyzeTenancy, type AnalysisResult as RulesAnalysis } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import type { FlowAnswers } from "@/lib/flow/types";
import { trackEvent } from "@/lib/events";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { ResultsEmailCapture } from "@/components/letter/ResultsEmailCapture";

export function LetterPreviewClient() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<RulesAnalysis | null>(null);
  const [answers, setAnswers] = useState<FlowAnswers | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(FLOW_ANSWERS_STORAGE_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }

    const parsedAnswers = JSON.parse(raw) as FlowAnswers;
    const result = analyzeTenancy(toTenancyInputs(parsedAnswers));
    setAnswers(parsedAnswers);
    setAnalysis(result);
    trackEvent("viewed_analysis", {
      maxExposure: result.exposure.maxExposure,
      violationCount: result.rules.filter((rule) => rule.triggered).length,
    });
  }, [router]);

  if (!analysis || !answers) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center text-gray-500">
        Loading your analysis…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <AnalysisResult analysis={analysis} />

      <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <p className="mb-1 font-medium text-gray-900">Ready to demand what you may be owed?</p>
        <p className="mb-4 text-sm text-gray-600">
          For $49, we generate your ready-to-send formal demand letter — citing each issue
          above with the exact Massachusetts statute — plus a small-claims kit with certified
          mail instructions, an evidence checklist, and a deadline tracker.
        </p>
        <Link
          href="/kit"
          onClick={() => trackEvent("clicked_kit")}
          className="inline-block w-full rounded-lg bg-accent px-6 py-4 text-center text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark sm:w-auto sm:px-10"
        >
          Get my demand letter — $49
        </Link>
      </div>

      <ResultsEmailCapture answers={answers} />
    </main>
  );
}
