import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { KitOrder } from "@/lib/db/kitOrders";

vi.mock("@/lib/db/kitOrders", () => ({
  getKitOrderBySessionId: vi.fn(),
  markKitOrderPaid: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/payments/stripe", () => ({
  retrieveCheckoutSession: vi.fn(),
}));

import { GET } from "./route";
import { getKitOrderBySessionId, markKitOrderPaid } from "@/lib/db/kitOrders";
import { retrieveCheckoutSession } from "@/lib/payments/stripe";

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: null,
    answers: {},
    stripeSessionId: "cs_test_1",
    status: "pending",
    src: null,
    letterDetails: null,
    mailStatus: "unsent",
    mailTracking: null,
    ...overrides,
  };
}

function request(): NextRequest {
  return new NextRequest("http://localhost/api/kit/order?session_id=cs_test_1");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/kit/order", () => {
  it("falls back to Stripe when the webhook has not arrived and unlocks a paid order", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ status: "pending" }));
    vi.mocked(retrieveCheckoutSession).mockResolvedValue({
      paid: true,
      src: null,
      amountTotal: 4900,
    });

    const res = await GET(request());
    const json = (await res.json()) as { ok: boolean; status: string };
    expect(json.status).toBe("paid");
    expect(markKitOrderPaid).toHaveBeenCalledWith("o1");
  });

  it("stays pending when Stripe reports the session unpaid", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ status: "pending" }));
    vi.mocked(retrieveCheckoutSession).mockResolvedValue({
      paid: false,
      src: null,
      amountTotal: null,
    });

    const res = await GET(request());
    const json = (await res.json()) as { ok: boolean; status: string };
    expect(json.status).toBe("pending");
    expect(markKitOrderPaid).not.toHaveBeenCalled();
  });

  it("does not call Stripe for an already fulfilled order", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ status: "fulfilled" }));

    const res = await GET(request());
    const json = (await res.json()) as { ok: boolean; status: string };
    expect(json.status).toBe("fulfilled");
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns the order's answers snapshot", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(
      order({ status: "fulfilled", answers: { depositAmount: "2000" } })
    );

    const res = await GET(request());
    const json = (await res.json()) as { ok: boolean; answers: unknown };
    expect(json.answers).toEqual({ depositAmount: "2000" });
  });
});
