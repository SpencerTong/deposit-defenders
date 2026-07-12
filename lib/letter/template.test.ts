import { describe, expect, it } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "../statute/ma";
import { buildCombinedDemandLetter, buildDemandLetter } from "./template";

const TODAY = new Date("2026-07-11");

function violatingTenancy(): TenancyInputs {
  return {
    depositAmount: 3000,
    monthlyRent: 1500,
    tenancyStartDate: new Date("2023-01-01"),
    moveOutDate: new Date("2024-01-01"),
    tenancyEndConfirmed: true,
    receivedItemizedList: true,
    itemizedListDate: new Date("2024-03-01"),
    listSwornUnderPenalty: "no",
    receivedBankReceipt: "no",
    receivedStatementOfCondition: "no",
    deductionsClaimed: [{ description: "Carpet cleaning", amount: 300 }],
    amountReturned: 1200,
    interestPaidAnnually: "no",
  };
}

function cleanTenancy(): TenancyInputs {
  return {
    depositAmount: 1500,
    monthlyRent: 1500,
    tenancyStartDate: new Date("2023-06-01"),
    moveOutDate: new Date("2023-12-01"),
    tenancyEndConfirmed: true,
    receivedItemizedList: false,
    listSwornUnderPenalty: "unknown",
    receivedBankReceipt: "yes",
    receivedStatementOfCondition: "yes",
    deductionsClaimed: [],
    amountReturned: 1500,
    interestPaidAnnually: "unknown",
  };
}

describe("buildDemandLetter", () => {
  it("uses bracketed placeholders when no party info is supplied", () => {
    const letter = buildDemandLetter(
      violatingTenancy(),
      analyzeTenancy(violatingTenancy(), new Date("2024-02-15"))
    );
    expect(letter.tenantName).toBe("[Your Name]");
    expect(letter.landlordName).toBe("[Landlord Name]");
    expect(letter.propertyAddress).toBe("[Property Address]");
  });

  it("uses supplied party info instead of placeholders", () => {
    const letter = buildDemandLetter(
      violatingTenancy(),
      analyzeTenancy(violatingTenancy(), new Date("2024-02-15")),
      {
        tenantName: "Jane Tenant",
        landlordName: "Bob Landlord",
        propertyAddress: "12 Main St, Boston, MA",
      }
    );
    expect(letter.tenantName).toBe("Jane Tenant");
    expect(letter.landlordName).toBe("Bob Landlord");
    expect(letter.propertyAddress).toBe("12 Main St, Boston, MA");
  });

  it("includes a paragraph citing each triggered violation", () => {
    const analysis = analyzeTenancy(violatingTenancy(), new Date("2024-02-15"));
    const letter = buildDemandLetter(violatingTenancy(), analysis);
    const triggered = analysis.rules.filter(
      (r) => r.triggered && r.id !== "R5_WEAR_AND_TEAR_FLAGS"
    );
    expect(triggered.length).toBeGreaterThan(0);
    for (const rule of triggered) {
      expect(letter.paragraphs.some((p) => p.includes(rule.citation))).toBe(true);
    }
  });

  it("omits the informational wear-and-tear flag from the violations list", () => {
    const analysis = analyzeTenancy(violatingTenancy(), new Date("2024-02-15"));
    const letter = buildDemandLetter(violatingTenancy(), analysis);
    expect(letter.paragraphs.some((p) => p.includes("§15B(4)(iii)"))).toBe(false);
  });

  it("states the demand amount matching the analysis's max exposure", () => {
    const analysis = analyzeTenancy(violatingTenancy(), new Date("2024-02-15"));
    const letter = buildDemandLetter(violatingTenancy(), analysis);
    expect(analysis.exposure.maxExposure).toBe(5550);
    expect(letter.paragraphs.some((p) => p.includes("$5,550"))).toBe(true);
  });

  it("gives a 10-business-day deadline and reserves small-claims remedies", () => {
    const analysis = analyzeTenancy(violatingTenancy(), new Date("2024-02-15"));
    const letter = buildDemandLetter(violatingTenancy(), analysis);
    const deadlinePara = letter.paragraphs.find((p) => p.includes("10 business days"));
    expect(deadlinePara).toBeDefined();
    expect(deadlinePara).toMatch(/small claims/i);
    expect(deadlinePara).toMatch(/treble/i);
    expect(deadlinePara).toMatch(/attorney/i);
  });

  it("never uses outcome-promising language", () => {
    const analysis = analyzeTenancy(violatingTenancy(), new Date("2024-02-15"));
    const letter = buildDemandLetter(violatingTenancy(), analysis);
    const fullText = letter.paragraphs.join(" ").toLowerCase();
    expect(fullText).not.toMatch(/guarantee/);
    expect(fullText).not.toMatch(/you will win/);
  });

  it("includes the required legal disclaimer verbatim", () => {
    const analysis = analyzeTenancy(cleanTenancy(), new Date("2024-01-05"));
    const letter = buildDemandLetter(cleanTenancy(), analysis);
    expect(letter.disclaimer).toBe(
      "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney."
    );
  });

  it("still produces a coherent letter when no violations are found", () => {
    const analysis = analyzeTenancy(cleanTenancy(), new Date("2024-01-05"));
    const letter = buildDemandLetter(cleanTenancy(), analysis);
    expect(letter.paragraphs.length).toBeGreaterThan(0);
    expect(letter.paragraphs.some((p) => /did not (identify|find)/i.test(p))).toBe(true);
  });
});

describe("buildCombinedDemandLetter", () => {
  it("delegates to the plain §15B letter when the landlord is owner-occupied", () => {
    const t = violatingTenancy();
    const a = analyzeTenancy(t);
    const combined = buildCombinedDemandLetter(t, a, {}, { ownerOccupied: true, today: TODAY });
    const plain = buildDemandLetter(t, a, {}, TODAY);
    expect(combined).toEqual(plain);
  });

  it("produces a combined §15B + 93A demand with a 30-day deadline", () => {
    const t = violatingTenancy();
    const a = analyzeTenancy(t);
    const letter = buildCombinedDemandLetter(t, a, {}, { ownerOccupied: false, today: TODAY });
    const body = letter.paragraphs.join(" ");
    expect(letter.subject).toContain("93A");
    expect(body).toContain("M.G.L. c. 93A, §9");
    expect(body).toContain("940 CMR 3.17(4)");
    expect(body).toContain("30 days");
    expect(body).not.toContain("10 business days");
    expect(body.toLowerCase()).not.toContain("guaranteed");
  });

  it("keeps the §15B letter unchanged for a clean analysis even when not owner-occupied", () => {
    const t = cleanTenancy();
    const a = analyzeTenancy(t);
    const combined = buildCombinedDemandLetter(t, a, {}, { ownerOccupied: false, today: TODAY });
    expect(combined.paragraphs.join(" ")).not.toContain("93A");
  });
});
