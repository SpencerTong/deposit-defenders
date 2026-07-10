"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrPersistAttributionSrc, trackEvent } from "@/lib/events";
import { QuestionFlow } from "@/components/flow/QuestionFlow";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import type { FlowAnswers } from "@/lib/flow/types";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-3xl font-bold text-accent">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
}

function HowStep({ number, title, detail }: { number: number; title: string; detail: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-600">{detail}</p>
      </div>
    </li>
  );
}

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

  if (started) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center px-6 py-10">
        <QuestionFlow onComplete={handleComplete} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <section className="text-center">
        <h1 className="mb-4 text-3xl font-serif font-bold leading-tight text-gray-900 sm:text-4xl">
          Your landlord kept your deposit? Massachusetts law may owe you triple.
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Answer six quick questions about your security deposit. See instantly — and free —
          what Massachusetts law says you may be owed.
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

      <section className="mt-14">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
          Losing your deposit is common. Letting it go is optional.
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat value="26%" label="of renters have lost a security deposit" />
          <Stat value="41%" label="is all who expect to get their full deposit back" />
          <Stat value="36%" label="who lost one got no explanation from the landlord" />
        </div>
        <div className="mt-4 rounded-lg border-l-4 border-accent bg-gray-50 p-4">
          <p className="text-gray-800">
            Massachusetts law (M.G.L. c. 186 &sect;15B) can make a landlord who breaks the rules
            pay <strong>up to 3&times; the deposit</strong> plus court costs and attorney&apos;s
            fees.
          </p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Source: Rent.com renter survey (1,000 U.S. renters, 2023).
        </p>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-center text-lg font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-5">
          <HowStep
            number={1}
            title="Answer ~6 questions about your deposit"
            detail="Takes about 2 minutes. No account, no documents needed to start."
          />
          <HowStep
            number={2}
            title="See what the law says you may be owed — free"
            detail="An instant analysis of your situation under the Massachusetts security deposit law, with each potential violation cited to the statute."
          />
          <HowStep
            number={3}
            title="For $49, we generate your ready-to-send demand letter and small-claims kit"
            detail="A formal demand letter citing your specific violations, plus certified-mail instructions, an evidence checklist, and a deadline tracker."
          />
        </ol>
      </section>

      <section className="mt-14 text-center">
        <button
          type="button"
          onClick={handleStart}
          className="w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark sm:w-auto sm:px-10"
        >
          Check my deposit — it&apos;s free
        </button>
      </section>
    </main>
  );
}
