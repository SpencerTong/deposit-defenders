# MA Revenue Build-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the validation MVP into a revenue machine: automated $49 Dispute Kit fulfillment via Stripe webhook + Resend email, personalized kit PDF generation, 6 new SEO articles with schema markup, and a local funnel-report script.

**Architecture:** Buyer's flow answers are snapshotted into a `kit_orders` Postgres row before Stripe Checkout; a signed Stripe webhook (`checkout.session.completed`) generates two PDFs (demand letter + kit) from the snapshot and emails them, marking the order fulfilled idempotently. All kit legal content is pure functions in `lib/kit/*`, mirroring the existing `lib/letter/*` pattern. SEO growth = 6 new `guideArticles` entries + `/guide` index + JSON-LD.

**Tech Stack:** Next.js 14 App Router, TypeScript, `pg`, Stripe SDK v22, Resend, @react-pdf/renderer, Vitest, Tailwind.

## Global Constraints

- Legal-safety copy rules (CLAUDE.md, non-negotiable): never promise outcomes; use "may", "can expose the landlord to", "commonly contestable". Wear-and-tear flags are labeled informational. Every PDF and page carries the disclaimer: "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney."
- Do not build: auth/accounts, multi-state, email drip sequences, admin panels, photo upload.
- All legal logic stays in `lib/statute/ma.ts` — kit/letter/articles consume its output, never re-derive rules.
- Graceful degradation pattern: integrations (`pg`, Stripe, Resend) return null / log to console when their env var is missing, instead of throwing. Exception (deliberate): kit checkout returns HTTP 503 when the order row can't be created, because taking payment without a stored answers snapshot means an unfulfillable order.
- Legal facts verified 2026-07-08 against malegislature.gov (M.G.L. c. 186 §15B) and mass.gov: treble damages attach only to §15B(6)(a), (d), (e) via §15B(7); 30-day bank-receipt and itemization deadlines; 10-day statement of condition; 5%/yr or actual bank interest; small-claims limit $7,000 (statutory treble damages may exceed it when actual damages ≤ $7,000); filing fees $40 (≤$500), $50 ($500.01–$2,000), $100 ($2,000.01–$5,000), $150 ($5,000.01–$7,000), ~$7 eFiling surcharge. Hedge all fee copy with "confirm the current fee when you file."
- Tests: Vitest, colocated as `*.test.ts` next to source. Run with `npm test` (all) or `npx vitest run <path>` (single file). Type-check with `npm run type-check`.
- Commit after every task. Never commit `.env.local`.

---

### Task 1: Commit the in-flight `pg` refactor

The working tree already contains a finished refactor from `@vercel/postgres` to raw `pg` (`lib/db/client.ts`, `lib/db/leads.ts`, `lib/db/events.ts`, `scripts/migrate.mjs`, `scripts/seed-test-rows.mjs`, package.json). This task verifies and commits it — no new code.

**Files:**
- Modify: none (commit existing working-tree state)

**Interfaces:**
- Produces: `getPool(): Pool | null` from `lib/db/client.ts` — lazy shared pool over `POSTGRES_URL`, null when unconfigured. Later tasks import this.

- [ ] **Step 1: Run the existing test suite**

Run: `npm test`
Expected: all tests pass (statute, letter, flow, attribution suites).

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: exits 0, no errors.

- [ ] **Step 3: Verify no `@vercel/postgres` references remain**

Run: `grep -rn "@vercel/postgres" app lib scripts package.json || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add .gitignore app/api lib/db package.json package-lock.json scripts
git commit -m "refactor: replace @vercel/postgres with pg pool + migration scripts"
```

---

### Task 2: `kit_orders` table + data module

**Files:**
- Modify: `scripts/migrate.mjs` (append table)
- Create: `lib/db/kitOrders.ts`

**Interfaces:**
- Consumes: `getPool()` from `lib/db/client.ts`.
- Produces (used by Tasks 3, 6, 7):
  - `createKitOrder(input: { answers: unknown; src: string | null }): Promise<{ id: string } | null>` — null when DB unconfigured.
  - `setKitOrderSession(id: string, stripeSessionId: string): Promise<void>`
  - `getKitOrderBySessionId(stripeSessionId: string): Promise<KitOrder | null>`
  - `getKitOrderById(id: string): Promise<KitOrder | null>`
  - `claimKitOrderForFulfillment(id: string): Promise<boolean>` — atomically flips status to `fulfilled` iff not already; false means already fulfilled (skip).
  - `revertKitOrderToPaid(id: string): Promise<void>` — undo a claim when delivery fails so a Stripe retry can refulfill.
  - `setKitOrderEmail(id: string, email: string): Promise<void>`
  - `interface KitOrder { id: string; email: string | null; answers: unknown; stripeSessionId: string | null; status: "pending" | "paid" | "fulfilled"; src: string | null; }`

- [ ] **Step 1: Add the table to the migration script**

In `scripts/migrate.mjs`, after the `events` table block (before the `} catch`), add:

```js
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
```

- [ ] **Step 2: Run the migration**

Run: `npm run db:migrate`
Expected output includes: `kit_orders table ready.`

- [ ] **Step 3: Create `lib/db/kitOrders.ts`**

```ts
import { getPool } from "./client";

export type KitOrderStatus = "pending" | "paid" | "fulfilled";

export interface KitOrder {
  id: string;
  email: string | null;
  answers: unknown;
  stripeSessionId: string | null;
  status: KitOrderStatus;
  src: string | null;
}

interface KitOrderRow {
  id: string;
  email: string | null;
  answers: unknown;
  stripe_session_id: string | null;
  status: KitOrderStatus;
  src: string | null;
}

function toKitOrder(row: KitOrderRow): KitOrder {
  return {
    id: row.id,
    email: row.email,
    answers: row.answers,
    stripeSessionId: row.stripe_session_id,
    status: row.status,
    src: row.src,
  };
}

/**
 * Creates a pending kit order holding the buyer's answers snapshot. Unlike the
 * other db modules this returns null (rather than degrading to a console log)
 * when the database is unconfigured: taking a payment without a stored
 * snapshot would create an order we can never fulfill, so the caller must
 * refuse checkout instead.
 */
export async function createKitOrder(input: {
  answers: unknown;
  src: string | null;
}): Promise<{ id: string } | null> {
  const pool = getPool();
  if (!pool) {
    console.log("[kit_orders] POSTGRES_URL not configured, cannot create order");
    return null;
  }
  try {
    const result = await pool.query<{ id: string }>(
      "INSERT INTO kit_orders (answers, src) VALUES ($1, $2) RETURNING id",
      [JSON.stringify(input.answers), input.src]
    );
    return { id: result.rows[0].id };
  } catch (error) {
    console.error("[kit_orders] failed to create order", error);
    return null;
  }
}

export async function setKitOrderSession(id: string, stripeSessionId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET stripe_session_id = $2 WHERE id = $1", [
    id,
    stripeSessionId,
  ]);
}

export async function setKitOrderEmail(id: string, email: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET email = $2 WHERE id = $1", [id, email]);
}

export async function getKitOrderById(id: string): Promise<KitOrder | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<KitOrderRow>(
    "SELECT id, email, answers, stripe_session_id, status, src FROM kit_orders WHERE id = $1",
    [id]
  );
  return result.rows[0] ? toKitOrder(result.rows[0]) : null;
}

export async function getKitOrderBySessionId(stripeSessionId: string): Promise<KitOrder | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<KitOrderRow>(
    "SELECT id, email, answers, stripe_session_id, status, src FROM kit_orders WHERE stripe_session_id = $1",
    [stripeSessionId]
  );
  return result.rows[0] ? toKitOrder(result.rows[0]) : null;
}

/**
 * Atomically claims an order for fulfillment. Returns false when the order is
 * already fulfilled (or doesn't exist), which makes webhook retries and
 * concurrent deliveries idempotent: only one caller ever gets `true`.
 */
export async function claimKitOrderForFulfillment(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const result = await pool.query(
    "UPDATE kit_orders SET status = 'fulfilled', fulfilled_at = now() WHERE id = $1 AND status <> 'fulfilled' RETURNING id",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Undoes a fulfillment claim after a failed delivery so Stripe's retry can refulfill. */
export async function revertKitOrderToPaid(id: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    "UPDATE kit_orders SET status = 'paid', fulfilled_at = NULL WHERE id = $1",
    [id]
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate.mjs lib/db/kitOrders.ts
git commit -m "feat: kit_orders table and data module for kit fulfillment"
```

Note: no unit tests for this module — matching the repo convention that db modules (`leads.ts`, `events.ts`) are untested thin wrappers; pure logic is tested elsewhere.

---

### Task 3: Checkout creates a kit order and carries it through Stripe

**Files:**
- Modify: `lib/payments/stripe.ts` (metadata + email fields on session)
- Modify: `app/api/checkout/route.ts` (accept answers, create order)
- Modify: `components/kit/BuyKitButton.tsx` (send answers; route to flow when missing)

**Interfaces:**
- Consumes: `createKitOrder`, `setKitOrderSession` (Task 2); `FLOW_ANSWERS_STORAGE_KEY` from `lib/flow/storage.ts` (value `"dd_answers"`, stored in `window.sessionStorage`).
- Produces: Stripe Checkout sessions with `metadata.kit_order_id` (Task 6 reads this). `POST /api/checkout` body becomes `{ src: string | null, answers: FlowAnswers }`.

- [ ] **Step 1: Extend `createCheckoutSession` in `lib/payments/stripe.ts`**

Replace `CreateCheckoutSessionInput` and the metadata line:

```ts
export interface CreateCheckoutSessionInput {
  src: string | null;
  kitOrderId: string;
  successUrl: string;
  cancelUrl: string;
}
```

and inside `stripe.checkout.sessions.create`, replace the `metadata` line with:

```ts
    metadata: {
      kit_order_id: input.kitOrderId,
      ...(input.src ? { src: input.src } : {}),
    },
```

Also change the return of `createCheckoutSession` to include the session id (Task 3 Step 2 stores it):

```ts
  if (!session.url) return null;
  return { url: session.url, sessionId: session.id };
```

and its return type to `Promise<{ url: string; sessionId: string } | null>`.

- [ ] **Step 2: Rewrite `app/api/checkout/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { createKitOrder, setKitOrderSession } from "@/lib/db/kitOrders";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { src, answers } = (body ?? {}) as { src?: unknown; answers?: unknown };

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });
  }

  const order = await createKitOrder({
    answers,
    src: typeof src === "string" ? src : null,
  });
  if (!order) {
    // No stored snapshot means an unfulfillable order — refuse payment.
    return NextResponse.json({ ok: false, error: "kit_unavailable" }, { status: 503 });
  }

  const origin = new URL(req.url).origin;
  const session = await createCheckoutSession({
    src: typeof src === "string" ? src : null,
    kitOrderId: order.id,
    successUrl: `${origin}/kit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/kit`,
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  await setKitOrderSession(order.id, session.sessionId);

  return NextResponse.json({ ok: true, url: session.url });
}
```

- [ ] **Step 3: Update `components/kit/BuyKitButton.tsx`**

Replace the whole component:

```tsx
"use client";

import { useState } from "react";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import { trackEvent } from "@/lib/events";

type Status = "idle" | "submitting" | "needs_answers" | "error";

export function BuyKitButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    trackEvent("clicked_kit");

    const rawAnswers = window.sessionStorage.getItem(FLOW_ANSWERS_STORAGE_KEY);
    if (!rawAnswers) {
      // The kit is personalized from the free flow's answers; route there first.
      setStatus("needs_answers");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 2500);
      return;
    }

    setStatus("submitting");
    const src = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src, answers: JSON.parse(rawAnswers) }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string };
      if (!data.ok || !data.url) throw new Error("checkout unavailable");
      window.location.href = data.url;
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "submitting"}
        className={
          className ??
          "w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:px-10"
        }
      >
        {status === "submitting" ? "Redirecting to checkout…" : "Get the Dispute Kit — $49"}
      </button>
      {status === "needs_answers" && (
        <p className="mt-2 text-sm text-gray-600">
          Your kit is personalized from the free deposit check — answer those questions first.
          Taking you there now…
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">
          Checkout isn&apos;t available right now. Please try again shortly.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add lib/payments/stripe.ts app/api/checkout/route.ts components/kit/BuyKitButton.tsx
git commit -m "feat: checkout snapshots answers into a kit order before Stripe"
```

---

### Task 4: Kit content assembly (pure, tested)

**Files:**
- Create: `lib/kit/court-data.ts`
- Create: `lib/kit/content.ts`
- Test: `lib/kit/content.test.ts`

**Interfaces:**
- Consumes: `TenancyInputs`, `AnalysisResult` from `lib/statute/ma.ts`.
- Produces (used by Task 5's PDF renderer):
  - `interface KitSection { heading: string; paragraphs: string[]; list?: string[]; }`
  - `interface KitContent { title: string; generatedDate: string; demandAmount: string; responseDeadlineDate: string; trebleApplies: boolean; sections: KitSection[]; disclaimer: string; }`
  - `buildKitContent(tenancy: TenancyInputs, analysis: AnalysisResult, today?: Date): KitContent`
  - From court-data: `SMALL_CLAIMS_LIMIT = 7000`, `filingFeeForClaim(amount: number): number`, `EFILING_SURCHARGE = 7`
  - `addBusinessDays(start: Date, days: number): Date` (exported from content.ts for testing)

- [ ] **Step 1: Create `lib/kit/court-data.ts`**

```ts
/**
 * Massachusetts small-claims facts used in the Dispute Kit.
 * Verified 2026-07-08 against:
 * - https://www.mass.gov/info-details/small-claims-court
 * - https://www.mass.gov/how-to/file-a-small-claim-in-the-boston-municipal-court-district-court-or-housing-court
 * Fees are set by the courts (M.G.L. c. 218 §22) and can change; all kit copy
 * that mentions a fee must tell the reader to confirm the current amount.
 */

/** Small claims handle claims of $7,000 or less. Statutory multiple damages
 * (like §15B(7) treble damages) may exceed this when actual damages are within
 * the limit. */
export const SMALL_CLAIMS_LIMIT = 7000;

/** Optional surcharge when filing through the courts' online eFiling tool. */
export const EFILING_SURCHARGE = 7;

interface FilingFeeTier {
  maxClaim: number;
  fee: number;
}

const FILING_FEE_TIERS: FilingFeeTier[] = [
  { maxClaim: 500, fee: 40 },
  { maxClaim: 2000, fee: 50 },
  { maxClaim: 5000, fee: 100 },
  { maxClaim: 7000, fee: 150 },
];

/** Filing fee for a claim amount; amounts above the small-claims limit use the
 * top tier (the claim itself would be capped at actual damages ≤ $7,000). */
export function filingFeeForClaim(amount: number): number {
  for (const tier of FILING_FEE_TIERS) {
    if (amount <= tier.maxClaim) return tier.fee;
  }
  return FILING_FEE_TIERS[FILING_FEE_TIERS.length - 1].fee;
}
```

- [ ] **Step 2: Write the failing tests — `lib/kit/content.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "../statute/ma";
import { addBusinessDays, buildKitContent } from "./content";
import { filingFeeForClaim } from "./court-data";

function violatingTenancy(): TenancyInputs {
  return {
    depositAmount: 3000,
    monthlyRent: 1500,
    tenancyStartDate: new Date("2023-01-01"),
    moveOutDate: new Date("2024-01-01"),
    tenancyEndConfirmed: true,
    receivedItemizedList: true,
    itemizedListDate: new Date("2024-03-01"),
    listSwornUnderPenalty: "no",
    receivedBankReceipt: "no",
    receivedStatementOfCondition: "no",
    deductionsClaimed: [{ description: "Carpet cleaning", amount: 300 }],
    amountReturned: 1200,
    interestPaidAnnually: "no",
  };
}

describe("filingFeeForClaim", () => {
  it("uses the verified mass.gov tiers", () => {
    expect(filingFeeForClaim(400)).toBe(40);
    expect(filingFeeForClaim(500)).toBe(40);
    expect(filingFeeForClaim(1500)).toBe(50);
    expect(filingFeeForClaim(3000)).toBe(100);
    expect(filingFeeForClaim(7000)).toBe(150);
    expect(filingFeeForClaim(9000)).toBe(150);
  });
});

describe("addBusinessDays", () => {
  it("skips weekends", () => {
    // Wed 2026-07-08 + 10 business days = Wed 2026-07-22
    const result = addBusinessDays(new Date("2026-07-08T12:00:00"), 10);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(22);
  });
});

describe("buildKitContent", () => {
  const tenancy = violatingTenancy();
  const analysis = analyzeTenancy(tenancy, new Date("2026-07-08T12:00:00"));
  const kit = buildKitContent(tenancy, analysis, new Date("2026-07-08T12:00:00"));

  it("carries the demand amount from the analysis", () => {
    expect(kit.demandAmount).toBe(
      analysis.exposure.maxExposure.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    );
    expect(kit.trebleApplies).toBe(true);
  });

  it("includes the core sections", () => {
    const headings = kit.sections.map((s) => s.heading);
    expect(headings.some((h) => h.toLowerCase().includes("certified mail"))).toBe(true);
    expect(headings.some((h) => h.toLowerCase().includes("evidence"))).toBe(true);
    expect(headings.some((h) => h.toLowerCase().includes("timeline"))).toBe(true);
    expect(headings.some((h) => h.toLowerCase().includes("small claims"))).toBe(true);
  });

  it("mentions the correct filing fee tier for this claim", () => {
    // outstanding balance here is $1,800 (forfeited deductions: $3,000 − $1,200
    // returned), which lands in the $500.01–$2,000 → $50 tier.
    const smallClaims = kit.sections.find((s) =>
      s.heading.toLowerCase().includes("small claims")
    )!;
    const text = [...smallClaims.paragraphs, ...(smallClaims.list ?? [])].join(" ");
    expect(text).toContain("$50");
    expect(text.toLowerCase()).toContain("confirm the current");
  });

  it("notes that treble damages may exceed the small-claims limit when they apply", () => {
    const all = kit.sections
      .flatMap((s) => [...s.paragraphs, ...(s.list ?? [])])
      .join(" ")
      .toLowerCase();
    expect(all).toContain("7,000");
  });

  it("never promises outcomes and always carries the disclaimer", () => {
    const all = [kit.title, ...kit.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])])]
      .join(" ")
      .toLowerCase();
    expect(all).not.toContain("you will win");
    expect(all).not.toContain("guaranteed");
    expect(kit.disclaimer).toContain("not legal advice");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run lib/kit/content.test.ts`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 4: Create `lib/kit/content.ts`**

```ts
import type { AnalysisResult, TenancyInputs } from "@/lib/statute/ma";
import { EFILING_SURCHARGE, SMALL_CLAIMS_LIMIT, filingFeeForClaim } from "./court-data";

const DISCLAIMER =
  "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney.";

export interface KitSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface KitContent {
  title: string;
  generatedDate: string;
  demandAmount: string;
  responseDeadlineDate: string;
  trebleApplies: boolean;
  sections: KitSection[];
  disclaimer: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export function buildKitContent(
  tenancy: TenancyInputs,
  analysis: AnalysisResult,
  today: Date = new Date()
): KitContent {
  const demandAmount = formatCurrency(analysis.exposure.maxExposure);
  const responseDeadline = addBusinessDays(today, 10);
  const responseDeadlineDate = formatDate(responseDeadline);
  const trebleApplies = analysis.exposure.trebleApplies;
  const triggered = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
  );
  const filingFee = filingFeeForClaim(analysis.exposure.outstandingBalance);
  const fitsSmallClaims = analysis.exposure.outstandingBalance <= SMALL_CLAIMS_LIMIT;

  const sections: KitSection[] = [
    {
      heading: "How to use this kit",
      paragraphs: [
        `This kit was generated on ${formatDate(today)} from the answers you gave about your tenancy. It walks you through sending your demand letter the right way, keeping the evidence organized, and — if your landlord doesn't respond by ${responseDeadlineDate} — taking the claim to Massachusetts small claims court.`,
        triggered.length > 0
          ? `Based on your answers, ${triggered.length} requirement(s) of M.G.L. c. 186, §15B may not have been met, and your demand letter asks for ${demandAmount}.` +
            (trebleApplies
              ? " That figure reflects treble damages the statute may allow, plus accrued interest."
              : "")
          : `Your answers did not show a clear procedural violation of §15B, so your demand letter asks for the outstanding balance of ${demandAmount}.`,
      ],
    },
    {
      heading: "Step 1 — Send your demand letter by certified mail",
      paragraphs: [
        "Certified mail with a return receipt creates dated proof that your landlord received your demand — often the single most useful piece of paper if the dispute goes to court.",
      ],
      list: [
        "Print and sign the enclosed demand letter, and fill in any [bracketed] fields (names, addresses) before sending.",
        "At any post office, send it via USPS Certified Mail® and add Return Receipt (the green card, or electronic return receipt).",
        "Keep the mailing receipt with the tracking number, and keep a dated copy of exactly what you sent.",
        "When the signed return receipt comes back, file it with your records — it proves delivery.",
        `Mark your calendar: the letter gives your landlord 10 business days to respond (${responseDeadlineDate} if you mail it today).`,
      ],
    },
    {
      heading: "Step 2 — Build your evidence packet",
      paragraphs: [
        "Organized evidence is what turns a he-said-she-said into a documented claim. Gather:",
      ],
      list: [
        "Your lease and any statement of condition from move-in.",
        "Move-in and move-out photos or video, dated if possible.",
        "Every written exchange with your landlord about the deposit — texts, emails, letters.",
        "Bank records showing the deposit you paid and anything returned.",
        "Any itemized list of deductions your landlord sent, with its envelope or email date.",
        "Your demand letter, the certified-mail receipt, and the return receipt once delivered.",
      ],
    },
    {
      heading: "Your escalation timeline",
      paragraphs: ["Three dates matter from the day you mail the letter:"],
      list: [
        `Day 0 (${formatDate(today)}): mail the demand letter by certified mail and start your evidence packet.`,
        `Day 10 business days (${responseDeadlineDate}): the response deadline stated in your letter. If you've received full payment, you're done. Partial offers are your call — the statute's remedies don't disappear if you decline.`,
        "If the deadline passes without payment: you can file in small claims court (Step 3). Many tenants also send one short follow-up note first saying they're proceeding to court — sometimes that alone prompts payment.",
      ],
    },
    {
      heading: "Step 3 — Massachusetts small claims court, start to finish",
      paragraphs: [
        fitsSmallClaims
          ? `Small claims court handles claims of $${SMALL_CLAIMS_LIMIT.toLocaleString("en-US")} or less, and your outstanding balance fits. Where a statute allows multiple damages — like the treble damages §15B(7) can provide — the final award may exceed that limit even though the underlying claim fits.`
          : `Small claims court handles claims of $${SMALL_CLAIMS_LIMIT.toLocaleString("en-US")} or less in actual damages. Your outstanding balance is above that, so consider whether to waive the excess to stay in small claims, or ask a Massachusetts attorney about a regular civil action.`,
        "No lawyer is required. The process:",
      ],
      list: [
        "Where to file: the District Court, Boston Municipal Court, or Housing Court for the area where you live or work, where the landlord lives or does business, or where the rental property is located.",
        'Fill out the "Statement of Small Claim and Notice" form — available at the clerk\'s office, by mail, or through the courts\' online eFiling tool.',
        `Filing fee for a claim like yours: ${formatCurrency(filingFee)} (eFiling adds about ${formatCurrency(EFILING_SURCHARGE)}). Fees are set by the courts and change — confirm the current amount when you file.`,
        "In the claim description, state the deposit amount, the move-out date, and each §15B requirement that wasn't met — your demand letter already lists them in the right order.",
        "The clerk mails the claim to your landlord with a hearing date. Bring your evidence packet, your demand letter, and proof of certified mailing to the hearing.",
        "At the hearing, tell it plainly: what you paid, when you moved out, what the landlord did and didn't do, and what §15B required. The magistrate asks questions — you don't need legal language.",
      ],
    },
  ];

  return {
    title: "Massachusetts Security Deposit Dispute Kit",
    generatedDate: formatDate(today),
    demandAmount,
    responseDeadlineDate,
    trebleApplies,
    sections,
    disclaimer: DISCLAIMER,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/kit/content.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Run the full suite + type-check**

Run: `npm test && npm run type-check`
Expected: everything passes.

- [ ] **Step 7: Commit**

```bash
git add lib/kit/court-data.ts lib/kit/content.ts lib/kit/content.test.ts
git commit -m "feat: kit content assembly with verified MA small-claims data"
```

---

### Task 5: Kit PDF renderer

**Files:**
- Create: `lib/kit/pdf.tsx`
- Test: `lib/kit/pdf.test.ts`

**Interfaces:**
- Consumes: `KitContent` from `lib/kit/content.ts`.
- Produces: `renderKitPdf(kit: KitContent): Promise<Buffer>` (used by Tasks 6, 7).

- [ ] **Step 1: Write the failing smoke test — `lib/kit/pdf.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { analyzeTenancy, type TenancyInputs } from "../statute/ma";
import { buildKitContent } from "./content";
import { renderKitPdf } from "./pdf";

const tenancy: TenancyInputs = {
  depositAmount: 3000,
  monthlyRent: 1500,
  tenancyStartDate: new Date("2023-01-01"),
  moveOutDate: new Date("2024-01-01"),
  tenancyEndConfirmed: true,
  receivedItemizedList: false,
  listSwornUnderPenalty: "unknown",
  receivedBankReceipt: "no",
  receivedStatementOfCondition: "no",
  deductionsClaimed: [],
  amountReturned: 0,
  interestPaidAnnually: "no",
};

describe("renderKitPdf", () => {
  it("renders a non-trivial PDF buffer", async () => {
    const analysis = analyzeTenancy(tenancy, new Date("2026-07-08"));
    const kit = buildKitContent(tenancy, analysis, new Date("2026-07-08"));
    const pdf = await renderKitPdf(kit);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(2000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/kit/pdf.test.ts`
Expected: FAIL — cannot resolve `./pdf`.

- [ ] **Step 3: Create `lib/kit/pdf.tsx`** (mirrors `lib/letter/pdf.tsx` styles)

```tsx
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { KitContent } from "./content";

const styles = StyleSheet.create({
  page: { padding: 56, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5, color: "#111827" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 20 },
  summaryCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  summaryLine: { marginBottom: 2 },
  heading: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  paragraph: { marginBottom: 8 },
  listItem: { marginBottom: 4, marginLeft: 12 },
  disclaimer: { marginTop: 32, fontSize: 8, color: "#6b7280" },
});

function KitDocument({ kit }: { kit: KitContent }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{kit.title}</Text>
        <Text style={styles.subtitle}>Generated {kit.generatedDate}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLine}>Demand amount: {kit.demandAmount}</Text>
          <Text style={styles.summaryLine}>
            Response deadline (10 business days): {kit.responseDeadlineDate}
          </Text>
          {kit.trebleApplies && (
            <Text style={styles.summaryLine}>
              Treble damages under M.G.L. c. 186, §15B(7) may apply to this claim.
            </Text>
          )}
        </View>

        {kit.sections.map((section, i) => (
          <View key={i}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((paragraph, j) => (
              <Text key={j} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.list?.map((item, k) => (
              <Text key={k} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.disclaimer}>{kit.disclaimer}</Text>
      </Page>
    </Document>
  );
}

export async function renderKitPdf(kit: KitContent): Promise<Buffer> {
  return renderToBuffer(<KitDocument kit={kit} />);
}
```

Note: sections are allowed to break across pages (react-pdf's default) — the kit runs several pages and that's fine.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/kit/pdf.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/kit/pdf.tsx lib/kit/pdf.test.ts
git commit -m "feat: dispute kit PDF renderer"
```

---

### Task 6: Kit delivery email + Stripe webhook fulfillment

**Files:**
- Modify: `lib/email/resend.ts` (add `sendKitEmail`)
- Modify: `lib/payments/stripe.ts` (add `constructWebhookEvent`)
- Create: `lib/kit/fulfill.ts` (fulfillment orchestration, testable seam)
- Create: `app/api/webhooks/stripe/route.ts`
- Test: `lib/kit/fulfill.test.ts`

**Interfaces:**
- Consumes: `getKitOrderById`, `claimKitOrderForFulfillment`, `revertKitOrderToPaid`, `setKitOrderEmail` (Task 2); `buildKitContent`/`renderKitPdf` (Tasks 4–5); `toTenancyInputs` from `lib/flow/toTenancyInputs.ts`; `analyzeTenancy` from `lib/statute/ma.ts`; `buildDemandLetter`/`renderDemandLetterPdf` from `lib/letter/*`; `recordEvent` from `lib/db/events.ts`.
- Produces:
  - `sendKitEmail(input: { to: string; letterPdf: Uint8Array; kitPdf: Uint8Array }): Promise<{ sent: boolean }>`
  - `constructWebhookEvent(payload: string, signature: string): Stripe.Event | null` — null when unconfigured or signature invalid.
  - `fulfillKitOrder(kitOrderId: string, email: string | null, deps?: FulfillDeps): Promise<"fulfilled" | "already_fulfilled" | "retry" | "not_found">`

- [ ] **Step 1: Add `sendKitEmail` to `lib/email/resend.ts`** (below `sendLetterEmail`, reusing `getClient`)

```ts
export interface SendKitEmailInput {
  to: string;
  letterPdf: Uint8Array;
  kitPdf: Uint8Array;
}

/**
 * Emails the purchased Dispute Kit: the demand letter plus the kit packet.
 * Same graceful-degradation contract as sendLetterEmail.
 */
export async function sendKitEmail(input: SendKitEmailInput): Promise<{ sent: boolean }> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not configured, would send kit to ${input.to}`);
    return { sent: false };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: input.to,
    subject: "Your Massachusetts Security Deposit Dispute Kit",
    html:
      "<p>Thank you for your purchase. Your Dispute Kit is attached:</p>" +
      "<ul><li><strong>Demand letter</strong> — print, sign, fill in any [bracketed] fields, and send by certified mail.</li>" +
      "<li><strong>Dispute Kit</strong> — certified-mail steps, evidence checklist, your escalation timeline, and the small-claims walkthrough.</li></ul>" +
      "<p>This is general legal information, not legal advice, and does not create an " +
      "attorney-client relationship. For advice about your situation, consult a licensed " +
      "Massachusetts attorney.</p>",
    attachments: [
      {
        filename: "security-deposit-demand-letter.pdf",
        content: Buffer.from(input.letterPdf),
      },
      {
        filename: "security-deposit-dispute-kit.pdf",
        content: Buffer.from(input.kitPdf),
      },
    ],
  });

  if (error) {
    console.error("[email] failed to send kit email", error);
    return { sent: false };
  }
  return { sent: true };
}
```

- [ ] **Step 2: Add `constructWebhookEvent` to `lib/payments/stripe.ts`**

```ts
/**
 * Verifies a Stripe webhook signature and parses the event. Returns null when
 * Stripe/webhook secret isn't configured or the signature is invalid — the
 * caller must treat null as "reject".
 */
export function constructWebhookEvent(payload: string, signature: string): Stripe.Event | null {
  const stripe = getClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.log("[stripe] webhook secret not configured, rejecting webhook");
    return null;
  }
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("[stripe] webhook signature verification failed", error);
    return null;
  }
}
```

- [ ] **Step 3: Write the failing fulfillment tests — `lib/kit/fulfill.test.ts`**

```ts
import { describe, expect, it, vi } from "vitest";
import { initialFlowAnswers } from "../flow/types";
import { fulfillKitOrder, type FulfillDeps } from "./fulfill";

const answers = {
  ...initialFlowAnswers,
  depositAmount: "3000",
  monthlyRent: "1500",
  tenancyStartDate: "2023-01-01",
  moveOutDate: "2024-01-01",
  tenancyEndConfirmed: true,
  receivedBankReceipt: "no" as const,
};

function makeDeps(overrides: Partial<FulfillDeps> = {}): FulfillDeps {
  return {
    getOrder: vi.fn().mockResolvedValue({
      id: "order-1",
      email: null,
      answers,
      stripeSessionId: "cs_123",
      status: "pending",
      src: "reddit",
    }),
    claimOrder: vi.fn().mockResolvedValue(true),
    revertOrder: vi.fn().mockResolvedValue(undefined),
    saveEmail: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue({ sent: true }),
    recordPurchase: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("fulfillKitOrder", () => {
  it("fulfills a paid order: claims, emails both PDFs, records purchase", async () => {
    const deps = makeDeps();
    const result = await fulfillKitOrder("order-1", "buyer@example.com", deps);
    expect(result).toBe("fulfilled");
    expect(deps.claimOrder).toHaveBeenCalledWith("order-1");
    expect(deps.saveEmail).toHaveBeenCalledWith("order-1", "buyer@example.com");
    const sendArgs = vi.mocked(deps.sendEmail).mock.calls[0][0];
    expect(sendArgs.to).toBe("buyer@example.com");
    expect(sendArgs.letterPdf.byteLength).toBeGreaterThan(0);
    expect(sendArgs.kitPdf.byteLength).toBeGreaterThan(0);
    expect(deps.recordPurchase).toHaveBeenCalledWith("reddit");
  });

  it("is idempotent: an already-fulfilled order sends nothing", async () => {
    const deps = makeDeps({ claimOrder: vi.fn().mockResolvedValue(false) });
    const result = await fulfillKitOrder("order-1", "buyer@example.com", deps);
    expect(result).toBe("already_fulfilled");
    expect(deps.sendEmail).not.toHaveBeenCalled();
    expect(deps.recordPurchase).not.toHaveBeenCalled();
  });

  it("reverts the claim and asks for a retry when the email fails", async () => {
    const deps = makeDeps({ sendEmail: vi.fn().mockResolvedValue({ sent: false }) });
    const result = await fulfillKitOrder("order-1", "buyer@example.com", deps);
    expect(result).toBe("retry");
    expect(deps.revertOrder).toHaveBeenCalledWith("order-1");
    expect(deps.recordPurchase).not.toHaveBeenCalled();
  });

  it("returns not_found for unknown orders", async () => {
    const deps = makeDeps({ getOrder: vi.fn().mockResolvedValue(null) });
    const result = await fulfillKitOrder("missing", "buyer@example.com", deps);
    expect(result).toBe("not_found");
  });

  it("returns retry when no email is available to deliver to", async () => {
    const deps = makeDeps();
    const result = await fulfillKitOrder("order-1", null, deps);
    expect(result).toBe("retry");
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run lib/kit/fulfill.test.ts`
Expected: FAIL — cannot resolve `./fulfill`.

- [ ] **Step 5: Create `lib/kit/fulfill.ts`**

```ts
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { buildDemandLetter } from "@/lib/letter/template";
import { renderDemandLetterPdf } from "@/lib/letter/pdf";
import { buildKitContent } from "./content";
import { renderKitPdf } from "./pdf";
import {
  claimKitOrderForFulfillment,
  getKitOrderById,
  revertKitOrderToPaid,
  setKitOrderEmail,
  type KitOrder,
} from "@/lib/db/kitOrders";
import { sendKitEmail } from "@/lib/email/resend";
import { recordEvent } from "@/lib/db/events";

export interface FulfillDeps {
  getOrder: (id: string) => Promise<KitOrder | null>;
  claimOrder: (id: string) => Promise<boolean>;
  revertOrder: (id: string) => Promise<void>;
  saveEmail: (id: string, email: string) => Promise<void>;
  sendEmail: (input: {
    to: string;
    letterPdf: Uint8Array;
    kitPdf: Uint8Array;
  }) => Promise<{ sent: boolean }>;
  recordPurchase: (src: string | null) => Promise<void>;
}

const defaultDeps: FulfillDeps = {
  getOrder: getKitOrderById,
  claimOrder: claimKitOrderForFulfillment,
  revertOrder: revertKitOrderToPaid,
  saveEmail: setKitOrderEmail,
  sendEmail: sendKitEmail,
  recordPurchase: (src) => recordEvent({ eventName: "purchased", src }),
};

export type FulfillResult = "fulfilled" | "already_fulfilled" | "retry" | "not_found";

/**
 * Fulfills a paid kit order exactly once: claims it (idempotency gate),
 * regenerates both PDFs from the stored answers snapshot, emails them, and
 * records the purchase. "retry" means the caller should return a non-2xx so
 * Stripe redelivers the webhook.
 */
export async function fulfillKitOrder(
  kitOrderId: string,
  email: string | null,
  deps: FulfillDeps = defaultDeps
): Promise<FulfillResult> {
  const order = await deps.getOrder(kitOrderId);
  if (!order) return "not_found";

  const deliverTo = email ?? order.email;
  if (!deliverTo) {
    console.error(`[kit] order ${kitOrderId} has no delivery email`);
    return "retry";
  }

  const claimed = await deps.claimOrder(kitOrderId);
  if (!claimed) return "already_fulfilled";

  try {
    if (email) await deps.saveEmail(kitOrderId, email);

    const tenancy = toTenancyInputs(order.answers as FlowAnswers);
    const analysis = analyzeTenancy(tenancy);
    const letter = buildDemandLetter(tenancy, analysis);
    const letterPdf = await renderDemandLetterPdf(letter);
    const kitPdf = await renderKitPdf(buildKitContent(tenancy, analysis));

    const { sent } = await deps.sendEmail({ to: deliverTo, letterPdf, kitPdf });
    if (!sent) {
      await deps.revertOrder(kitOrderId);
      return "retry";
    }

    await deps.recordPurchase(order.src);
    return "fulfilled";
  } catch (error) {
    console.error(`[kit] fulfillment failed for order ${kitOrderId}`, error);
    await deps.revertOrder(kitOrderId);
    return "retry";
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/kit/fulfill.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Create `app/api/webhooks/stripe/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/payments/stripe";
import { fulfillKitOrder } from "@/lib/kit/fulfill";

// PDF generation needs Node APIs; signature verification needs the raw body.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const payload = await req.text();
  const event = constructWebhookEvent(payload, signature);
  if (!event) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: true, ignored: "not_paid" });
  }

  const kitOrderId = session.metadata?.kit_order_id;
  if (!kitOrderId) {
    // Not one of ours (or created before order tracking) — acknowledge so
    // Stripe doesn't retry forever.
    console.error("[webhook] checkout.session.completed without kit_order_id", session.id);
    return NextResponse.json({ ok: true, ignored: "no_kit_order_id" });
  }

  const email = session.customer_details?.email ?? null;
  const result = await fulfillKitOrder(kitOrderId, email);

  if (result === "retry") {
    return NextResponse.json({ ok: false, error: "fulfillment_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result });
}
```

- [ ] **Step 8: Full suite + type-check**

Run: `npm test && npm run type-check`
Expected: everything passes.

- [ ] **Step 9: Commit**

```bash
git add lib/email/resend.ts lib/payments/stripe.ts lib/kit/fulfill.ts lib/kit/fulfill.test.ts app/api/webhooks/stripe
git commit -m "feat: webhook-driven kit fulfillment with idempotent delivery"
```

---

### Task 7: Success page — order status + re-download; retire confirm route

**Files:**
- Create: `app/api/kit/order/route.ts` (GET status by session id)
- Create: `app/api/kit/download/route.ts` (GET kit PDF by session id)
- Modify: `components/kit/KitSuccessClient.tsx`
- Delete: `app/api/checkout/confirm/route.ts`

**Interfaces:**
- Consumes: `getKitOrderBySessionId` (Task 2); `buildKitContent`/`renderKitPdf` (Tasks 4–5); `toTenancyInputs`, `analyzeTenancy`.
- Produces: `GET /api/kit/order?session_id=` → `{ ok: true, status: "pending" | "paid" | "fulfilled" }` or 404; `GET /api/kit/download?session_id=` → `application/pdf` when fulfilled, 403 otherwise.

- [ ] **Step 1: Create `app/api/kit/order/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getKitOrderBySessionId } from "@/lib/db/kitOrders";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  const order = await getKitOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: order.status });
}
```

- [ ] **Step 2: Create `app/api/kit/download/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getKitOrderBySessionId } from "@/lib/db/kitOrders";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { buildKitContent } from "@/lib/kit/content";
import { renderKitPdf } from "@/lib/kit/pdf";

// @react-pdf/renderer needs Node APIs, not available on the edge runtime.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  const order = await getKitOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "fulfilled") {
    return NextResponse.json({ ok: false, error: "not_paid" }, { status: 403 });
  }

  const tenancy = toTenancyInputs(order.answers as FlowAnswers);
  const analysis = analyzeTenancy(tenancy);
  const pdf = await renderKitPdf(buildKitContent(tenancy, analysis));

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="security-deposit-dispute-kit.pdf"',
    },
  });
}
```

- [ ] **Step 3: Rewrite `components/kit/KitSuccessClient.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderState = "checking" | "fulfilled" | "paid" | "unconfirmed";

export function KitSuccessClient() {
  const [state, setState] = useState<OrderState>("checking");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
    if (!id) {
      setState("unconfirmed");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    // The webhook fulfills within seconds; poll briefly so the buyer usually
    // sees "fulfilled" (with the download link) rather than a waiting state.
    async function check() {
      try {
        const res = await fetch(`/api/kit/order?session_id=${encodeURIComponent(id!)}`);
        const data = (await res.json()) as { ok: boolean; status?: string };
        if (cancelled) return;
        if (data.ok && data.status === "fulfilled") {
          setState("fulfilled");
          return;
        }
        if (data.ok && (data.status === "paid" || data.status === "pending")) {
          setState("paid");
        } else {
          setState("unconfirmed");
          return;
        }
      } catch {
        if (!cancelled) setState("unconfirmed");
        return;
      }
      attempts += 1;
      if (attempts < 5) setTimeout(check, 2000);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16 text-center">
      {state === "checking" && <p className="text-gray-500">Confirming your payment…</p>}

      {state === "fulfilled" && (
        <div className="rounded-2xl bg-accent px-6 py-8 text-white shadow-lg">
          <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Thank you</p>
          <h1 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">
            Your kit is in your inbox
          </h1>
          <p className="mb-5 text-white/90">
            We&apos;ve emailed your demand letter and Dispute Kit. You can also download the kit
            right now:
          </p>
          <a
            href={`/api/kit/download?session_id=${encodeURIComponent(sessionId ?? "")}`}
            className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-100"
          >
            Download the Dispute Kit (PDF)
          </a>
        </div>
      )}

      {state === "paid" && (
        <div className="rounded-2xl bg-accent px-6 py-8 text-white shadow-lg">
          <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Thank you</p>
          <h1 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">You&apos;re all set</h1>
          <p className="text-white/90">
            Your kit is being prepared and will arrive by email in the next few minutes. Keep this
            page open, or check your inbox.
          </p>
        </div>
      )}

      {state === "unconfirmed" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
          <p className="mb-2 font-medium text-gray-900">We couldn&apos;t confirm your payment yet</p>
          <p className="text-sm">
            If you completed checkout, your kit will arrive by email shortly. If it hasn&apos;t
            arrived within an hour, reply to any of our emails and we&apos;ll sort it out.
          </p>
        </div>
      )}

      <Link href="/" className="mt-8 text-sm text-accent underline">
        Back to Deposit Defenders
      </Link>
    </main>
  );
}
```

- [ ] **Step 4: Delete the old confirm route**

```bash
git rm app/api/checkout/confirm/route.ts
```

Then verify nothing references it: `grep -rn "checkout/confirm" app components lib || echo CLEAN` → expect `CLEAN`.

- [ ] **Step 5: Full suite + type-check + build**

Run: `npm test && npm run type-check && npm run build`
Expected: all pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/api/kit components/kit/KitSuccessClient.tsx
git commit -m "feat: kit success page with live order status and re-download"
```

---

### Task 8: Funnel report script

**Files:**
- Create: `scripts/funnel-report.mjs`
- Modify: `package.json` (add script)

**Interfaces:**
- Consumes: `events` table (`event_name`, `src`, `created_at`), `kit_orders` table.
- Produces: console report; `npm run funnel` command.

- [ ] **Step 1: Create `scripts/funnel-report.mjs`**

```js
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
      previous === null || previous === 0 ? "" : ` (${((count / previous) * 100).toFixed(1)}% of prev)`;
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
```

- [ ] **Step 2: Add the npm script**

In `package.json` scripts, after `"db:seed-test-rows"`, add:

```json
    "funnel": "node --env-file=.env.local scripts/funnel-report.mjs"
```

- [ ] **Step 3: Run it against the live DB**

Run: `npm run funnel`
Expected: prints the funnel tables (counts may be small/zero) and the kit-orders block without errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/funnel-report.mjs package.json
git commit -m "feat: local funnel + revenue report script"
```

---

### Task 9: Guide index page + JSON-LD structured data

**Files:**
- Modify: `lib/guide/articles.ts` (add optional `faq` field + related-slug links)
- Create: `app/guide/page.tsx`
- Modify: `app/guide/[slug]/page.tsx` (JSON-LD scripts, FAQ rendering, related links)
- Modify: `app/sitemap.ts` (add `/guide`)

**Interfaces:**
- Consumes: `guideArticles`, `GuideArticle` from `lib/guide/articles.ts`; `SITE_URL` from `lib/site.ts`.
- Produces: `GuideArticle` gains `faq?: { question: string; answer: string }[]` and `related?: string[]` (slugs). Task 10's articles use both.

- [ ] **Step 1: Extend the `GuideArticle` interface in `lib/guide/articles.ts`**

```ts
export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideArticle {
  slug: string;
  title: string;
  metaDescription: string;
  updated: string;
  intro: string;
  sections: GuideSection[];
  faq?: GuideFaq[];
  /** Slugs of related guides, rendered as "Keep reading" links. */
  related?: string[];
  ctaHeading: string;
  ctaBody: string;
  ctaHref: string;
  ctaLabel: string;
}
```

- [ ] **Step 2: Create `app/guide/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { guideArticles } from "@/lib/guide/articles";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Massachusetts Security Deposit Guides — Deposit Defenders",
  description:
    "Plain-English guides to Massachusetts security deposit law: deadlines, deductions, interest, demand letters, and small claims court under M.G.L. c. 186 §15B.",
  alternates: { canonical: `${SITE_URL}/guide` },
};

export default function GuideIndexPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">Guides</p>
      <h1 className="mb-4 font-serif text-3xl font-bold leading-tight text-gray-900">
        Massachusetts security deposit guides
      </h1>
      <p className="mb-8 text-lg text-gray-600">
        What M.G.L. c. 186, §15B actually requires of your landlord — and what to do when those
        requirements aren&apos;t met.
      </p>

      <ul className="space-y-4">
        {guideArticles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/guide/${article.slug}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-accent"
            >
              <h2 className="mb-1 font-semibold text-gray-900">{article.title}</h2>
              <p className="text-sm text-gray-600">{article.metaDescription}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-4 mt-10 rounded-2xl bg-accent px-6 py-8 text-center text-white shadow-lg">
        <h2 className="mb-2 font-serif text-2xl font-bold">Check your own situation for free</h2>
        <p className="mb-5 text-white/90">
          Answer a few questions about your deposit and we&apos;ll tell you what the law says you
          may be owed.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-100"
        >
          Check my deposit — it&apos;s free
        </Link>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        This tool provides general legal information, not legal advice, and does not create an
        attorney-client relationship. For advice about your situation, consult a licensed
        Massachusetts attorney.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Add JSON-LD + FAQ + related links to `app/guide/[slug]/page.tsx`**

Inside the component, before `return`, build the structured data:

```tsx
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    dateModified: article.updated,
    mainEntityOfPage: `${SITE_URL}/guide/${article.slug}`,
    author: { "@type": "Organization", name: "Deposit Defenders" },
  };

  const faqLd = article.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  const relatedArticles = (article.related ?? [])
    .map((slug) => getGuideArticle(slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
```

In the JSX, right after `<main …>` opens, add:

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
```

After the sections loop (before the CTA card), render FAQ and related links:

```tsx
      {article.faq && article.faq.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Frequently asked questions</h2>
          {article.faq.map((item, i) => (
            <details key={i} className="mb-2 rounded-lg border border-gray-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-gray-900">
                {item.question}
              </summary>
              <p className="mt-2 text-gray-700">{item.answer}</p>
            </details>
          ))}
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Keep reading</h2>
          <ul className="space-y-2">
            {relatedArticles.map((related) => (
              <li key={related.slug}>
                <Link href={`/guide/${related.slug}`} className="text-accent underline">
                  {related.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
```

Also add a breadcrumb link at the top (right after `<main>` scripts): `<Link href="/guide" className="mb-2 inline-block text-sm text-accent underline">← All guides</Link>`.

- [ ] **Step 4: Add `/guide` to `app/sitemap.ts`**

In `staticRoutes`, add after the `/kit` entry:

```ts
    { url: `${SITE_URL}/guide`, changeFrequency: "weekly", priority: 0.7 },
```

- [ ] **Step 5: Type-check + build**

Run: `npm run type-check && npm run build`
Expected: passes; build output lists `/guide` and both existing `/guide/[slug]` pages.

- [ ] **Step 6: Commit**

```bash
git add lib/guide/articles.ts app/guide app/sitemap.ts
git commit -m "feat: guide index, JSON-LD schema, FAQ + related-article links"
```

---

### Task 10: Six new SEO articles

**Files:**
- Modify: `lib/guide/articles.ts` (append 6 entries; add `faq`/`related` to the 2 existing)

**Interfaces:**
- Consumes: `GuideArticle` shape from Task 9 (`faq`, `related` fields).
- Produces: 8 published guides, interlinked.

**Content rules for every article (from Global Constraints):** hedged language only ("may", "can expose"); every legal claim carries its §15B citation; deadlines/fees only as verified above; every article ends with the standard CTA into `/` (copy the CTA fields from the existing two articles); `updated: "2026-07-08"`; write prose in the same plain-English voice as the two existing articles (see `massachusetts-security-deposit-law` in the same file); 2–4 FAQ entries each; `related` links forming a mesh (each article links 2–3 others). **All six are drafts for user review before deploy — do not deploy this task to production without user sign-off on the content.**

The six articles, with slug, title targeting the search query, and the section-by-section legal content each must convey:

1. **`landlord-didnt-return-security-deposit-30-days-massachusetts`** — "Landlord Didn't Return Your Security Deposit Within 30 Days? Here's What Massachusetts Law Says."
   Sections: (a) The 30-day rule — §15B(4): balance due within 30 days of tenancy end; (b) What counts as the end of tenancy; (c) The consequence — forfeiture under §15B(6)(e) and treble damages exposure under §15B(7) plus court costs and attorney's fees; (d) What to do now — demand letter first, then small claims. FAQ: "Does the 30 days include weekends?" (calendar days), "What if the landlord sent a partial refund?" (balance still due), "Can I really get three times my deposit?" (the statute may allow treble damages on the amount wrongfully withheld — not a guarantee).
   Related: treble-damages article, demand-letter article, small-claims article.

2. **`treble-damages-security-deposit-massachusetts`** — "Treble Damages in Massachusetts Security Deposit Cases: When 3x Applies."
   Sections: (a) What §15B(7) says — treble the amount wrongfully withheld, plus interest, court costs, reasonable attorney's fees; (b) Which violations trigger it — only §15B(6)(a) (failure to deposit in escrow / provide receipt), (6)(d), and (6)(e) (failure to return within 30 days); (c) Which violations do NOT by themselves — late/unsworn itemization forfeits deductions under (6)(b) but trebles only when the resulting balance also isn't returned; excess deposit and unpaid interest are separately recoverable but not trebled alone; (d) Treble damages and the small-claims limit — statutory multiple damages may exceed $7,000 when actual damages fit. FAQ: 3 entries mirroring those distinctions.
   Related: 30-days article, small-claims article, main law guide.

3. **`normal-wear-and-tear-vs-damage-massachusetts`** — "Normal Wear and Tear vs. Damage: What Massachusetts Landlords Can Deduct."
   Sections: (a) §15B(4)(iii): only unpaid rent/increases and damage beyond reasonable wear and tear are deductible; (b) Commonly contested deductions — routine cleaning, repainting, carpet shampooing, small nail holes, scuffs, fading (label: commonly contestable, informational); (c) What may be legitimate — broken fixtures, holes in walls, pet/smoke/water damage; (d) The itemization requirement — sworn list with written evidence within 30 days, else deductions forfeited under §15B(6)(b). FAQ: "Can my landlord charge a cleaning fee?", "Do I owe for repainting after 3 years?", "What proof does the landlord need?"
   Related: main law guide, 30-days article, demand-letter article.

4. **`security-deposit-interest-massachusetts`** — "Your Landlord Owes You Interest on Your Security Deposit in Massachusetts."
   Sections: (a) §15B(3)(b): 5% per year, or the actual bank rate if less, on deposits held one year or longer, payable at the end of each tenancy year; (b) Last month's rent interest note — brief mention that §15B also requires interest on last month's rent (keep to one sentence, cite §15B(2)(a)); (c) How to calculate what you're owed (worked example: $2,000 deposit × 5% × 2 years = $200); (d) Not trebled alone, but recoverable — and part of the balance that must come back within 30 days. FAQ: "What if my landlord never told me about interest?", "Is it 5% even if the bank pays less?" (lesser bank rate applies when that's what the account earned).
   Related: main law guide, 30-days article.

5. **`no-statement-of-condition-bank-receipt-massachusetts`** — "No Statement of Condition or Bank Receipt? Your Massachusetts Landlord May Have Forfeited Your Deposit."
   Sections: (a) The bank receipt — §15B(3)(a): separate interest-bearing MA account, receipt with bank name, address, amount, and account number within 30 days; violation forfeits under §15B(6)(a) and can expose to treble damages via §15B(7); (b) The statement of condition — §15B(2)(c): due upon receipt of deposit or within 10 days of tenancy start, whichever is later; affects the landlord's ability to claim damage; (c) Why these paperwork rules matter — they're the most commonly violated and the easiest to prove; (d) How to check (bank records, old emails) and what to do. FAQ: 2–3 entries.
   Related: main law guide, treble-damages article, demand-letter article.

6. **`small-claims-court-security-deposit-massachusetts`** — "Taking Your Landlord to Small Claims Court in Massachusetts for a Security Deposit."
   Sections: (a) When small claims fits — $7,000 limit, statutory multiple damages may exceed it; no lawyer needed; (b) Where to file — District Court, Boston Municipal Court, or Housing Court where you live/work, where the landlord lives/does business, or where the property is; (c) Costs — verified fee tiers $40/$50/$100/$150 by claim amount, ~$7 eFiling surcharge, "confirm the current fee when you file"; (d) The Statement of Small Claim and hearing — what to bring (demand letter, certified-mail proof, evidence packet), what the magistrate asks; (e) Send a demand letter first — it's the expected first step and often resolves the dispute. FAQ: "How long does small claims take?", "Do I need a lawyer?", "What if I win and the landlord still doesn't pay?" (keep answer general: courts have collection procedures; hedged language).
   Related: 30-days article, treble-damages article, demand-letter article.

- [ ] **Step 1: Write the 6 articles into `lib/guide/articles.ts`** following the structures above, matching the existing entries' voice, structure, and formatting exactly. Also add `faq` (2–3 entries) and `related` (2–3 slugs) to the two existing articles so the link mesh is complete.

- [ ] **Step 2: Verify every citation string in the new content appears in the verified set**

Run: `grep -o "§15B([0-9])[^ ,.]*" lib/guide/articles.ts | sort -u`
Expected: only citations among §15B(1)(b), §15B(2)(a), §15B(2)(c), §15B(3)(a), §15B(3)(b), §15B(4), §15B(6)(a), §15B(6)(b), §15B(6)(e), §15B(7).

- [ ] **Step 3: Scan for forbidden outcome-promising language**

Run: `grep -in "you will win\|guaranteed\|promise" lib/guide/articles.ts || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 4: Type-check + build**

Run: `npm run type-check && npm run build`
Expected: passes; build lists all 8 `/guide/[slug]` pages.

- [ ] **Step 5: Commit**

```bash
git add lib/guide/articles.ts
git commit -m "content: six new MA deposit-law guides with FAQ schema (pending user review)"
```

- [ ] **Step 6: Flag for user review** — the articles must be reviewed by the user before the next production deploy. Note this in the task report.

---

### Task 11: Final verification + docs

**Files:**
- Modify: `CLAUDE.md` (env vars + fulfillment reality)

**Interfaces:** none new.

- [ ] **Step 1: Full verification**

Run: `npm test && npm run type-check && npm run build`
Expected: all pass.

- [ ] **Step 2: Manual end-to-end (Stripe test mode)**

```bash
# Terminal 1
npm run dev
# Terminal 2 (requires stripe CLI, logged in)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... it prints into .env.local as STRIPE_WEBHOOK_SECRET, restart dev server.
```

Then in a browser: complete the question flow on `/`, go to `/kit`, buy with test card `4242 4242 4242 4242`. Verify: (1) success page reaches "Your kit is in your inbox" with a working download link; (2) the kit email arrives (or, without RESEND config, the console logs the would-send line and the webhook returns 500 → expected retry behavior); (3) `kit_orders` row is `fulfilled`; (4) exactly one `purchased` event exists after Stripe CLI resends the event (`stripe events resend <evt_id>`).
If any check fails, use superpowers:systematic-debugging before patching.

- [ ] **Step 3: Update `CLAUDE.md`**

In the Stack section, update the payments line to:

```markdown
- Payments: Stripe Checkout (one-time $49) + `checkout.session.completed` webhook for fulfillment. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
```

and change the fake-door sentence in "What this is" from `(fake-door / concierge fulfillment)` to `(automated digital fulfillment: personalized kit PDF + demand letter emailed via Resend on payment)`.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: reflect automated kit fulfillment and webhook env vars"
```

- [ ] **Step 5: Report deploy prerequisites to the user**

Production launch checklist (user-owned, report verbatim):
1. Review the 6 new articles' legal content (Task 10).
2. Vercel env: `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (from a dashboard webhook endpoint pointed at `https://<domain>/api/webhooks/stripe`, event: `checkout.session.completed`), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`.
3. Run `npm run db:migrate` against production Postgres.
4. Verify the Resend sending domain so attachments clear spam filters.
5. After launch: `npm run funnel` weekly to watch conversion and revenue.
