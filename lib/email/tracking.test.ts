import { describe, expect, it } from "vitest";
import { buildTrackingEmail } from "./tracking";

describe("buildTrackingEmail", () => {
  it("includes the tracking number, a USPS link, and the recipient", () => {
    const { subject, html } = buildTrackingEmail({
      landlordName: "Pat Owner",
      trackingNumber: "9407311899560000000000",
      workspaceUrl: "https://deposit-defenders.com/kit/success?session_id=cs_123",
    });
    expect(subject.toLowerCase()).toContain("in the mail");
    expect(html).toContain("9407311899560000000000");
    expect(html).toContain("tools.usps.com");
    expect(html).toContain("Pat Owner");
    expect(html).toContain("https://deposit-defenders.com/kit/success?session_id=cs_123");
  });

  it("still reads sensibly when the tracking number is not available yet", () => {
    const { html } = buildTrackingEmail({
      landlordName: "Pat Owner",
      trackingNumber: null,
      workspaceUrl: "https://deposit-defenders.com/kit/success?session_id=cs_123",
    });
    expect(html).toContain("workspace");
    expect(html).not.toContain("tools.usps.com");
  });

  it("stays hedged, dash-free, and carries the disclaimer", () => {
    const { subject, html } = buildTrackingEmail({
      landlordName: "Pat Owner",
      trackingNumber: "9407311899560000000000",
      workspaceUrl: "https://deposit-defenders.com/kit/success?session_id=cs_123",
    });
    const text = subject + html;
    expect(text).not.toContain("—");
    expect(text.toLowerCase()).not.toContain("guaranteed");
    expect(html).toContain("not legal advice");
  });
});
