import { getPool } from "./client";

export interface FunnelEvent {
  eventName: string;
  src: string | null;
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
    await pool.query("INSERT INTO events (event_name, src) VALUES ($1, $2)", [
      event.eventName,
      event.src,
    ]);
  } catch (error) {
    console.error("[events] failed to record event", error);
  }
}
