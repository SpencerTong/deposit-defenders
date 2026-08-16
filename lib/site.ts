function normalize(url: string): string {
  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, "");
}

// Prefers an explicitly configured domain, then falls back to Vercel's
// auto-populated production URL, then localhost for local dev. Set
// NEXT_PUBLIC_SITE_URL once a custom domain is connected.
const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = configured ? normalize(configured) : "http://localhost:3000";

// The brand name lives here and nowhere else, so renaming the product is an
// env-var change rather than a source change. lib/site.test.ts fails if a
// brand literal reappears anywhere under app/, components/, or lib/.
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Slatebell";

// Bare hostname, derived rather than written down so that no source file
// carries the domain. It backs the default transactional From address, which
// in production is overridden by RESEND_FROM_EMAIL anyway; locally it resolves
// to "localhost" and Resend rejects it, which is the correct loud failure for
// an unconfigured sending domain.
export const SITE_DOMAIN = new URL(SITE_URL).hostname;
