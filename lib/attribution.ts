export const ATTRIBUTION_STORAGE_KEY = "dd_src";

export function parseSrcFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const src = params.get("src");
  if (!src) return null;
  const trimmed = src.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** First-touch attribution: once a src is stored for this session, it wins. */
export function resolveAttributionSrc(
  searchSrc: string | null,
  storedSrc: string | null
): string | null {
  return storedSrc ?? searchSrc;
}
