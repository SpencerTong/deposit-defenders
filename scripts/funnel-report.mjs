// Prints the funnel: step counts + step-to-step conversion, overall and per src.
// Read-only. Usage: npm run funnel  (or: node --env-file=.env.local scripts/funnel-report.mjs)

import { Client } from "pg";

const FUNNEL_STEPS = [
  "landed",
  "started",
  "completed_questions",
  "viewed_analysis",
  "submitted_email",
  "clicked_kit",
  "purchased",
];

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!rawConnectionString) {
  console.error("POSTGRES_URL_NON_POOLING is not set in .env.local — nothing to do.");
  process.exit(1);
}

const connectionUrl = new URL(rawConnectionString);
connectionUrl.searchParams.delete("sslmode");

const client = new Client({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: false },
});

function printFunnel(label, countsByStep) {
  console.log(`\n== ${label} ==`);
  let previous = null;
  for (const step of FUNNEL_STEPS) {
    const count = countsByStep.get(step) ?? 0;
    const conversion =
      previous === null || previous === 0
        ? ""
        : ` (${((count / previous) * 100).toFixed(1)}% of prev)`;
    console.log(`${step.padEnd(20)} ${String(count).padStart(6)}${conversion}`);
    previous = count;
  }
}

try {
  await client.connect();

  const totals = await client.query(
    "SELECT event_name, COUNT(*)::int AS n FROM events GROUP BY event_name"
  );
  printFunnel("All traffic", new Map(totals.rows.map((r) => [r.event_name, r.n])));

  const bySrc = await client.query(
    "SELECT COALESCE(src, '(none)') AS src, event_name, COUNT(*)::int AS n FROM events GROUP BY 1, 2 ORDER BY 1"
  );
  const srcs = [...new Set(bySrc.rows.map((r) => r.src))];
  for (const src of srcs) {
    const counts = new Map(
      bySrc.rows.filter((r) => r.src === src).map((r) => [r.event_name, r.n])
    );
    printFunnel(`src=${src}`, counts);
  }

  const revenue = await client.query(
    "SELECT status, COUNT(*)::int AS n FROM kit_orders GROUP BY status"
  );
  console.log("\n== Kit orders ==");
  for (const row of revenue.rows) {
    console.log(`${row.status.padEnd(20)} ${String(row.n).padStart(6)}`);
  }
  const fulfilled = revenue.rows.find((r) => r.status === "fulfilled")?.n ?? 0;
  console.log(`revenue (fulfilled x $49): $${fulfilled * 49}`);
} catch (error) {
  console.error("Report failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
