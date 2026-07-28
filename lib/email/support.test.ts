import { describe, expect, it } from "vitest";
import { buildSupportRequestEmail } from "./support";

describe("buildSupportRequestEmail", () => {
  it("includes the customer's email and message", () => {
    const content = buildSupportRequestEmail({
      fromEmail: "tenant@example.com",
      message: "My tracking number never showed up in the workspace.",
    });
    expect(content.subject).toContain("tenant@example.com");
    expect(content.html).toContain("tenant@example.com");
    expect(content.html).toContain("My tracking number never showed up in the workspace.");
  });

  it("escapes HTML in the message so a customer can't inject markup", () => {
    const content = buildSupportRequestEmail({
      fromEmail: "tenant@example.com",
      message: "<script>alert(1)</script>",
    });
    expect(content.html).not.toContain("<script>");
    expect(content.html).toContain("&lt;script&gt;");
  });
});
