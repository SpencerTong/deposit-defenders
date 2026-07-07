"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrPersistAttributionSrc, trackEvent } from "@/lib/events";
import { QuestionFlow } from "@/components/flow/QuestionFlow";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import type { FlowAnswers } from "@/lib/flow/types";

export default function HomePage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    getOrPersistAttributionSrc(window.location.search);
    trackEvent("landed");
  }, []);

  function handleStart() {
    setStarted(true);
    trackEvent("started");
  }

  function handleComplete(answers: FlowAnswers) {
    trackEvent("completed_questions");
    window.sessionStorage.setItem(FLOW_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
    router.push("/letter/preview");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center px-6 py-10">
      {!started ? (
        <section className="text-center">
          <h1 className="mb-4 text-3xl font-serif font-bold leading-tight text-gray-900 sm:text-4xl">
            Did your landlord shortchange your security deposit?
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            Answer a few quick questions about your Massachusetts security deposit. See what the
            law says you may be owed, and generate a free formal demand letter.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark sm:w-auto sm:px-10"
          >
            Check my deposit — it&apos;s free
          </button>
          <p className="mt-4 text-sm text-gray-600">Takes about 2 minutes. No account needed.</p>
        </section>
      ) : (
        <QuestionFlow onComplete={handleComplete} />
      )}
    </main>
  );
}
