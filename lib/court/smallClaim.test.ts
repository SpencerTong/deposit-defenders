import { describe, expect, it } from "vitest";
import type { KitOrder, LetterDetails } from "@/lib/db/kitOrders";
import { buildSmallClaimDraft } from "./smallClaim";

const answers = {
  depositAmount: "2000",
  monthlyRent: "2000",
  tenancyStartDate: "2023-01-01",
  moveOutDate: "2024-01-01",
  tenancyEndConfirmed: true,
  receivedBankReceipt: "no",
  receivedStatementOfCondition: "yes",
  receivedItemizedList: false,
  itemizedListDate: "",
  listSwornUnderPenalty: null,
  deductionsClaimed: [],
  amountReturned: "0",
  interestPaidAnnually: "no",
};

const details: LetterDetails = {
  tenantName: "Jordan Renter",
  tenantAddress: { line1: "12 Elm St", city: "Somerville", state: "MA", zip: "02143" },
  landlordName: "Pat Owner",
  landlordAddress: { line1: "99 Oak Ave", city: "Boston", state: "MA", zip: "02110" },
  propertyAddress: "45 Maple St, Unit 1, Somerville, MA 02143",
  ownerOccupied: false,
};

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: null,
    answers,
    stripeSessionId: "cs_test_1",
    status: "fulfilled",
    src: null,
    letterDetails: details,
    mailStatus: "unsent",
    mailTracking: null,
    ...overrides,
  };
}

describe("buildSmallClaimDraft", () => {
  it("names the parties from the stored details", () => {
    const draft = buildSmallClaimDraft(order());
    expect(draft.plaintiffName).toBe("Jordan Renter");
    expect(draft.defendantName).toBe("Pat Owner");
    expect(draft.defendantAddress).toContain("99 Oak Ave");
  });

  it("uses placeholders when details are missing", () => {
    const draft = buildSmallClaimDraft(order({ letterDetails: null }));
    expect(draft.plaintiffName).toBe("[Your Name]");
  });

  it("states the claim amount and describes the violations with dates", () => {
    const draft = buildSmallClaimDraft(order());
    expect(draft.claimAmount).toMatch(/^\$/);
    expect(draft.claimDescription).toContain("security deposit");
    expect(draft.claimDescription).toContain("§15B");
    expect(draft.claimDescription).toContain("January 1, 2024");
  });

  it("keeps the venue and fee guidance hedged and labels the document a draft", () => {
    const draft = buildSmallClaimDraft(order());
    const all = JSON.stringify(draft).toLowerCase();
    expect(all).toContain("draft");
    expect(all).toContain("confirm the current");
    expect(all).not.toContain("guaranteed");
  });
});
