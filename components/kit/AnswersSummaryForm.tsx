// components/kit/AnswersSummaryForm.tsx
"use client";

import { useState } from "react";
import type { FlowAnswers } from "@/lib/flow/types";
import { flowSteps } from "@/components/flow/steps";
import { isCompleteFlowAnswers } from "@/lib/flow/validation";

type Status = "idle" | "saving" | "error";

interface AnswersSummaryFormProps {
  sessionId: string;
  initial: FlowAnswers;
  onSaved: () => void;
}

export function AnswersSummaryForm({ sessionId, initial, onSaved }: AnswersSummaryFormProps) {
  const [answers, setAnswers] = useState<FlowAnswers>(initial);
  const [status, setStatus] = useState<Status>("idle");

  function update(patch: Partial<FlowAnswers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/kit/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("idle");
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  const valid = isCompleteFlowAnswers(answers);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {flowSteps.map((step) => (
        <div key={step.id}>
          <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {step.title}
          </p>
          {step.render(answers, update)}
        </div>
      ))}
      <button
        type="submit"
        disabled={status === "saving" || !valid}
        className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save changes"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">Could not save. Check the fields and try again.</p>
      )}
    </form>
  );
}
