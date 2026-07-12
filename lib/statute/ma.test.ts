import { describe, it, expect } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "./ma";

function baseInputs(overrides: Partial<TenancyInputs> = {}): TenancyInputs {
  return {
    depositAmount: 1500,
    monthlyRent: 1500,
    tenancyStartDate: new Date("2023-01-01"),
    moveOutDate: new Date("2024-01-01"),
    tenancyEndConfirmed: true,
    receivedItemizedList: true,
    itemizedListDate: new Date("2024-01-10"),
    listSwornUnderPenalty: "yes",
    receivedBankReceipt: "yes",
    receivedStatementOfCondition: "yes",
    deductionsClaimed: [],
    amountReturned: 1500,
    interestPaidAnnually: "yes",
    ...overrides,
  };
}

function ruleById(result: ReturnType<typeof analyzeTenancy>, id: string) {
  const rule = result.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`rule ${id} not found in result`);
  return rule;
}

describe("analyzeTenancy - clean case", () => {
  it("triggers no violations when everything was done by the book", () => {
    const result = analyzeTenancy(baseInputs(), new Date("2024-01-20"));

    for (const rule of result.rules) {
      expect(rule.triggered, `${rule.id} should not trigger`).toBe(false);
    }
    expect(result.exposure.maxExposure).toBe(0);
    expect(result.exposure.trebleApplies).toBe(false);
  });
});

describe("R1_DEPOSIT_EXCEEDS_ONE_MONTH", () => {
  it("triggers when the deposit is more than one month's rent", () => {
    const result = analyzeTenancy(
      baseInputs({ depositAmount: 2000, monthlyRent: 1500 }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R1_DEPOSIT_EXCEEDS_ONE_MONTH");
    expect(rule.triggered).toBe(true);
    expect(rule.citation).toContain("15B(1)(b)");
  });

  it("does not by itself expose the landlord to treble damages", () => {
    const result = analyzeTenancy(
      baseInputs({ depositAmount: 2000, monthlyRent: 1500, amountReturned: 2000 }),
      new Date("2024-01-20")
    );
    expect(result.exposure.trebleApplies).toBe(false);
  });
});

describe("R2_NO_ESCROW_RECEIPT", () => {
  it("triggers when the landlord never gave a bank name/account receipt", () => {
    const result = analyzeTenancy(
      baseInputs({ receivedBankReceipt: "no" }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R2_NO_ESCROW_RECEIPT");
    expect(rule.triggered).toBe(true);
    expect(rule.citation).toContain("15B(3)(a)");
    expect(rule.citation).toContain("15B(7)");
  });

  it("exposes the landlord to treble damages on the outstanding balance", () => {
    const result = analyzeTenancy(
      baseInputs({ receivedBankReceipt: "no", amountReturned: 0 }),
      new Date("2024-01-20")
    );
    expect(result.exposure.trebleApplies).toBe(true);
    expect(result.exposure.trebledPrincipal).toBe(1500 * 3);
  });

  it("triggers the violation even if the deposit was already fully returned", () => {
    const result = analyzeTenancy(
      baseInputs({ receivedBankReceipt: "no", amountReturned: 1500 }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R2_NO_ESCROW_RECEIPT");
    expect(rule.triggered).toBe(true);
    expect(result.exposure.trebledPrincipal).toBe(0);
  });

  it("treats an unrecalled receipt (unknown) the same as never having received one", () => {
    const result = analyzeTenancy(
      baseInputs({ receivedBankReceipt: "unknown" }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R2_NO_ESCROW_RECEIPT");
    expect(rule.triggered).toBe(true);
  });
});

describe("R3_LATE_OR_MISSING_ITEMIZATION", () => {
  it("triggers when the itemized list arrives more than 30 days after move-out", () => {
    const result = analyzeTenancy(
      baseInputs({
        receivedItemizedList: true,
        itemizedListDate: new Date("2024-02-15"),
        deductionsClaimed: [{ description: "carpet cleaning", amount: 300 }],
        amountReturned: 1200,
      }),
      new Date("2024-03-01")
    );
    const rule = ruleById(result, "R3_LATE_OR_MISSING_ITEMIZATION");
    expect(rule.triggered).toBe(true);
    expect(rule.citation).toContain("15B(4)");
    expect(rule.citation).toContain("15B(6)(b)");
  });

  it("triggers when the list was never sworn under penalty of perjury", () => {
    const result = analyzeTenancy(
      baseInputs({
        listSwornUnderPenalty: "no",
        deductionsClaimed: [{ description: "carpet cleaning", amount: 300 }],
        amountReturned: 1200,
      }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R3_LATE_OR_MISSING_ITEMIZATION");
    expect(rule.triggered).toBe(true);
  });

  it("triggers when no itemized list was ever received but deductions were taken", () => {
    const result = analyzeTenancy(
      baseInputs({
        receivedItemizedList: false,
        itemizedListDate: undefined,
        listSwornUnderPenalty: "unknown",
        deductionsClaimed: [{ description: "cleaning", amount: 300 }],
        amountReturned: 1200,
      }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R3_LATE_OR_MISSING_ITEMIZATION");
    expect(rule.triggered).toBe(true);
  });

  it("forfeits the deductions so treble damages apply to the full deposit when it isn't fully returned", () => {
    const result = analyzeTenancy(
      baseInputs({
        listSwornUnderPenalty: "no",
        deductionsClaimed: [{ description: "carpet cleaning", amount: 300 }],
        amountReturned: 1200,
      }),
      new Date("2024-02-15")
    );
    expect(result.exposure.trebleApplies).toBe(true);
    expect(result.exposure.outstandingBalance).toBe(300);
    expect(result.exposure.trebledPrincipal).toBe(300 * 3);
  });

  it("does not itself claim treble damages when subsection 6(b) is the only ground (no unreturned balance)", () => {
    const result = analyzeTenancy(
      baseInputs({
        itemizedListDate: new Date("2024-02-15"),
        deductionsClaimed: [],
        amountReturned: 1500,
      }),
      new Date("2024-03-01")
    );
    const rule = ruleById(result, "R3_LATE_OR_MISSING_ITEMIZATION");
    expect(rule.triggered).toBe(true);
    expect(result.exposure.trebleApplies).toBe(false);
  });
});

describe("R4_LATE_RETURN", () => {
  it("triggers when more than 30 days have passed since move-out and money is still owed", () => {
    const result = analyzeTenancy(
      baseInputs({ amountReturned: 0 }),
      new Date("2024-02-15")
    );
    const rule = ruleById(result, "R4_LATE_RETURN");
    expect(rule.triggered).toBe(true);
    expect(rule.citation).toContain("15B(6)(e)");
    expect(rule.citation).toContain("15B(7)");
    expect(result.exposure.trebleApplies).toBe(true);
    expect(result.exposure.trebledPrincipal).toBe(1500 * 3);
  });

  it("does not trigger within the 30-day window even if nothing has been returned yet", () => {
    const result = analyzeTenancy(
      baseInputs({ amountReturned: 0 }),
      new Date("2024-01-10")
    );
    const rule = ruleById(result, "R4_LATE_RETURN");
    expect(rule.triggered).toBe(false);
  });

  it("does not trigger once the full balance has been returned", () => {
    const result = analyzeTenancy(
      baseInputs({ amountReturned: 1500 }),
      new Date("2024-03-01")
    );
    const rule = ruleById(result, "R4_LATE_RETURN");
    expect(rule.triggered).toBe(false);
  });
});

describe("R6_NO_INTEREST_PAID", () => {
  it("triggers when the deposit was held a year or more with no interest paid", () => {
    const result = analyzeTenancy(
      baseInputs({ interestPaidAnnually: "no" }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R6_NO_INTEREST_PAID");
    expect(rule.triggered).toBe(true);
    expect(rule.citation).toContain("15B(3)(b)");
  });

  it("does not trigger for a tenancy under one year regardless of interest paid", () => {
    const result = analyzeTenancy(
      baseInputs({
        tenancyStartDate: new Date("2023-09-01"),
        moveOutDate: new Date("2024-01-01"),
        interestPaidAnnually: "no",
      }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R6_NO_INTEREST_PAID");
    expect(rule.triggered).toBe(false);
  });

  it("does not by itself expose the landlord to treble damages", () => {
    const result = analyzeTenancy(
      baseInputs({ interestPaidAnnually: "no", amountReturned: 1500 }),
      new Date("2024-01-20")
    );
    expect(result.exposure.trebleApplies).toBe(false);
  });

  it("treats unknown interest status as a potential violation worth flagging", () => {
    const result = analyzeTenancy(
      baseInputs({ interestPaidAnnually: "unknown" }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R6_NO_INTEREST_PAID");
    expect(rule.triggered).toBe(true);
  });
});

describe("R5 wear-and-tear keyword flags", () => {
  it("flags common cosmetic terms as commonly contestable", () => {
    const result = analyzeTenancy(
      baseInputs({
        deductionsClaimed: [
          { description: "Repainting walls", amount: 200 },
          { description: "General cleaning fee", amount: 150 },
          { description: "Nail holes in bedroom wall", amount: 50 },
        ],
        amountReturned: 1100,
      }),
      new Date("2024-01-20")
    );

    expect(result.deductionFlags).toHaveLength(3);
    for (const flag of result.deductionFlags) {
      expect(flag.classification).toBe("commonly_contestable");
    }
  });

  it("flags clear structural/property damage as potentially legitimate", () => {
    const result = analyzeTenancy(
      baseInputs({
        deductionsClaimed: [
          { description: "Broken window replacement", amount: 400 },
          { description: "Water damage from unauthorized fish tank", amount: 600 },
        ],
        amountReturned: 500,
      }),
      new Date("2024-01-20")
    );

    for (const flag of result.deductionFlags) {
      expect(flag.classification).toBe("potentially_legitimate");
    }
  });

  it("flags ambiguous descriptions as unclear", () => {
    const result = analyzeTenancy(
      baseInputs({
        deductionsClaimed: [{ description: "Miscellaneous charges", amount: 75 }],
        amountReturned: 1425,
      }),
      new Date("2024-01-20")
    );

    expect(result.deductionFlags[0]?.classification).toBe("unclear");
  });

  it("is purely informational and does not label itself a legal conclusion", () => {
    const result = analyzeTenancy(
      baseInputs({
        deductionsClaimed: [{ description: "Carpet cleaning", amount: 100 }],
        amountReturned: 1400,
      }),
      new Date("2024-01-20")
    );
    const rule = ruleById(result, "R5_WEAR_AND_TEAR_FLAGS");
    expect(rule.explanation.toLowerCase()).toContain("informational");
  });
});

describe("plain-terms summaries", () => {
  it("every triggered rule carries a plain-English summary free of statute citations", () => {
    const result = analyzeTenancy(
      baseInputs({
        depositAmount: 3000,
        monthlyRent: 1500,
        receivedBankReceipt: "no",
        receivedItemizedList: false,
        deductionsClaimed: [{ description: "Repainting", amount: 300 }],
        amountReturned: 0,
        interestPaidAnnually: "no",
      }),
      new Date("2024-03-01")
    );
    const triggered = result.rules.filter((r) => r.triggered && r.id !== "R5_WEAR_AND_TEAR_FLAGS");
    expect(triggered.length).toBeGreaterThanOrEqual(4);
    for (const rule of triggered) {
      expect(rule.plainTerms.length).toBeGreaterThan(20);
      expect(rule.plainTerms).not.toContain("§");
      expect(rule.plainTerms.toLowerCase()).not.toContain("guaranteed");
    }
  });
});
