import { getPool } from "./client";

export interface FunnelEvent {
  eventName: string;
  src: string | null;
  /** Small JSON blob, already size-checked by the API route. */
  properties?: Record<string, unknown> | null;
}

/**
 * Records a funnel event. Degrades to a console log (rather than throwing)
 * when POSTGRES_URL isn't configured yet, so local dev and early deploys
 * work before the database connection is set up.
 */
export async function recordEvent(event: FunnelEvent): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.log("[events] POSTGRES_URL not configured, logging only:", event);
    return;
  }

  try {
    const properties = event.properties;
    const hasProperties = properties != null && Object.keys(properties).length > 0;
    await pool.query(
      "INSERT INTO events (event_name, src, properties) VALUES ($1, $2, $3)",
      [event.eventName, event.src, hasProperties ? JSON.stringify(properties) : null]
    );
  } catch (error) {
    console.error("[events] failed to record event", error);
  }
}
