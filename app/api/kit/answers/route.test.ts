import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { KitOrder } from "@/lib/db/kitOrders";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

vi.mock("@/lib/db/kitOrders", () => ({
  getKitOrderBySessionId: vi.fn(),
  setKitOrderAnswers: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { getKitOrderBySessionId, setKitOrderAnswers } from "@/lib/db/kitOrders";

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: null,
    answers: initialFlowAnswers,
    stripeSessionId: "cs_test_1",
    status: "fulfilled",
    src: null,
    letterDetails: null,
    mailStatus: "unsent",
    mailTracking: null,
    ...overrides,
  };
}

const validAnswers: FlowAnswers = {
  ...initialFlowAnswers,
  depositAmount: "2000",
  monthlyRent: "1800",
  tenancyStartDate: "2023-06-01",
  moveOutDate: "2026-05-31",
  tenancyEndConfirmed: true,
  receivedItemizedList: false,
  amountReturned: "0",
};

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/kit/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getKitOrderBySessionId).mockResolvedValue(order());
});

describe("POST /api/kit/answers", () => {
  it("saves valid answers on an unsent order", async () => {
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(200);
    expect(setKitOrderAnswers).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ depositAmount: "2000" })
    );
  });

  it("rejects an incomplete answers payload", async () => {
    const res = await POST(
      request({ sessionId: "cs_test_1", answers: { ...validAnswers, depositAmount: "" } })
    );
    expect(res.status).toBe(400);
    expect(setKitOrderAnswers).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload (wrong field type)", async () => {
    const res = await POST(
      request({ sessionId: "cs_test_1", answers: { ...validAnswers, depositAmount: 2000 } })
    );
    expect(res.status).toBe(400);
    expect(setKitOrderAnswers).not.toHaveBeenCalled();
  });

  it("refuses to edit once mailing has started", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ mailStatus: "sending" }));
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(409);
    expect(setKitOrderAnswers).not.toHaveBeenCalled();
  });

  it("refuses to edit once the letter has been sent", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ mailStatus: "sent" }));
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(409);
  });

  it("refuses when the order is not paid", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ status: "pending" }));
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(403);
  });
});
