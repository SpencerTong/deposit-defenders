import { describe, it, expect } from "vitest";
import { buildResultsEmail } from "./results";

describe("buildResultsEmail", () => {
  it("includes the formatted potential claim and violation count when violations were found", () => {
    const { subject, html } = buildResultsEmail({ maxExposure: 7200, violationCount: 3 });
    expect(subject).toContain("$7,200");
    expect(html).toContain("$7,200");
    expect(html).toContain("3 potential violation");
  });

  it("links to the kit page", () => {
    const { html } = buildResultsEmail({ maxExposure: 7200, violationCount: 3 });
    expect(html).toContain("/kit");
  });

  it("uses non-promising language and includes the disclaimer", () => {
    const { subject, html } = buildResultsEmail({ maxExposure: 7200, violationCount: 3 });
    const combined = (subject + html).toLowerCase();
    expect(combined).not.toContain("guaranteed");
    expect(combined).not.toContain("you will win");
    expect(html).toContain("not legal advice");
  });

  it("handles the no-violation case without claiming money is owed", () => {
    const { subject, html } = buildResultsEmail({ maxExposure: 0, violationCount: 0 });
    expect(subject).not.toContain("$");
    expect(html).toContain("didn't find a clear violation");
    expect(html).toContain("not legal advice");
  });
});
