import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mailCertifiedLetter, type MailLetterInput } from "./lob";

function input(): MailLetterInput {
  return {
    description: "Demand letter for order o1",
    to: {
      name: "Pat Owner",
      address: { line1: "99 Oak Ave", city: "Boston", state: "MA", zip: "02110" },
    },
    from: {
      name: "Jordan Renter",
      address: { line1: "12 Elm St", line2: "Apt 2", city: "Somerville", state: "MA", zip: "02143" },
    },
    pdf: Buffer.from("%PDF-1.4 fake"),
  };
}

const originalKey = process.env.LOB_API_KEY;

afterEach(() => {
  process.env.LOB_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

describe("mailCertifiedLetter", () => {
  it("degrades to null without calling Lob when LOB_API_KEY is unset", async () => {
    delete process.env.LOB_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await mailCertifiedLetter(input());
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a certified letter and returns the Lob id and tracking number", async () => {
    process.env.LOB_API_KEY = "test_abc123";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "ltr_123", tracking_number: "9407300000000000000000" }), {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await mailCertifiedLetter(input());
    expect(result).toEqual({ id: "ltr_123", trackingNumber: "9407300000000000000000" });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.lob.com/v1/letters");
    expect(options.method).toBe("POST");
    const auth = (options.headers as Record<string, string>).Authorization;
    expect(auth).toBe(`Basic ${Buffer.from("test_abc123:").toString("base64")}`);

    const form = options.body as FormData;
    expect(form.get("to[name]")).toBe("Pat Owner");
    expect(form.get("to[address_state]")).toBe("MA");
    expect(form.get("from[address_line2]")).toBe("Apt 2");
    expect(form.get("extra_service")).toBe("certified_return_receipt");
    expect(form.get("color")).toBe("false");
    expect(form.get("address_placement")).toBe("insert_blank_page");
    expect(form.get("use_type")).toBe("operational");
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("reports an undeliverable address distinctly so the buyer can fix it", async () => {
    process.env.LOB_API_KEY = "test_abc123";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              message: "The 'to' address does not meet your minimum deliverability strictness.",
              status_code: 422,
              code: "failed_deliverability_strictness",
            },
          }),
          { status: 422 }
        )
      )
    );

    const result = await mailCertifiedLetter(input());
    expect(result).toEqual({ failure: "undeliverable_address" });
  });

  it("returns a provider failure for other Lob rejections", async () => {
    process.env.LOB_API_KEY = "test_abc123";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "internal" } }), { status: 500 })
      )
    );

    const result = await mailCertifiedLetter(input());
    expect(result).toEqual({ failure: "provider_error" });
  });
});
