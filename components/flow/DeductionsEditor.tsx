"use client";

import type { FlowAnswers } from "@/lib/flow/types";
import { NumberField } from "./FormFields";

export function DeductionsEditor({
  answers,
  update,
}: {
  answers: FlowAnswers;
  update: (patch: Partial<FlowAnswers>) => void;
}) {
  const rows = answers.deductionsClaimed;

  function updateRow(index: number, patch: Partial<{ description: string; amount: string }>) {
    update({ deductionsClaimed: rows.map((row, i) => (i === index ? { ...row, ...patch } : row)) });
  }

  function addRow() {
    update({ deductionsClaimed: [...rows, { description: "", amount: "" }] });
  }

  function removeRow(index: number) {
    update({ deductionsClaimed: rows.filter((_, i) => i !== index) });
  }

  return (
    <>
      <div className="mb-6">
        <p className="mb-3 block text-base font-medium text-gray-900">
          Did your landlord deduct anything from your deposit? List each item.
        </p>
        {rows.length === 0 && (
          <p className="mb-3 text-sm text-gray-500">
            No deductions? Leave this empty and continue.
          </p>
        )}
        {rows.map((row, i) => (
          <div key={i} className="mb-3 flex gap-2">
            <input
              type="text"
              value={row.description}
              onChange={(e) => updateRow(i, { description: e.target.value })}
              placeholder="e.g. carpet cleaning"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <input
              type="number"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => updateRow(i, { amount: e.target.value })}
              placeholder="$"
              className="w-24 rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove deduction"
              className="rounded-lg border border-gray-300 px-3 text-gray-500 hover:border-red-400 hover:text-red-500"
            >
              &times;
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-sm font-medium text-accent hover:underline">
          + Add a deduction
        </button>
      </div>
      <NumberField
        label="How much of your deposit has your landlord actually returned to you so far?"
        value={answers.amountReturned}
        onChange={(v) => update({ amountReturned: v })}
        prefix="$"
      />
    </>
  );
}
