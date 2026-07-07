"use client";

import { useState } from "react";
import { flowSteps } from "./steps";
import { ProgressBar } from "./ProgressBar";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

export function QuestionFlow({ onComplete }: { onComplete: (answers: FlowAnswers) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<FlowAnswers>(initialFlowAnswers);

  const step = flowSteps[stepIndex];
  if (!step) return null;

  const isLastStep = stepIndex === flowSteps.length - 1;

  function update(patch: Partial<FlowAnswers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (isLastStep) {
      onComplete(answers);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div>
      <ProgressBar step={stepIndex + 1} total={flowSteps.length} />
      <h2 className="mb-6 text-2xl font-serif font-semibold text-gray-900">{step.title}</h2>
      {step.render(answers, update)}
      <div className="mt-8 flex gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!step.isValid(answers)}
          className="flex-1 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? "See my analysis" : "Next"}
        </button>
      </div>
    </div>
  );
}
