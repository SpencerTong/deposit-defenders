"use client";

import { useEffect, useState } from "react";
import { flowSteps } from "./steps";
import { ProgressBar } from "./ProgressBar";
import { trackEventOnce } from "@/lib/events";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

export function QuestionFlow({
  onComplete,
  initial,
}: {
  onComplete: (answers: FlowAnswers) => void;
  /** Seeds answers already collected before the flow opened, so the landing
   *  page can ask the first question inline without discarding the response. */
  initial?: Partial<FlowAnswers>;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<FlowAnswers>({
    ...initialFlowAnswers,
    ...initial,
  });

  const step = flowSteps[stepIndex];
  const stepId = step?.id;

  // Deduped per step id, so going Back and forward again does not count the
  // same visitor twice. Counts are therefore "people who reached this step",
  // which is what makes consecutive steps comparable as a drop-off curve.
  useEffect(() => {
    if (!stepId) return;
    trackEventOnce("question_step", { step: stepIndex + 1, id: stepId }, stepId);
  }, [stepIndex, stepId]);

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
