import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "NEXT_PUBLIC_SITE_NAME",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.resetModules();
});

async function loadSite(env: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const k of ENV_KEYS) delete process.env[k];
  Object.assign(process.env, env);
  vi.resetModules();
  return import("./site");
}

describe("SITE_NAME", () => {
  it("falls back to the current brand when unset", async () => {
    const { SITE_NAME } = await loadSite();
    expect(SITE_NAME).toBe("Slatebell");
  });

  it("is overridable by NEXT_PUBLIC_SITE_NAME, so a rename needs no code change", async () => {
    const { SITE_NAME } = await loadSite({ NEXT_PUBLIC_SITE_NAME: "Brasslark" });
    expect(SITE_NAME).toBe("Brasslark");
  });
});

describe("SITE_DOMAIN", () => {
  it("derives the bare hostname from the configured site URL", async () => {
    const { SITE_DOMAIN } = await loadSite({ NEXT_PUBLIC_SITE_URL: "https://slatebell.com" });
    expect(SITE_DOMAIN).toBe("slatebell.com");
  });

  it("derives it without a protocol prefix too", async () => {
    const { SITE_DOMAIN } = await loadSite({ NEXT_PUBLIC_SITE_URL: "slatebell.com" });
    expect(SITE_DOMAIN).toBe("slatebell.com");
  });

  it("is a bare host, with no protocol, port, or trailing path", async () => {
    const { SITE_DOMAIN } = await loadSite({ NEXT_PUBLIC_SITE_URL: "https://slatebell.com/" });
    expect(SITE_DOMAIN).toBe("slatebell.com");
  });

  // Documents the unconfigured case: production sets RESEND_FROM_EMAIL, so this
  // only surfaces locally, where a rejected send beats a silently wrong sender.
  it("resolves to localhost when nothing is configured", async () => {
    const { SITE_DOMAIN } = await loadSite();
    expect(SITE_DOMAIN).toBe("localhost");
  });
});

/**
 * The point of this module is that renaming the product touches env vars, not
 * source. These guards fail if a brand literal creeps back into shipped code.
 * lib/site.ts owns the fallbacks; tests may use literal fixtures.
 */
describe("brand literals are centralized", () => {
  const ROOT = path.resolve(__dirname, "..");
  const SCANNED = ["app", "components", "lib"];
  const SITE_MODULE = path.join("lib", "site.ts");

  function sourceFiles(dir: string): string[] {
    const abs = path.join(ROOT, dir);
    return readdirSync(abs).flatMap((entry) => {
      const rel = path.join(dir, entry);
      if (statSync(path.join(ROOT, rel)).isDirectory()) return sourceFiles(rel);
      if (!/\.(ts|tsx)$/.test(entry) || /\.test\.tsx?$/.test(entry)) return [];
      return [rel];
    });
  }

  const files = SCANNED.flatMap(sourceFiles);
  const containing = (literal: string) =>
    files.filter((f) => readFileSync(path.join(ROOT, f), "utf8").includes(literal));

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("puts the brand name in lib/site.ts and nowhere else", () => {
    expect(containing("Slatebell")).toEqual([SITE_MODULE]);
  });

  // Stricter than the name: the domain is derived from SITE_URL, so even
  // lib/site.ts should not spell it out.
  it("hardcodes the domain nowhere at all", () => {
    expect(containing("slatebell.com")).toEqual([]);
  });

  // Regression guard for the 2026-08-15 rename: the retired brand must not
  // survive anywhere, including in lib/site.ts.
  it.each(["Deposit Defenders", "deposit-defenders"])(
    "has fully retired the old brand: %s",
    (literal) => {
      expect(containing(literal)).toEqual([]);
    }
  );
});
