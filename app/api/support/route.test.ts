import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/email/resend", () => ({
  sendSupportRequest: vi.fn().mockResolvedValue({ sent: true }),
}));

import { POST } from "./route";
import { sendSupportRequest } from "@/lib/email/resend";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/support", () => {
  it("rejects an invalid email", async () => {
    const res = await POST(request({ email: "not-an-email", message: "help" }));
    expect(res.status).toBe(400);
    expect(sendSupportRequest).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const res = await POST(request({ email: "renter@example.com", message: "   " }));
    expect(res.status).toBe(400);
    expect(sendSupportRequest).not.toHaveBeenCalled();
  });

  it("rejects a message over the length cap", async () => {
    const res = await POST(
      request({ email: "renter@example.com", message: "a".repeat(4001) })
    );
    expect(res.status).toBe(400);
    expect(sendSupportRequest).not.toHaveBeenCalled();
  });

  it("relays a valid request and trims the message", async () => {
    const res = await POST(
      request({ email: "renter@example.com", message: "  My letter never arrived.  " })
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; sent: boolean };
    expect(json).toEqual({ ok: true, sent: true });
    expect(sendSupportRequest).toHaveBeenCalledWith({
      fromEmail: "renter@example.com",
      message: "My letter never arrived.",
    });
  });

  it("silently drops a submission when the honeypot field is filled", async () => {
    const res = await POST(
      request({ email: "renter@example.com", message: "hi", company: "Acme" })
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; sent: boolean };
    expect(json).toEqual({ ok: true, sent: false });
    expect(sendSupportRequest).not.toHaveBeenCalled();
  });
});
