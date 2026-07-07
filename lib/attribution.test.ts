import { describe, it, expect } from "vitest";
import { parseSrcFromSearch, resolveAttributionSrc } from "./attribution";

describe("parseSrcFromSearch", () => {
  it("extracts src from a query string", () => {
    expect(parseSrcFromSearch("?src=reddit")).toBe("reddit");
  });

  it("extracts src when other params are present", () => {
    expect(parseSrcFromSearch("?utm_campaign=x&src=tiktok&foo=bar")).toBe("tiktok");
  });

  it("returns null when there is no src param", () => {
    expect(parseSrcFromSearch("?utm_campaign=x")).toBeNull();
  });

  it("returns null for an empty src value", () => {
    expect(parseSrcFromSearch("?src=")).toBeNull();
  });

  it("returns null for an empty search string", () => {
    expect(parseSrcFromSearch("")).toBeNull();
  });
});

describe("resolveAttributionSrc", () => {
  it("keeps the previously stored src (first-touch attribution)", () => {
    expect(resolveAttributionSrc("tiktok", "reddit")).toBe("reddit");
  });

  it("uses the URL src when nothing is stored yet", () => {
    expect(resolveAttributionSrc("reddit", null)).toBe("reddit");
  });

  it("is organic (null) when neither is present", () => {
    expect(resolveAttributionSrc(null, null)).toBeNull();
  });
});
