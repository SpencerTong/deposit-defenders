import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

vi.mock("@/lib/db/leads", () => ({
  recordLead: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/email/resend", () => ({
  sendResultsEmail: vi.fn().mockResolvedValue({ sent: true }),
  sendLetterEmail: vi.fn().mockResolvedValue({ sent: true }),
  sendKitEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

import { POST } from "./route";
import { recordLead } from "@/lib/db/leads";
import { sendResultsEmail, sendLetterEmail } from "@/lib/email/resend";

// Answers with a clear R2 violation (no escrow bank receipt, nothing returned)
// so the analysis produces triggered rules and a nonzero exposure.
function answers(overrides: Partial<FlowAnswers> = {}): FlowAnswers {
  return {
    ...initialFlowAnswers,
    depositAmount: "1500",
    monthlyRent: "1500",
    tenancyStartDate: "2023-01-01",
    moveOutDate: "2024-01-01",
    tenancyEndConfirmed: true,
    receivedBankReceipt: "no",
    receivedStatementOfCondition: "yes",
    receivedItemizedList: true,
    itemizedListDate: "2024-01-10",
    listSwornUnderPenalty: "yes",
    deductionsClaimed: [],
    amountReturned: "0",
    interestPaidAnnually: "yes",
    ...overrides,
  };
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/leads", () => {
  it("rejects an invalid email", async () => {
    const res = await POST(request({ email: "not-an-email", answers: answers() }));
    expect(res.status).toBe(400);
    expect(recordLead).not.toHaveBeenCalled();
  });

  it("rejects missing answers", async () => {
    const res = await POST(request({ email: "renter@example.com" }));
    expect(res.status).toBe(400);
  });

  it("records the lead with computed deposit amount and fired rules", async () => {
    const res = await POST(
      request({ email: "renter@example.com", src: "reddit", answers: answers() })
    );
    expect(res.status).toBe(200);
    expect(recordLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "renter@example.com",
        src: "reddit",
        depositAmount: 1500,
        rulesFired: expect.arrayContaining(["R2_NO_ESCROW_RECEIPT"]),
      })
    );
  });

  it("sends the results email, not the letter", async () => {
    const res = await POST(request({ email: "renter@example.com", answers: answers() }));
    const json = (await res.json()) as { ok: boolean; sent: boolean };
    expect(json).toEqual({ ok: true, sent: true });
    expect(sendResultsEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "renter@example.com",
        violationCount: expect.any(Number),
        maxExposure: expect.any(Number),
      })
    );
    const call = vi.mocked(sendResultsEmail).mock.calls[0]?.[0];
    expect(call?.maxExposure).toBeGreaterThan(0);
    expect(call?.violationCount).toBeGreaterThan(0);
    expect(sendLetterEmail).not.toHaveBeenCalled();
  });
});
