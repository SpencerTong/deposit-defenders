import { describe, expect, it } from "vitest";
import { summarizeFlowAnswers } from "./summarize";
import { initialFlowAnswers, type FlowAnswers } from "./types";

const base: FlowAnswers = {
  ...initialFlowAnswers,
  depositAmount: "2000",
  monthlyRent: "1800",
  tenancyStartDate: "2023-06-01",
  moveOutDate: "2026-05-31",
  amountReturned: "0",
};

describe("summarizeFlowAnswers", () => {
  it("summarizes deposit, rent, and tenancy dates", () => {
    const summary = summarizeFlowAnswers(base);
    expect(summary).toContain("$2000");
    expect(summary).toContain("$1800/mo");
    expect(summary).toContain("06/01/2023");
    expect(summary).toContain("05/31/2026");
  });

  it("reports no deductions claimed when the list is empty", () => {
    expect(summarizeFlowAnswers(base)).toContain("no deductions claimed");
  });

  it("counts and totals deductions when present", () => {
    const withDeductions: FlowAnswers = {
      ...base,
      deductionsClaimed: [
        { description: "Carpet cleaning", amount: "150" },
        { description: "Wall patching", amount: "50" },
      ],
    };
    const summary = summarizeFlowAnswers(withDeductions);
    expect(summary).toContain("2 deductions claimed ($200.00)");
  });

  it("rounds decimal deduction totals to two decimal places", () => {
    const withDecimalDeductions: FlowAnswers = {
      ...base,
      deductionsClaimed: [
        { description: "Carpet cleaning", amount: "150.11" },
        { description: "Wall patching", amount: "58.21" },
      ],
    };
    const summary = summarizeFlowAnswers(withDecimalDeductions);
    expect(summary).toContain("$208.32");
    expect(summary).not.toMatch(/\$208\.32\d/);
  });

  it("never uses an em dash or en dash", () => {
    const withDeductions: FlowAnswers = {
      ...base,
      deductionsClaimed: [{ description: "Carpet cleaning", amount: "150" }],
    };
    expect(summarizeFlowAnswers(withDeductions)).not.toMatch(/[–—]/);
  });
});
