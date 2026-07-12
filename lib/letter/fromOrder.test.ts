import { describe, expect, it } from "vitest";
import type { KitOrder, LetterDetails } from "@/lib/db/kitOrders";
import { buildLetterForOrder, formatAddress } from "./fromOrder";

const TODAY = new Date("2026-07-11");

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
  tenantAddress: { line1: "12 Elm St", line2: "Apt 2", city: "Somerville", state: "MA", zip: "02143" },
  landlordName: "Pat Owner",
  landlordAddress: { line1: "99 Oak Ave", city: "Boston", state: "MA", zip: "02110" },
  propertyAddress: "45 Maple St, Unit 1, Somerville, MA 02143",
  ownerOccupied: false,
};

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: "buyer@example.com",
    answers,
    stripeSessionId: "cs_test_1",
    status: "fulfilled",
    src: null,
    letterDetails: null,
    mailStatus: "unsent",
    mailTracking: null,
    ...overrides,
  };
}

describe("formatAddress", () => {
  it("joins the address parts on separate lines", () => {
    expect(formatAddress(details.tenantAddress)).toBe("12 Elm St\nApt 2\nSomerville, MA 02143");
  });
});

describe("buildLetterForOrder", () => {
  it("uses placeholders when no letter details are stored", () => {
    const letter = buildLetterForOrder(order(), TODAY);
    expect(letter.tenantName).toBe("[Your Name]");
    expect(letter.landlordName).toBe("[Landlord Name]");
  });

  it("fills in the stored party details and produces the combined 93A letter", () => {
    const letter = buildLetterForOrder(order({ letterDetails: details }), TODAY);
    expect(letter.tenantName).toBe("Jordan Renter");
    expect(letter.landlordAddress).toContain("99 Oak Ave");
    expect(letter.subject).toContain("93A");
    expect(letter.paragraphs.join(" ")).toContain("940 CMR 3.17(4)");
  });

  it("produces the plain 15B letter when the landlord is owner-occupied", () => {
    const letter = buildLetterForOrder(
      order({ letterDetails: { ...details, ownerOccupied: true } }),
      TODAY
    );
    expect(letter.subject).not.toContain("93A");
    expect(letter.paragraphs.join(" ")).toContain("10 business days");
  });

  it("appends the buyer's custom note as its own paragraph", () => {
    const letter = buildLetterForOrder(
      order({ letterDetails: { ...details, customNote: "I have photos from move-out day." } }),
      TODAY
    );
    expect(letter.paragraphs).toContain("I have photos from move-out day.");
  });
});
