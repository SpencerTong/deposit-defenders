import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/events", () => ({
  recordEvent: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { recordEvent } from "@/lib/db/events";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** What actually reached recordEvent on the most recent accepted call. */
function recorded() {
  return vi.mocked(recordEvent).mock.calls.at(-1)?.[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/events", () => {
  it("records a plain event with no properties", async () => {
    const res = await POST(request({ name: "landed", src: "gads" }));
    expect(res.status).toBe(200);
    expect(recorded()).toMatchObject({ eventName: "landed", src: "gads", properties: null });
  });

  it("keeps the step fields the drop-off report reads", async () => {
    await POST(request({ name: "question_step", properties: { step: 2, id: "dates" } }));
    expect(recorded()?.properties).toEqual({ step: 2, id: "dates" });
  });

  it("rejects a missing or oversized event name", async () => {
    expect((await POST(request({ name: "" }))).status).toBe(400);
    expect((await POST(request({ name: "x".repeat(65) }))).status).toBe(400);
    expect(recordEvent).not.toHaveBeenCalled();
  });

  // The endpoint is public and unauthenticated, so everything below is
  // attacker-controlled input, not merely malformed client data.
  describe("hostile properties payloads", () => {
    it("drops nested structures rather than storing them", async () => {
      await POST(
        request({ name: "landed", properties: { deep: { a: { b: 1 } }, list: [1, 2], ok: 5 } })
      );
      expect(recorded()?.properties).toEqual({ ok: 5 });
    });

    it("truncates long strings", async () => {
      await POST(request({ name: "landed", properties: { note: "x".repeat(5000) } }));
      const note = recorded()?.properties?.note as string;
      expect(note).toHaveLength(200);
    });

    it("caps the number of keys", async () => {
      const many = Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [`k${i}`, i])
      );
      await POST(request({ name: "landed", properties: many }));
      expect(Object.keys(recorded()?.properties ?? {}).length).toBeLessThanOrEqual(12);
    });

    it("stores null rather than a bloated blob when the payload is too large", async () => {
      const wide = Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [`key${i}`, "y".repeat(200)])
      );
      await POST(request({ name: "landed", properties: wide }));
      expect(recorded()?.properties).toBeNull();
    });

    it("ignores arrays and primitives passed as properties", async () => {
      for (const properties of [[1, 2, 3], "string", 42, null]) {
        await POST(request({ name: "landed", properties }));
        expect(recorded()?.properties).toBeNull();
      }
    });

    it("truncates an oversized src instead of storing it", async () => {
      await POST(request({ name: "landed", src: "s".repeat(500) }));
      expect((recorded()?.src as string).length).toBe(64);
    });
  });
});
