import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { KitOrder, LetterDetails } from "@/lib/db/kitOrders";

vi.mock("@/lib/db/kitOrders", () => ({
  getKitOrderBySessionId: vi.fn(),
  claimKitOrderForMailing: vi.fn(),
  setKitOrderMailResult: vi.fn().mockResolvedValue(undefined),
  revertKitOrderMailToUnsent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/mail/lob", () => ({
  mailCertifiedLetter: vi.fn(),
  isMailFailure: (o: unknown) => o !== null && typeof o === "object" && "failure" in o,
}));
vi.mock("@/lib/letter/pdf", () => ({
  renderDemandLetterPdf: vi.fn().mockResolvedValue(Buffer.from("%PDF-1.4 fake")),
}));
vi.mock("@/lib/email/resend", () => ({
  sendTrackingEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

import { POST } from "./route";
import {
  claimKitOrderForMailing,
  getKitOrderBySessionId,
  revertKitOrderMailToUnsent,
  setKitOrderMailResult,
} from "@/lib/db/kitOrders";
import { mailCertifiedLetter } from "@/lib/mail/lob";
import { sendTrackingEmail } from "@/lib/email/resend";

const details: LetterDetails = {
  tenantName: "Jordan Renter",
  tenantAddress: { line1: "12 Elm St", city: "Somerville", state: "MA", zip: "02143" },
  landlordName: "Pat Owner",
  landlordAddress: { line1: "99 Oak Ave", city: "Boston", state: "MA", zip: "02110" },
  propertyAddress: "45 Maple St, Unit 1, Somerville, MA 02143",
  ownerOccupied: false,
};

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

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: "buyer@example.com",
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

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/kit/mail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getKitOrderBySessionId).mockResolvedValue(order());
  vi.mocked(claimKitOrderForMailing).mockResolvedValue(true);
  vi.mocked(mailCertifiedLetter).mockResolvedValue({
    id: "ltr_123",
    trackingNumber: "9407300000000000000001",
  });
});

describe("POST /api/kit/mail", () => {
  it("mails the letter once and stores the Lob result", async () => {
    const res = await POST(request({ sessionId: "cs_test_1" }));
    const json = (await res.json()) as { ok: boolean; tracking: string | null };
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, tracking: "9407300000000000000001" });
    expect(mailCertifiedLetter).toHaveBeenCalledOnce();
    expect(setKitOrderMailResult).toHaveBeenCalledWith("o1", {
      lobId: "ltr_123",
      tracking: "9407300000000000000001",
    });
    expect(sendTrackingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@example.com",
        landlordName: "Pat Owner",
        trackingNumber: "9407300000000000000001",
        workspaceUrl: expect.stringContaining("/kit/success?session_id=cs_test_1"),
      })
    );
  });

  it("still succeeds when the tracking email fails, since the letter is already mailed", async () => {
    vi.mocked(sendTrackingEmail).mockRejectedValueOnce(new Error("smtp down"));
    const res = await POST(request({ sessionId: "cs_test_1" }));
    expect(res.status).toBe(200);
    expect(setKitOrderMailResult).toHaveBeenCalled();
  });

  it("does not email tracking when the mailing failed", async () => {
    vi.mocked(mailCertifiedLetter).mockResolvedValue({ failure: "provider_error" });
    await POST(request({ sessionId: "cs_test_1" }));
    expect(sendTrackingEmail).not.toHaveBeenCalled();
  });

  it("refuses when letter details have not been saved", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ letterDetails: null }));
    const res = await POST(request({ sessionId: "cs_test_1" }));
    expect(res.status).toBe(400);
    expect(mailCertifiedLetter).not.toHaveBeenCalled();
  });

  it("refuses a second mailing attempt (idempotency claim fails)", async () => {
    vi.mocked(claimKitOrderForMailing).mockResolvedValue(false);
    const res = await POST(request({ sessionId: "cs_test_1" }));
    expect(res.status).toBe(409);
    expect(mailCertifiedLetter).not.toHaveBeenCalled();
  });

  it("reverts the claim when Lob fails so the buyer can retry", async () => {
    vi.mocked(mailCertifiedLetter).mockResolvedValue({ failure: "provider_error" });
    const res = await POST(request({ sessionId: "cs_test_1" }));
    expect(res.status).toBe(502);
    expect(revertKitOrderMailToUnsent).toHaveBeenCalledWith("o1");
    expect(setKitOrderMailResult).not.toHaveBeenCalled();
  });

  it("returns a fixable 400 when the landlord address fails deliverability", async () => {
    vi.mocked(mailCertifiedLetter).mockResolvedValue({ failure: "undeliverable_address" });
    const res = await POST(request({ sessionId: "cs_test_1" }));
    const json = (await res.json()) as { ok: boolean; error: string };
    expect(res.status).toBe(400);
    expect(json.error).toBe("address_unverified");
    expect(revertKitOrderMailToUnsent).toHaveBeenCalledWith("o1");
  });
});
