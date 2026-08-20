import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/events", () => ({
  recordEvent: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { recordEvent } from "@/lib/db/events";

/** A browser-shaped request. The user-agent matters now that crawler traffic is
 *  tagged rather than counted as visitors, so the default is a real one. */
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

function request(body: unknown, userAgent: string = IPHONE_UA): NextRequest {
  return new NextRequest("http://localhost/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": userAgent },
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

  /**
   * Crawlers that render JavaScript fire `landed` exactly like a person does.
   * They are recorded under a reserved `src` instead of being dropped, so the
   * volume stays auditable and the funnel report can hide them with the same
   * mechanism that already hides our own smoke tests.
   */
  describe("crawler traffic", () => {
    const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    it("tags a crawler's event with the bot src", async () => {
      const res = await POST(request({ name: "landed" }, GOOGLEBOT));
      expect(res.status).toBe(200);
      expect(recorded()).toMatchObject({ eventName: "landed", src: "bot" });
    });

    it("overrides any src the crawler carried, so bots cannot pollute a campaign", async () => {
      await POST(request({ name: "landed", src: "gads" }, GOOGLEBOT));
      expect(recorded()?.src).toBe("bot");
    });

    it("tags a request that sends no user-agent at all", async () => {
      await POST(request({ name: "landed", src: "gads" }, ""));
      expect(recorded()?.src).toBe("bot");
    });

    it("leaves a real visitor's attribution untouched", async () => {
      await POST(request({ name: "landed", src: "gads" }));
      expect(recorded()?.src).toBe("gads");
    });

    it("still records an unattributed human as unattributed, not as a bot", async () => {
      await POST(request({ name: "landed" }));
      expect(recorded()?.src).toBeNull();
    });
  });
});
