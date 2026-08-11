// Prints the funnel: step counts + step-to-step conversion, overall and per src.
// Read-only. Usage: npm run funnel  (or: node --env-file=.env.local scripts/funnel-report.mjs)
//
//   npm run funnel                          all real traffic, all time
//   npm run funnel -- --days 7              last 7 days
//   npm run funnel -- --since 2026-07-27    from a date (inclusive)
//   npm run funnel -- --until 2026-07-31    to a date (exclusive)
//   npm run funnel -- --split 2026-07-31    two reports, before vs on/after that date
//   npm run funnel -- --include-tests       stop hiding our own test traffic
//
// Dates are calendar days in America/New_York, since that is where the
// customers and the statutory deadlines are.

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

/**
 * Traffic we generated ourselves. Excluded by default: with real customers in
 * single digits, our own smoke tests otherwise dominate every rate in the
 * report and make the funnel look far healthier than it is.
 */
const TEST_SRCS = [
  "test",
  "mytest",
  "manual_test",
  "verify",
  "plumbing-test",
  "prod-smoke",
  "live-smoke",
  "e2e-test",
  "mobile-audit",
];

const TZ = "America/New_York";
const KIT_PRICE = 49;

function parseArgs(argv) {
  const opts = { includeTests: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const readValue = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        console.error(`${arg} needs a value.`);
        process.exit(1);
      }
      i++;
      return value;
    };
    if (arg === "--include-tests") opts.includeTests = true;
    else if (arg === "--since") opts.since = readValue();
    else if (arg === "--until") opts.until = readValue();
    else if (arg === "--split") opts.split = readValue();
    else if (arg === "--days") opts.days = Number(readValue());
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }
  if (opts.days !== undefined && !Number.isFinite(opts.days)) {
    console.error("--days needs a number.");
    process.exit(1);
  }
  for (const key of ["since", "until", "split"]) {
    if (opts[key] && !/^\d{4}-\d{2}-\d{2}$/.test(opts[key])) {
      console.error(`--${key} must look like YYYY-MM-DD.`);
      process.exit(1);
    }
  }
  return opts;
}

/**
 * Builds the shared WHERE clause. `since` is inclusive, `until` exclusive, both
 * anchored to midnight in TZ so a "day" means the same thing here as it does on
 * a calendar.
 */
function buildFilter({ since, until, days, includeTests }, startIndex = 1) {
  const clauses = [];
  const params = [];
  let n = startIndex;

  if (days !== undefined) {
    // Parenthesised because AT TIME ZONE binds tighter than the date subtraction.
    clauses.push(
      `created_at >= (((now() AT TIME ZONE '${TZ}')::date - ($${n}::int - 1)) AT TIME ZONE '${TZ}')`
    );
    params.push(days);
    n++;
  }
  if (since) {
    clauses.push(`created_at >= ($${n}::date AT TIME ZONE '${TZ}')`);
    params.push(since);
    n++;
  }
  if (until) {
    clauses.push(`created_at < ($${n}::date AT TIME ZONE '${TZ}')`);
    params.push(until);
    n++;
  }
  if (!includeTests) {
    clauses.push(`COALESCE(src, '') <> ALL($${n}::text[])`);
    params.push(TEST_SRCS);
    n++;
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params, nextIndex: n };
}

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

function describeWindow(opts) {
  const parts = [];
  if (opts.days !== undefined) parts.push(`last ${opts.days} day(s)`);
  if (opts.since) parts.push(`since ${opts.since}`);
  if (opts.until) parts.push(`before ${opts.until}`);
  if (parts.length === 0) parts.push("all time");
  parts.push(opts.includeTests ? "including test traffic" : "real traffic only");
  return parts.join(", ");
}

async function report(client, opts) {
  console.log(`\n${"=".repeat(60)}\nWindow: ${describeWindow(opts)}\n${"=".repeat(60)}`);

  const filter = buildFilter(opts);

  const totals = await client.query(
    `SELECT event_name, COUNT(*)::int AS n FROM events ${filter.where} GROUP BY event_name`,
    filter.params
  );
  printFunnel("All traffic", new Map(totals.rows.map((r) => [r.event_name, r.n])));

  const bySrc = await client.query(
    `SELECT COALESCE(src, '(none)') AS src, event_name, COUNT(*)::int AS n
     FROM events ${filter.where} GROUP BY 1, 2 ORDER BY 1`,
    filter.params
  );
  for (const src of [...new Set(bySrc.rows.map((r) => r.src))]) {
    printFunnel(
      `src=${src}`,
      new Map(bySrc.rows.filter((r) => r.src === src).map((r) => [r.event_name, r.n]))
    );
  }

  const orderFilter = buildFilter(opts);
  const orders = await client.query(
    `SELECT status, COUNT(*)::int AS n FROM kit_orders ${orderFilter.where} GROUP BY status`,
    orderFilter.params
  );
  console.log("\n== Kit orders ==");
  if (orders.rows.length === 0) console.log("(none)");
  for (const row of orders.rows) {
    console.log(`${row.status.padEnd(20)} ${String(row.n).padStart(6)}`);
  }
  const fulfilled = orders.rows.find((r) => r.status === "fulfilled")?.n ?? 0;
  console.log(`revenue (fulfilled x $${KIT_PRICE}): $${fulfilled * KIT_PRICE}`);
  if (!opts.includeTests) {
    console.log("(test traffic excluded; pass --include-tests to see it)");
  }
}

const opts = parseArgs(process.argv.slice(2));

if (opts.help) {
  console.log(
    [
      "Usage: npm run funnel -- [options]",
      "",
      "  --days N            only the last N days",
      "  --since YYYY-MM-DD  from this date (inclusive)",
      "  --until YYYY-MM-DD  up to this date (exclusive)",
      "  --split YYYY-MM-DD  two reports: before, and on/after this date",
      "  --include-tests     include our own test traffic",
      "",
      `Test sources hidden by default: ${TEST_SRCS.join(", ")}`,
    ].join("\n")
  );
  process.exit(0);
}

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!rawConnectionString) {
  console.error("POSTGRES_URL_NON_POOLING is not set in .env.local, nothing to do.");
  process.exit(1);
}

const connectionUrl = new URL(rawConnectionString);
connectionUrl.searchParams.delete("sslmode");

const client = new Client({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  if (opts.split) {
    // The point of --split is answering "did the change I shipped that day do
    // anything", so the two windows must be otherwise identical.
    await report(client, { ...opts, split: undefined, until: opts.split });
    await report(client, { ...opts, split: undefined, since: opts.split });
    console.log(
      `\nBoth windows above are the same report, before and on/after ${opts.split}.` +
        "\nCompare started/landed first: that is where paid traffic leaks worst."
    );
  } else {
    await report(client, opts);
  }
} catch (error) {
  console.error("Report failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
