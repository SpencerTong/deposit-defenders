"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { analyzeTenancy, type AnalysisResult as RulesAnalysis } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import type { FlowAnswers } from "@/lib/flow/types";
import { trackEventOnce } from "@/lib/events";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { KitComparisonCard } from "@/components/letter/KitComparisonCard";
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
    trackEventOnce("viewed_analysis", {
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
      <AnalysisResult
        analysis={analysis}
        cta={
          <div className="mb-8 rounded-lg border border-accent/30 bg-accent/5 p-5">
            <p className="mb-4 text-sm text-gray-700">
              Your demand letter cites the exact statute for each of these, and we send it to
              your landlord by certified mail with tracking, so there is a record they received
              it.
            </p>
            <Link
              href="/kit"
              onClick={() => trackEventOnce("clicked_kit")}
              className="block w-full rounded-lg bg-accent px-6 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              Get my letter written and sent, $49
            </Link>
          </div>
        }
      />

      <KitComparisonCard onCtaClick={() => trackEventOnce("clicked_kit")} />

      <ResultsEmailCapture answers={answers} />

      {/* Also in the global footer, but kept on-page per the analysis-screen
          disclaimer requirement. At the bottom it no longer separates the
          analysis from the offer. */}
      <p className="mt-10 text-sm text-gray-500">
        This tool provides general legal information, not legal advice, and does not create an
        attorney-client relationship. For advice about your situation, consult a licensed
        Massachusetts attorney.
      </p>
    </main>
  );
}
