import { ATTRIBUTION_STORAGE_KEY, parseSrcFromSearch, resolveAttributionSrc } from "./attribution";

export type FunnelEventName =
  | "landed"
  | "started"
  | "completed_questions"
  | "viewed_analysis"
  | "submitted_email"
  | "clicked_kit"
  | "purchased";

/** Reads ?src= from the given search string, persists first-touch attribution
 * for the rest of this browser session, and returns the resolved src. */
export function getOrPersistAttributionSrc(search: string): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
  const resolved = resolveAttributionSrc(parseSrcFromSearch(search), stored);
  if (resolved && !stored) {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, resolved);
  }
  return resolved;
}

export function trackEvent(name: FunnelEventName, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const payload = {
    name,
    src: window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY),
    path: window.location.pathname,
    properties: properties ?? {},
  };

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Funnel analytics must never break the user-facing flow.
  });
}
