import { describe, expect, it } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "../statute/ma";
import { buildKitContent } from "./content";
import { renderKitPdf } from "./pdf";

const tenancy: TenancyInputs = {
  depositAmount: 3000,
  monthlyRent: 1500,
  tenancyStartDate: new Date("2023-01-01"),
  moveOutDate: new Date("2024-01-01"),
  tenancyEndConfirmed: true,
  receivedItemizedList: false,
  listSwornUnderPenalty: "unknown",
  receivedBankReceipt: "no",
  receivedStatementOfCondition: "no",
  deductionsClaimed: [],
  amountReturned: 0,
  interestPaidAnnually: "no",
  leaseRequiredProfessionalCleaning: "no",
};

describe("renderKitPdf", () => {
  it("renders a non-trivial PDF buffer", async () => {
    const analysis = analyzeTenancy(tenancy, new Date("2026-07-08"));
    const kit = buildKitContent(tenancy, analysis, new Date("2026-07-08"));
    const pdf = await renderKitPdf(kit);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(2000);
  });
});
