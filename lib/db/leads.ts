import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export interface Lead {
  email: string;
  src: string | null;
  maxExposure: number;
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
      CREATE TABLE IF NOT EXISTS leads (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        src TEXT,
        max_exposure NUMERIC,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return schemaReady;
}

/**
 * Records a lead. Degrades to a console log (rather than throwing) when
 * DATABASE_URL isn't configured yet, matching lib/db/events.ts.
 */
export async function recordLead(lead: Lead): Promise<void> {
  const client = getSql();
  if (!client) {
    console.log("[leads] DATABASE_URL not configured, logging only:", lead);
    return;
  }

  try {
    await ensureSchema(client);
    await client`
      INSERT INTO leads (email, src, max_exposure)
      VALUES (${lead.email}, ${lead.src}, ${lead.maxExposure})
    `;
  } catch (error) {
    console.error("[leads] failed to record lead", error);
  }
}
