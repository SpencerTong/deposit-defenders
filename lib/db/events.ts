import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export interface FunnelEvent {
  name: string;
  src: string | null;
  path: string | null;
  properties: Record<string, unknown>;
}

let sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> | null {
  if (!process.env.DATABASE_URL) return null;
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

let schemaReady: Promise<unknown> | null = null;

function ensureSchema(client: NeonQueryFunction<false, false>): Promise<unknown> {
  if (!schemaReady) {
    schemaReady = client`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        src TEXT,
        path TEXT,
        properties JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return schemaReady;
}

/**
 * Records a funnel event. Degrades to a console log (rather than throwing)
 * when DATABASE_URL isn't configured yet, so local dev and early deploys
 * work before a Neon database is provisioned via the Vercel Marketplace.
 */
export async function recordEvent(event: FunnelEvent): Promise<void> {
  const client = getSql();
  if (!client) {
    console.log("[events] DATABASE_URL not configured, logging only:", event);
    return;
  }

  try {
    await ensureSchema(client);
    await client`
      INSERT INTO events (name, src, path, properties)
      VALUES (${event.name}, ${event.src}, ${event.path}, ${JSON.stringify(event.properties)}::jsonb)
    `;
  } catch (error) {
    console.error("[events] failed to record event", error);
  }
}
