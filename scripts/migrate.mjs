// Creates/updates the leads and events tables. Idempotent, safe to rerun.
// Uses POSTGRES_URL_NON_POOLING (direct connection) since DDL over a
// transaction-mode pooler (Supavisor) can be unreliable.
//
// Usage: node --env-file=.env.local scripts/migrate.mjs

import { Client } from "pg";

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING;

if (!rawConnectionString) {
  console.error("POSTGRES_URL_NON_POOLING is not set in .env.local, nothing to do.");
  process.exit(1);
}

// Strip ?sslmode=require: newer pg-connection-string treats it as verify-full
// and overrides the explicit ssl option below with strict cert-chain checks.
const connectionUrl = new URL(rawConnectionString);
connectionUrl.searchParams.delete("sslmode");

const client = new Client({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected via POSTGRES_URL_NON_POOLING.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deposit_amount NUMERIC,
      rules_fired TEXT[],
      src TEXT
    )
  `);
  console.log("leads table ready.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      src TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  console.log("events table ready.");

  // Additive and nullable, so existing rows and the running deploy are
  // unaffected. Until 2026-08-12 the client sent `properties` on every event
  // and both the API route and this table discarded them, which is why no
  // analysis-size or per-step data exists for anything before that date.
  await client.query(`
    ALTER TABLE events
      ADD COLUMN IF NOT EXISTS properties JSONB
  `);
  console.log("events properties column ready.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS kit_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT,
      answers JSONB NOT NULL,
      stripe_session_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      src TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      fulfilled_at TIMESTAMPTZ
    )
  `);
  console.log("kit_orders table ready.");

  await client.query(`
    ALTER TABLE kit_orders
      ADD COLUMN IF NOT EXISTS letter_details JSONB,
      ADD COLUMN IF NOT EXISTS mail_status TEXT NOT NULL DEFAULT 'unsent',
      ADD COLUMN IF NOT EXISTS lob_id TEXT,
      ADD COLUMN IF NOT EXISTS mail_tracking TEXT,
      ADD COLUMN IF NOT EXISTS mailed_at TIMESTAMPTZ
  `);
  console.log("kit_orders mailing columns ready.");

  await client.query(`
    ALTER TABLE kit_orders
      ADD COLUMN IF NOT EXISTS answers_history JSONB NOT NULL DEFAULT '[]'::jsonb
  `);
  console.log("kit_orders answers_history column ready.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
