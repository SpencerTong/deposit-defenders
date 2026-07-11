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
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
