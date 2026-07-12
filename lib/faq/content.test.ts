import { describe, expect, it } from "vitest";
import { FAQ_ITEMS } from "./content";

describe("FAQ content", () => {
  it("covers the core post-purchase questions", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(6);
    const questions = FAQ_ITEMS.map((i) => i.question.toLowerCase()).join(" ");
    expect(questions).toContain("court");
    expect(questions).toContain("lawyer");
    expect(questions).toContain("ignore");
  });

  it("links the official courthouse locator for the venue question", () => {
    const venue = FAQ_ITEMS.find((i) => i.question.toLowerCase().includes("which court"));
    expect(venue?.linkHref).toContain("mass.gov");
  });

  it("stays hedged, dash-free general information", () => {
    for (const item of FAQ_ITEMS) {
      const text = item.question + item.answer;
      expect(text).not.toContain("—");
      expect(text).not.toContain("–");
      expect(text.toLowerCase()).not.toContain("guaranteed");
      expect(text.toLowerCase()).not.toContain("you will win");
      expect(item.answer.length).toBeGreaterThan(80);
    }
  });
});
