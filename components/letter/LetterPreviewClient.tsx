"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      <AnalysisResult analysis={analysis} />

      <KitComparisonCard onCtaClick={() => trackEventOnce("clicked_kit")} />

      <ResultsEmailCapture answers={answers} />
    </main>
  );
}
