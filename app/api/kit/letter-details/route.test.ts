import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { KitOrder } from "@/lib/db/kitOrders";

vi.mock("@/lib/db/kitOrders", () => ({
  getKitOrderBySessionId: vi.fn(),
  setKitOrderLetterDetails: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { getKitOrderBySessionId, setKitOrderLetterDetails } from "@/lib/db/kitOrders";

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: null,
    answers: {},
    stripeSessionId: "cs_test_1",
    status: "fulfilled",
    src: null,
    letterDetails: null,
    mailStatus: "unsent",
    mailTracking: null,
    ...overrides,
  };
}

const validDetails = {
  tenantName: "Jordan Renter",
  tenantAddress: { line1: "12 Elm St", city: "Somerville", state: "MA", zip: "02143" },
  landlordName: "Pat Owner",
  landlordAddress: { line1: "99 Oak Ave", city: "Boston", state: "MA", zip: "02110" },
  propertyAddress: "45 Maple St, Unit 1, Somerville, MA 02143",
  ownerOccupied: false,
};

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/kit/letter-details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getKitOrderBySessionId).mockResolvedValue(order());
});

describe("POST /api/kit/letter-details", () => {
  it("saves valid details on a paid order", async () => {
    const res = await POST(request({ sessionId: "cs_test_1", details: validDetails }));
    expect(res.status).toBe(200);
    expect(setKitOrderLetterDetails).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ tenantName: "Jordan Renter", ownerOccupied: false })
    );
  });

  it("rejects a malformed zip code", async () => {
    const res = await POST(
      request({
        sessionId: "cs_test_1",
        details: {
          ...validDetails,
          landlordAddress: { ...validDetails.landlordAddress, zip: "021" },
        },
      })
    );
    expect(res.status).toBe(400);
    expect(setKitOrderLetterDetails).not.toHaveBeenCalled();
  });

  it("rejects a missing owner-occupied answer", async () => {
    const { ownerOccupied: _omitted, ...withoutOwner } = validDetails;
    const res = await POST(request({ sessionId: "cs_test_1", details: withoutOwner }));
    expect(res.status).toBe(400);
  });

  it("refuses when the order is not paid", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ status: "pending" }));
    const res = await POST(request({ sessionId: "cs_test_1", details: validDetails }));
    expect(res.status).toBe(403);
  });
});
