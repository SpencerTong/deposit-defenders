import { describe, expect, it, vi } from "vitest";
import { initialFlowAnswers } from "../flow/types";
import { fulfillKitOrder, type FulfillDeps } from "./fulfill";

const answers = {
  ...initialFlowAnswers,
  depositAmount: "3000",
  monthlyRent: "1500",
  tenancyStartDate: "2023-01-01",
  moveOutDate: "2024-01-01",
  tenancyEndConfirmed: true,
  receivedBankReceipt: "no" as const,
};

function makeDeps(overrides: Partial<FulfillDeps> = {}): FulfillDeps {
  return {
    getOrder: vi.fn().mockResolvedValue({
      id: "order-1",
      email: null,
      answers,
      stripeSessionId: "cs_123",
      status: "pending",
      src: "reddit",
    }),
    claimOrder: vi.fn().mockResolvedValue(true),
    revertOrder: vi.fn().mockResolvedValue(undefined),
    saveEmail: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue({ sent: true }),
    recordPurchase: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("fulfillKitOrder", () => {
  it("fulfills a paid order: claims, emails both PDFs, records purchase", async () => {
    const deps = makeDeps();
    const result = await fulfillKitOrder("order-1", "buyer@example.com", deps);
    expect(result).toBe("fulfilled");
    expect(deps.claimOrder).toHaveBeenCalledWith("order-1");
    expect(deps.saveEmail).toHaveBeenCalledWith("order-1", "buyer@example.com");
    const sendArgs = vi.mocked(deps.sendEmail).mock.calls[0]![0];
    expect(sendArgs.to).toBe("buyer@example.com");
    expect(sendArgs.letterPdf.byteLength).toBeGreaterThan(0);
    expect(sendArgs.kitPdf.byteLength).toBeGreaterThan(0);
    expect(deps.recordPurchase).toHaveBeenCalledWith("reddit");
  });

  it("is idempotent: an already-fulfilled order sends nothing", async () => {
    const deps = makeDeps({ claimOrder: vi.fn().mockResolvedValue(false) });
    const result = await fulfillKitOrder("order-1", "buyer@example.com", deps);
    expect(result).toBe("already_fulfilled");
    expect(deps.sendEmail).not.toHaveBeenCalled();
    expect(deps.recordPurchase).not.toHaveBeenCalled();
  });

  it("reverts the claim and asks for a retry when the email fails", async () => {
    const deps = makeDeps({ sendEmail: vi.fn().mockResolvedValue({ sent: false }) });
    const result = await fulfillKitOrder("order-1", "buyer@example.com", deps);
    expect(result).toBe("retry");
    expect(deps.revertOrder).toHaveBeenCalledWith("order-1");
    expect(deps.recordPurchase).not.toHaveBeenCalled();
  });

  it("returns not_found for unknown orders", async () => {
    const deps = makeDeps({ getOrder: vi.fn().mockResolvedValue(null) });
    const result = await fulfillKitOrder("missing", "buyer@example.com", deps);
    expect(result).toBe("not_found");
  });

  it("returns retry when no email is available to deliver to", async () => {
    const deps = makeDeps();
    const result = await fulfillKitOrder("order-1", null, deps);
    expect(result).toBe("retry");
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });
});
