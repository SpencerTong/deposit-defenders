import { describe, expect, it } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "../statute/ma";
import { addBusinessDays, buildKitContent } from "./content";
import { filingFeeForClaim } from "./court-data";

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

describe("filingFeeForClaim", () => {
  it("uses the verified mass.gov tiers", () => {
    expect(filingFeeForClaim(400)).toBe(40);
    expect(filingFeeForClaim(500)).toBe(40);
    expect(filingFeeForClaim(1500)).toBe(50);
    expect(filingFeeForClaim(3000)).toBe(100);
    expect(filingFeeForClaim(7000)).toBe(150);
    expect(filingFeeForClaim(9000)).toBe(150);
  });
});

describe("addBusinessDays", () => {
  it("skips weekends", () => {
    // Wed 2026-07-08 + 10 business days = Wed 2026-07-22
    const result = addBusinessDays(new Date("2026-07-08T12:00:00"), 10);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(22);
  });
});

describe("buildKitContent", () => {
  const tenancy = violatingTenancy();
  const analysis = analyzeTenancy(tenancy, new Date("2026-07-08T12:00:00"));
  const kit = buildKitContent(tenancy, analysis, new Date("2026-07-08T12:00:00"));

  it("carries the demand amount from the analysis", () => {
    expect(kit.demandAmount).toBe(
      analysis.exposure.maxExposure.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    );
    expect(kit.trebleApplies).toBe(true);
  });

  it("includes the core sections", () => {
    const headings = kit.sections.map((s) => s.heading);
    expect(headings.some((h) => h.toLowerCase().includes("certified mail"))).toBe(true);
    expect(headings.some((h) => h.toLowerCase().includes("evidence"))).toBe(true);
    expect(headings.some((h) => h.toLowerCase().includes("timeline"))).toBe(true);
    expect(headings.some((h) => h.toLowerCase().includes("small claims"))).toBe(true);
  });

  it("mentions the correct filing fee tier for this claim", () => {
    // outstanding balance here is $1,800 (forfeited deductions: $3,000 − $1,200
    // returned), which lands in the $500.01–$2,000 → $50 tier.
    const smallClaims = kit.sections.find((s) =>
      s.heading.toLowerCase().includes("small claims")
    )!;
    const text = [...smallClaims.paragraphs, ...(smallClaims.list ?? [])].join(" ");
    expect(text).toContain("$50");
    expect(text.toLowerCase()).toContain("confirm the current");
  });

  it("notes that treble damages may exceed the small-claims limit when they apply", () => {
    const all = kit.sections
      .flatMap((s) => [...s.paragraphs, ...(s.list ?? [])])
      .join(" ")
      .toLowerCase();
    expect(all).toContain("7,000");
  });

  it("never promises outcomes and always carries the disclaimer", () => {
    const all = [kit.title, ...kit.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])])]
      .join(" ")
      .toLowerCase();
    expect(all).not.toContain("you will win");
    expect(all).not.toContain("guaranteed");
    expect(kit.disclaimer).toContain("not legal advice");
  });
});
