// One-off: inserts a single test row into leads and events so you can
// confirm the tables in the Supabase Table Editor. Safe to run more than
// once (just adds more test rows); delete them from the Table Editor
// whenever you're done confirming.
//
// Usage: node --env-file=.env.local scripts/seed-test-rows.mjs

import { Client } from "pg";

const rawConnectionString = process.env.POSTGRES_URL;

if (!rawConnectionString) {
  console.error("POSTGRES_URL is not set in .env.local, nothing to do.");
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

  const lead = await client.query(
    `INSERT INTO leads (email, deposit_amount, rules_fired, src)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ["test@example.com", 1500, ["R1_DEPOSIT_EXCEEDS_ONE_MONTH", "R2_NO_ESCROW_RECEIPT"], "manual_test"]
  );
  console.log("Inserted test lead, id:", lead.rows[0].id);

  const event = await client.query(
    `INSERT INTO events (event_name, src) VALUES ($1, $2) RETURNING id`,
    ["test_event", "manual_test"]
  );
  console.log("Inserted test event, id:", event.rows[0].id);
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
