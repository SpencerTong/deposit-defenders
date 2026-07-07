function normalize(url: string): string {
  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, "");
}

// Prefers an explicitly configured domain, then falls back to Vercel's
// auto-populated production URL, then localhost for local dev. Set
// NEXT_PUBLIC_SITE_URL once a custom domain is connected.
const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = configured ? normalize(configured) : "http://localhost:3000";
