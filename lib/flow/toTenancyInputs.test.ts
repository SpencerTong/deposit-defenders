import { describe, it, expect } from "vitest";
import { toTenancyInputs } from "./toTenancyInputs";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

function answers(overrides: Partial<FlowAnswers> = {}): FlowAnswers {
  return {
    ...initialFlowAnswers,
    depositAmount: "1500",
    monthlyRent: "1500",
    tenancyStartDate: "2023-01-01",
    moveOutDate: "2024-01-01",
    tenancyEndConfirmed: true,
    receivedBankReceipt: "yes",
    receivedStatementOfCondition: "yes",
    receivedItemizedList: true,
    itemizedListDate: "2024-01-10",
    listSwornUnderPenalty: "yes",
    deductionsClaimed: [],
    amountReturned: "1500",
    interestPaidAnnually: "yes",
    ...overrides,
  };
}

describe("toTenancyInputs", () => {
  it("converts numeric strings to numbers", () => {
    const result = toTenancyInputs(answers({ depositAmount: "1750.50", monthlyRent: "1500" }));
    expect(result.depositAmount).toBe(1750.5);
    expect(result.monthlyRent).toBe(1500);
  });

  it("converts date strings to Date objects", () => {
    const result = toTenancyInputs(answers());
    expect(result.tenancyStartDate).toEqual(new Date("2023-01-01"));
    expect(result.moveOutDate).toEqual(new Date("2024-01-01"));
  });

  it("omits itemizedListDate when no itemized list was received", () => {
    const result = toTenancyInputs(
      answers({ receivedItemizedList: false, itemizedListDate: "" })
    );
    expect(result.receivedItemizedList).toBe(false);
    expect(result.itemizedListDate).toBeUndefined();
  });

  it("includes itemizedListDate when an itemized list was received", () => {
    const result = toTenancyInputs(answers());
    expect(result.itemizedListDate).toEqual(new Date("2024-01-10"));
  });

  it("filters out blank deduction rows and converts amounts", () => {
    const result = toTenancyInputs(
      answers({
        deductionsClaimed: [
          { description: "Carpet cleaning", amount: "300" },
          { description: "", amount: "" },
          { description: "Broken window", amount: "400" },
        ],
      })
    );
    expect(result.deductionsClaimed).toEqual([
      { description: "Carpet cleaning", amount: 300 },
      { description: "Broken window", amount: 400 },
    ]);
  });

  it("defaults unanswered tri-state questions to unknown", () => {
    const result = toTenancyInputs(
      answers({
        receivedBankReceipt: null,
        receivedStatementOfCondition: null,
        listSwornUnderPenalty: null,
        interestPaidAnnually: null,
      })
    );
    expect(result.receivedBankReceipt).toBe("unknown");
    expect(result.receivedStatementOfCondition).toBe("unknown");
    expect(result.listSwornUnderPenalty).toBe("unknown");
    expect(result.interestPaidAnnually).toBe("unknown");
  });

  it("treats an unparseable numeric field as 0 rather than NaN", () => {
    const result = toTenancyInputs(answers({ amountReturned: "" }));
    expect(result.amountReturned).toBe(0);
  });

  it("maps the professional cleaning answer through", () => {
    const answers = { ...initialFlowAnswers, leaseRequiredProfessionalCleaning: "yes" as const };
    expect(toTenancyInputs(answers).leaseRequiredProfessionalCleaning).toBe("yes");
  });

  it("treats a snapshot saved before this field existed as not sure", () => {
    // kit_orders.answers rows predate the field, and fromOrder.ts rebuilds every
    // buyer's letter from that stored snapshot on each read.
    const legacy = { ...initialFlowAnswers } as Record<string, unknown>;
    delete legacy.leaseRequiredProfessionalCleaning;

    const result = toTenancyInputs(legacy as unknown as FlowAnswers);

    expect(result.leaseRequiredProfessionalCleaning).toBe("unknown");
  });
});
