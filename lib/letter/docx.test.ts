import { describe, expect, it } from "vitest";
import { renderDemandLetterDocx } from "./docx";
import type { DemandLetterContent } from "./template";

const letter: DemandLetterContent = {
  date: "July 11, 2026",
  tenantName: "Jordan Renter",
  tenantAddress: "12 Elm St\nSomerville, MA 02143",
  landlordName: "Pat Owner",
  landlordAddress: "99 Oak Ave\nBoston, MA 02110",
  propertyAddress: "45 Maple St, Somerville, MA",
  subject: "Re: Demand under M.G.L. c. 93A and c. 186, §15B for 45 Maple St",
  salutation: "Dear Pat Owner,",
  paragraphs: ["First paragraph.", "Second paragraph."],
  closing: "Sincerely,",
  signatureName: "Jordan Renter",
  disclaimer: "This is general legal information, not legal advice.",
};

describe("renderDemandLetterDocx", () => {
  it("produces a valid non-trivial .docx (zip) buffer", async () => {
    const buffer = await renderDemandLetterDocx(letter);
    expect(buffer.length).toBeGreaterThan(2000);
    // .docx files are zip archives: PK magic bytes
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
