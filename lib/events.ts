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

const FIRED_EVENT_PREFIX = "dd_funnel_fired:";

/**
 * Fires a funnel event at most once per browser session.
 *
 * A funnel counts how many visitors reached a stage, so a refresh, a
 * back-navigation, or a second look at the same page must not read as another
 * visitor. Without this, `landed` overcounted badly: the July 2026 paid test
 * logged 77 `landed` events against 44 clicks Google actually billed for, about
 * 1.75x, which made every downstream conversion rate look worse than it was.
 *
 * Note for anyone comparing history: rates measured before 2026-07-31 are not
 * directly comparable to rates measured after it.
 */
export function trackEventOnce(
  name: FunnelEventName,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const key = `${FIRED_EVENT_PREFIX}${name}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or blocked storage: fall through and send. Over-counting is
    // better than losing the event entirely.
  }
  trackEvent(name, properties);
}

export function trackEvent(name: FunnelEventName, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  // Storage access throws in some private-browsing and blocked-cookie modes.
  // An unattributed event still beats an exception thrown inside a React effect.
  let src: string | null = null;
  try {
    src = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    src = null;
  }

  const payload = {
    name,
    src,
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
