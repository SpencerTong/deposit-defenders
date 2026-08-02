import { describe, it, expect } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "./ma";
import { build93aDemand } from "./ch93a";

function tenancy(overrides: Partial<TenancyInputs> = {}): TenancyInputs {
  return {
    depositAmount: 2000,
    monthlyRent: 2000,
    tenancyStartDate: new Date("2023-01-01"),
    moveOutDate: new Date("2024-01-01"),
    tenancyEndConfirmed: true,
    receivedItemizedList: false,
    listSwornUnderPenalty: "unknown",
    receivedBankReceipt: "no",
    receivedStatementOfCondition: "yes",
    deductionsClaimed: [],
    amountReturned: 0,
    interestPaidAnnually: "no",
    leaseRequiredProfessionalCleaning: "no",
    ...overrides,
  };
}

const violatingAnalysis = () => analyzeTenancy(tenancy());

const cleanAnalysis = () =>
  analyzeTenancy(
    tenancy({
      receivedItemizedList: true,
      itemizedListDate: new Date("2024-01-10"),
      listSwornUnderPenalty: "yes",
      receivedBankReceipt: "yes",
      amountReturned: 2000,
      interestPaidAnnually: "yes",
    })
  );

describe("build93aDemand", () => {
  it("returns null when the landlord is owner-occupied (Billings v. Wilson)", () => {
    expect(build93aDemand(violatingAnalysis(), { ownerOccupied: true })).toBeNull();
  });

  it("returns null when no violation was found", () => {
    expect(build93aDemand(cleanAnalysis(), { ownerOccupied: false })).toBeNull();
  });

  it("cites the specific 940 CMR 3.17(4) subsections for the triggered rules", () => {
    const demand = build93aDemand(violatingAnalysis(), { ownerOccupied: false });
    expect(demand).not.toBeNull();
    // R2 escrow receipt -> (4)(d); R4 late return -> (4)(g); R6 interest -> (4)(c)
    expect(demand!.practiceParagraph).toContain("940 CMR 3.17(4)(d)");
    expect(demand!.practiceParagraph).toContain("940 CMR 3.17(4)(g)");
    expect(demand!.practiceParagraph).toContain("940 CMR 3.17(4)(c)");
    expect(demand!.practiceParagraph).toContain("M.G.L. c. 93A");
  });

  it("also cites (4)(e) when the landlord never gave a statement of condition", () => {
    const demand = build93aDemand(
      analyzeTenancy(tenancy({ receivedStatementOfCondition: "no" })),
      { ownerOccupied: false }
    );
    expect(demand!.practiceParagraph).toContain("940 CMR 3.17(4)(e)");
  });

  it("demands a response within 30 days and describes 93A remedies with hedged language", () => {
    const demand = build93aDemand(violatingAnalysis(), { ownerOccupied: false });
    expect(demand!.responseDays).toBe(30);
    expect(demand!.remedyParagraph).toContain("30 days");
    expect(demand!.remedyParagraph).toContain("M.G.L. c. 93A, §9");
    const combined = (demand!.practiceParagraph + demand!.remedyParagraph).toLowerCase();
    expect(combined).not.toContain("guaranteed");
    expect(combined).not.toContain("you will win");
    expect(combined).not.toContain("—");
  });
});
