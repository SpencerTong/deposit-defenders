# Pre-Mail Answer Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a paid kit buyer review and correct their original question-flow answers (deposit amount, dates, deductions, etc.) from their `/kit/success` workspace, any time before their letter is mailed, with the same validation the intake flow already applies — closing the gap that required a manual production-DB fix for a real customer (Mary Kirnon, 2026-07-27).

**Architecture:** A new "Your answers" step in the existing workspace reuses the intake flow's own field components (`flowSteps[i].render`/`isValid`) stacked on one screen instead of rebuilt from scratch. A new `POST /api/kit/answers` route persists edits with a server-enforced lock (`mail_status !== 'unsent'` → `409`) and appends the prior value to a new `answers_history` audit column before overwriting. The existing `letter-details` route gets the identical lock. `buildLetterForOrder` already rebuilds the letter fresh from `answers` on every read, so no letter-generation code changes.

**Tech Stack:** Next.js 14 App Router route handlers, TypeScript, `pg` direct queries against Supabase Postgres, Vitest for tests, Tailwind for styling. No new dependencies.

## Global Constraints

- No em/en dashes in any user-facing copy (owner's style rule, enforced by tests elsewhere in this codebase) — use commas or periods instead.
- No accounts; access stays by `session_id` in the URL, matching every other kit route (`loadPaidOrder`).
- The DB is the admin panel — no new admin UI; `answers_history` is written but never surfaced in any UI.
- Persistent disclaimer requirements from `CLAUDE.md` are unaffected by this feature (no new legal claims are introduced; this only changes how already-existing facts get corrected pre-mail).
- Every new server-side write path must be idempotent-safe and degrade gracefully if the DB pool is unconfigured, matching every existing function in `lib/db/kitOrders.ts` (`if (!pool) return;`).
- Match this codebase's existing test conventions exactly: colocated `route.test.ts` next to each route, pure-function unit tests for anything framework-agnostic, `vi.mock("@/lib/db/kitOrders", ...)` for route tests (no live DB or network calls in any test).

---

### Task 1: Extract flow-answer validity rules into a plain module

**Why first:** `components/flow/steps.tsx` is a `"use client"` file that imports React client components (`FormFields.tsx`, `DeductionsEditor.tsx`). The new server route (Task 5) needs the same per-field validity rules `flowSteps[i].isValid` already encodes, but importing a `"use client"` file into a Node route handler would pull client-only code into the server bundle. Pulling the plain predicate logic into a framework-agnostic module first lets both the client wizard and the server route import the same source of truth safely.

**Files:**
- Create: `lib/flow/validation.ts`
- Create: `lib/flow/validation.test.ts`
- Modify: `components/flow/steps.tsx` (replace inline `isValid` bodies with references to the extracted predicates — behavior-preserving refactor, no logic changes)

**Interfaces:**
- Produces: `isNonNegativeAmount(value: string): boolean`, `flowFieldValidity: Record<string, (a: FlowAnswers) => boolean>` (keyed by the same `id` strings already used in `flowSteps`: `"deposit-rent"`, `"dates"`, `"move-in-paperwork"`, `"move-out-paperwork"`, `"deductions"`, `"interest"`), `isCompleteFlowAnswers(a: FlowAnswers): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/flow/validation.test.ts
import { describe, expect, it } from "vitest";
import { isCompleteFlowAnswers, isNonNegativeAmount } from "./validation";
import { initialFlowAnswers, type FlowAnswers } from "./types";

const complete: FlowAnswers = {
  ...initialFlowAnswers,
  depositAmount: "2000",
  monthlyRent: "1800",
  tenancyStartDate: "2023-06-01",
  moveOutDate: "2026-05-31",
  tenancyEndConfirmed: true,
  receivedItemizedList: false,
  amountReturned: "0",
};

describe("isNonNegativeAmount", () => {
  it("accepts zero and positive numeric strings", () => {
    expect(isNonNegativeAmount("0")).toBe(true);
    expect(isNonNegativeAmount("2000")).toBe(true);
  });

  it("rejects empty, negative, or non-numeric strings", () => {
    expect(isNonNegativeAmount("")).toBe(false);
    expect(isNonNegativeAmount("-5")).toBe(false);
  });
});

describe("isCompleteFlowAnswers", () => {
  it("accepts a fully answered flow", () => {
    expect(isCompleteFlowAnswers(complete)).toBe(true);
  });

  it("rejects a missing deposit amount", () => {
    expect(isCompleteFlowAnswers({ ...complete, depositAmount: "" })).toBe(false);
  });

  it("rejects tenancy dates left blank", () => {
    expect(isCompleteFlowAnswers({ ...complete, tenancyStartDate: "" })).toBe(false);
  });

  it("requires an itemized-list date only when a list was received", () => {
    expect(
      isCompleteFlowAnswers({ ...complete, receivedItemizedList: true, itemizedListDate: "" })
    ).toBe(false);
    expect(
      isCompleteFlowAnswers({
        ...complete,
        receivedItemizedList: true,
        itemizedListDate: "2024-01-01",
      })
    ).toBe(true);
  });

  it("rejects a negative amount returned", () => {
    expect(isCompleteFlowAnswers({ ...complete, amountReturned: "-1" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/flow/validation.test.ts`
Expected: FAIL — `lib/flow/validation.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// lib/flow/validation.ts
import type { FlowAnswers } from "./types";

export function isNonNegativeAmount(value: string): boolean {
  return value.trim() !== "" && Number(value) >= 0;
}

export const flowFieldValidity: Record<string, (a: FlowAnswers) => boolean> = {
  "deposit-rent": (a) => isNonNegativeAmount(a.depositAmount) && isNonNegativeAmount(a.monthlyRent),
  dates: (a) => a.tenancyStartDate !== "" && a.moveOutDate !== "" && a.tenancyEndConfirmed !== null,
  "move-in-paperwork": () => true,
  "move-out-paperwork": (a) =>
    a.receivedItemizedList !== null && (!a.receivedItemizedList || a.itemizedListDate !== ""),
  deductions: (a) => isNonNegativeAmount(a.amountReturned),
  interest: () => true,
};

export function isCompleteFlowAnswers(a: FlowAnswers): boolean {
  return Object.values(flowFieldValidity).every((check) => check(a));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/flow/validation.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Refactor `components/flow/steps.tsx` to use the extracted predicates**

Replace each step's inline `isValid` with a reference into `flowFieldValidity`, and drop the now-duplicate local `isNonNegativeNumber` helper. Example for the first two steps (apply the same substitution — `isValid: flowFieldValidity["<id>"]` — to all six steps, matching each step's existing `id`):

```ts
// components/flow/steps.tsx (top of file)
import { flowFieldValidity } from "@/lib/flow/validation";
// remove the local `isNonNegativeNumber` const — no longer used here

export const flowSteps: FlowStep[] = [
  {
    id: "deposit-rent",
    title: "Your deposit and rent",
    render: (answers, update) => ( /* unchanged */ ),
    isValid: flowFieldValidity["deposit-rent"],
  },
  {
    id: "dates",
    title: "Your tenancy dates",
    render: (answers, update) => ( /* unchanged */ ),
    isValid: flowFieldValidity["dates"],
  },
  // ...same pattern for "move-in-paperwork", "move-out-paperwork", "deductions", "interest"
];
```

- [ ] **Step 6: Run the full flow test suite to confirm no behavior changed**

Run: `npx vitest run lib/flow components/flow`
Expected: PASS, same results as before the refactor (this is a pure move, not a logic change).

- [ ] **Step 7: Commit**

```bash
git add lib/flow/validation.ts lib/flow/validation.test.ts components/flow/steps.tsx
git commit -m "refactor: extract flow-answer validity rules into a framework-agnostic module"
```

---

### Task 2: Add the `answers_history` column

**Files:**
- Modify: `scripts/migrate.mjs`

**Interfaces:**
- Produces: `kit_orders.answers_history` column (`JSONB NOT NULL DEFAULT '[]'::jsonb`), consumed by `setKitOrderAnswers` in Task 3.

- [ ] **Step 1: Add the additive migration**

Add this block after the existing `kit_orders mailing columns ready.` block in `scripts/migrate.mjs`:

```js
  await client.query(`
    ALTER TABLE kit_orders
      ADD COLUMN IF NOT EXISTS answers_history JSONB NOT NULL DEFAULT '[]'::jsonb
  `);
  console.log("kit_orders answers_history column ready.");
```

- [ ] **Step 2: Run the migration**

Run: `node --env-file=.env.local scripts/migrate.mjs`
Expected: prints `kit_orders answers_history column ready.` alongside the existing readiness lines.

**If this times out:** this repo has a known, pre-existing issue where raw Postgres connections (both `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`, ports 6543 and 5432) time out from some networks — confirmed unrelated to this code. If `node --env-file=.env.local scripts/migrate.mjs` hangs or times out, do not treat it as a bug in this task. Instead, ask the user to run this single statement themselves via the Supabase dashboard's SQL editor (HTTPS, not the raw Postgres wire protocol, so it isn't subject to the same block):

```sql
ALTER TABLE kit_orders
  ADD COLUMN IF NOT EXISTS answers_history JSONB NOT NULL DEFAULT '[]'::jsonb;
```

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate.mjs
git commit -m "feat: add answers_history column for pre-mail answer edit audit trail"
```

---

### Task 3: `setKitOrderAnswers` in `lib/db/kitOrders.ts`

**Files:**
- Create: `lib/db/kitOrders.test.ts`
- Modify: `lib/db/kitOrders.ts`

**Interfaces:**
- Consumes: `FlowAnswers` (from `lib/flow/types.ts`), `getPool()` (from `lib/db/client.ts`, already imported at the top of `kitOrders.ts`).
- Produces: `setKitOrderAnswers(id: string, answers: FlowAnswers): Promise<void>`, consumed by the new route in Task 5.

This is the one write path in this feature worth a direct unit test (no other setter in this file has one) because the query itself does two things atomically (append old value to history, then overwrite) and that shape is worth pinning down explicitly — this touches the live letter a paying customer is about to mail.

- [ ] **Step 1: Write the failing test**

```ts
// lib/db/kitOrders.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });

vi.mock("@/lib/db/client", () => ({
  getPool: () => ({ query: queryMock }),
}));

import { setKitOrderAnswers } from "./kitOrders";
import { initialFlowAnswers } from "@/lib/flow/types";

beforeEach(() => {
  queryMock.mockClear();
});

describe("setKitOrderAnswers", () => {
  it("appends the prior answers to history and overwrites answers in one query", async () => {
    const newAnswers = { ...initialFlowAnswers, depositAmount: "2000" };
    await setKitOrderAnswers("o1", newAnswers);

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain("answers_history = answers_history ||");
    expect(sql).toContain("answers = $2");
    expect(sql).toContain("WHERE id = $1");
    expect(params[0]).toBe("o1");
    expect(JSON.parse(params[1])).toEqual(newAnswers);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/db/kitOrders.test.ts`
Expected: FAIL — `setKitOrderAnswers` is not exported yet.

- [ ] **Step 3: Add the function**

Add to `lib/db/kitOrders.ts`, near `setKitOrderLetterDetails` (needs a `FlowAnswers` import added to the file's existing import block):

```ts
import type { FlowAnswers } from "@/lib/flow/types";

// ...

/**
 * Overwrites the order's answers snapshot, first appending the prior value
 * onto answers_history with a timestamp. Postgres evaluates every SET
 * expression in an UPDATE against the pre-update row, so referencing
 * `answers` while also setting it in the same statement is safe: the
 * history append always captures the value being replaced, not the new one.
 */
export async function setKitOrderAnswers(id: string, answers: FlowAnswers): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `UPDATE kit_orders
     SET answers_history = answers_history || jsonb_build_array(
           jsonb_build_object('answers', answers, 'replaced_at', now())
         ),
         answers = $2
     WHERE id = $1`,
    [id, JSON.stringify(answers)]
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/db/kitOrders.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/kitOrders.ts lib/db/kitOrders.test.ts
git commit -m "feat: add setKitOrderAnswers with history-preserving overwrite"
```

---

### Task 4: Plain-English answers summary line

**Files:**
- Create: `lib/flow/summarize.ts`
- Create: `lib/flow/summarize.test.ts`

**Interfaces:**
- Produces: `summarizeFlowAnswers(a: FlowAnswers): string`, consumed by `KitSuccessClient.tsx` in Task 9 for the collapsed-summary view.

- [ ] **Step 1: Write the failing test**

```ts
// lib/flow/summarize.test.ts
import { describe, expect, it } from "vitest";
import { summarizeFlowAnswers } from "./summarize";
import { initialFlowAnswers, type FlowAnswers } from "./types";

const base: FlowAnswers = {
  ...initialFlowAnswers,
  depositAmount: "2000",
  monthlyRent: "1800",
  tenancyStartDate: "2023-06-01",
  moveOutDate: "2026-05-31",
  amountReturned: "0",
};

describe("summarizeFlowAnswers", () => {
  it("summarizes deposit, rent, and tenancy dates", () => {
    const summary = summarizeFlowAnswers(base);
    expect(summary).toContain("$2000");
    expect(summary).toContain("$1800/mo");
    expect(summary).toContain("06/01/2023");
    expect(summary).toContain("05/31/2026");
  });

  it("reports no deductions claimed when the list is empty", () => {
    expect(summarizeFlowAnswers(base)).toContain("no deductions claimed");
  });

  it("counts and totals deductions when present", () => {
    const withDeductions: FlowAnswers = {
      ...base,
      deductionsClaimed: [
        { description: "Carpet cleaning", amount: "150" },
        { description: "Wall patching", amount: "50" },
      ],
    };
    const summary = summarizeFlowAnswers(withDeductions);
    expect(summary).toContain("2 deductions claimed ($200)");
  });

  it("never uses an em dash or en dash", () => {
    const withDeductions: FlowAnswers = {
      ...base,
      deductionsClaimed: [{ description: "Carpet cleaning", amount: "150" }],
    };
    expect(summarizeFlowAnswers(withDeductions)).not.toMatch(/[–—]/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/flow/summarize.test.ts`
Expected: FAIL — `lib/flow/summarize.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// lib/flow/summarize.ts
import type { FlowAnswers } from "./types";

function formatDate(value: string): string {
  if (!value) return "not set";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

export function summarizeFlowAnswers(a: FlowAnswers): string {
  const deposit = a.depositAmount ? `$${a.depositAmount}` : "no deposit amount on file";
  const rent = a.monthlyRent ? `$${a.monthlyRent}/mo` : "no rent amount on file";
  const count = a.deductionsClaimed.length;
  const total = a.deductionsClaimed.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const deductionsText =
    count === 0
      ? "no deductions claimed"
      : `${count} deduction${count === 1 ? "" : "s"} claimed ($${total})`;

  return (
    `${deposit} deposit on ${rent} rent, tenancy ${formatDate(a.tenancyStartDate)} to ` +
    `${formatDate(a.moveOutDate)}. ${deductionsText}, $${a.amountReturned || "0"} returned.`
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/flow/summarize.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/flow/summarize.ts lib/flow/summarize.test.ts
git commit -m "feat: add plain-English summary of a buyer's flow answers"
```

---

### Task 5: New route `POST /api/kit/answers`

**Files:**
- Create: `app/api/kit/answers/route.ts`
- Create: `app/api/kit/answers/route.test.ts`

**Interfaces:**
- Consumes: `loadPaidOrder` (`lib/kit/orderAccess.ts`), `setKitOrderAnswers` (Task 3), `isCompleteFlowAnswers` (Task 1).
- Produces: `POST` handler returning `{ ok: true }` / `{ ok: false, error: string }`, consumed by `AnswersSummaryForm` in Task 8.

- [ ] **Step 1: Write the failing tests**

```ts
// app/api/kit/answers/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { KitOrder } from "@/lib/db/kitOrders";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

vi.mock("@/lib/db/kitOrders", () => ({
  getKitOrderBySessionId: vi.fn(),
  setKitOrderAnswers: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { getKitOrderBySessionId, setKitOrderAnswers } from "@/lib/db/kitOrders";

function order(overrides: Partial<KitOrder> = {}): KitOrder {
  return {
    id: "o1",
    email: null,
    answers: initialFlowAnswers,
    stripeSessionId: "cs_test_1",
    status: "fulfilled",
    src: null,
    letterDetails: null,
    mailStatus: "unsent",
    mailTracking: null,
    ...overrides,
  };
}

const validAnswers: FlowAnswers = {
  ...initialFlowAnswers,
  depositAmount: "2000",
  monthlyRent: "1800",
  tenancyStartDate: "2023-06-01",
  moveOutDate: "2026-05-31",
  tenancyEndConfirmed: true,
  receivedItemizedList: false,
  amountReturned: "0",
};

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/kit/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getKitOrderBySessionId).mockResolvedValue(order());
});

describe("POST /api/kit/answers", () => {
  it("saves valid answers on an unsent order", async () => {
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(200);
    expect(setKitOrderAnswers).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ depositAmount: "2000" })
    );
  });

  it("rejects an incomplete answers payload", async () => {
    const res = await POST(
      request({ sessionId: "cs_test_1", answers: { ...validAnswers, depositAmount: "" } })
    );
    expect(res.status).toBe(400);
    expect(setKitOrderAnswers).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload (wrong field type)", async () => {
    const res = await POST(
      request({ sessionId: "cs_test_1", answers: { ...validAnswers, depositAmount: 2000 } })
    );
    expect(res.status).toBe(400);
    expect(setKitOrderAnswers).not.toHaveBeenCalled();
  });

  it("refuses to edit once mailing has started", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ mailStatus: "sending" }));
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(409);
    expect(setKitOrderAnswers).not.toHaveBeenCalled();
  });

  it("refuses to edit once the letter has been sent", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ mailStatus: "sent" }));
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(409);
  });

  it("refuses when the order is not paid", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ status: "pending" }));
    const res = await POST(request({ sessionId: "cs_test_1", answers: validAnswers }));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/api/kit/answers/route.test.ts`
Expected: FAIL — `app/api/kit/answers/route.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// app/api/kit/answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { setKitOrderAnswers } from "@/lib/db/kitOrders";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { isCompleteFlowAnswers } from "@/lib/flow/validation";
import type { DeductionDraft, FlowAnswers } from "@/lib/flow/types";
import type { TriState } from "@/lib/statute/ma";

export const runtime = "nodejs";

const INVALID = Symbol("invalid");

function parseTriStateOrNull(value: unknown): TriState | null | typeof INVALID {
  if (value === null) return null;
  if (value === "yes" || value === "no" || value === "unknown") return value;
  return INVALID;
}

function parseDeductions(value: unknown): DeductionDraft[] | null {
  if (!Array.isArray(value)) return null;
  const rows: DeductionDraft[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    if (typeof r.description !== "string" || typeof r.amount !== "string") return null;
    rows.push({ description: r.description, amount: r.amount });
  }
  return rows;
}

function parseAnswers(value: unknown): FlowAnswers | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;

  if (typeof a.depositAmount !== "string") return null;
  if (typeof a.monthlyRent !== "string") return null;
  if (typeof a.tenancyStartDate !== "string") return null;
  if (typeof a.moveOutDate !== "string") return null;
  if (a.tenancyEndConfirmed !== null && typeof a.tenancyEndConfirmed !== "boolean") return null;
  if (typeof a.itemizedListDate !== "string") return null;
  if (a.receivedItemizedList !== null && typeof a.receivedItemizedList !== "boolean") return null;
  if (typeof a.amountReturned !== "string") return null;

  const receivedBankReceipt = parseTriStateOrNull(a.receivedBankReceipt);
  const receivedStatementOfCondition = parseTriStateOrNull(a.receivedStatementOfCondition);
  const listSwornUnderPenalty = parseTriStateOrNull(a.listSwornUnderPenalty);
  const interestPaidAnnually = parseTriStateOrNull(a.interestPaidAnnually);
  if (
    receivedBankReceipt === INVALID ||
    receivedStatementOfCondition === INVALID ||
    listSwornUnderPenalty === INVALID ||
    interestPaidAnnually === INVALID
  ) {
    return null;
  }

  const deductionsClaimed = parseDeductions(a.deductionsClaimed);
  if (!deductionsClaimed) return null;

  return {
    depositAmount: a.depositAmount,
    monthlyRent: a.monthlyRent,
    tenancyStartDate: a.tenancyStartDate,
    moveOutDate: a.moveOutDate,
    tenancyEndConfirmed: (a.tenancyEndConfirmed as boolean | null) ?? null,
    receivedBankReceipt: receivedBankReceipt as TriState | null,
    receivedStatementOfCondition: receivedStatementOfCondition as TriState | null,
    receivedItemizedList: (a.receivedItemizedList as boolean | null) ?? null,
    itemizedListDate: a.itemizedListDate,
    listSwornUnderPenalty: listSwornUnderPenalty as TriState | null,
    deductionsClaimed,
    amountReturned: a.amountReturned,
    interestPaidAnnually: interestPaidAnnually as TriState | null,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { sessionId, answers } = (body ?? {}) as { sessionId?: unknown; answers?: unknown };
  const access = await loadPaidOrder(typeof sessionId === "string" ? sessionId : null);
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  if (access.order.mailStatus !== "unsent") {
    return NextResponse.json({ ok: false, error: "locked_after_mailing" }, { status: 409 });
  }

  const parsed = parseAnswers(answers);
  if (!parsed || !isCompleteFlowAnswers(parsed)) {
    return NextResponse.json({ ok: false, error: "invalid_answers" }, { status: 400 });
  }

  await setKitOrderAnswers(access.order.id, parsed);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/api/kit/answers/route.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors (this file uses `Symbol` sentinel comparisons that TypeScript must narrow correctly — confirm before moving on).

- [ ] **Step 6: Commit**

```bash
git add app/api/kit/answers/route.ts app/api/kit/answers/route.test.ts
git commit -m "feat: add POST /api/kit/answers with mail-status lock and full validation"
```

---

### Task 6: Lock `letter-details` after mailing starts

**Files:**
- Modify: `app/api/kit/letter-details/route.ts`
- Modify: `app/api/kit/letter-details/route.test.ts`

**Interfaces:**
- No new exports; adds the same `access.order.mailStatus !== "unsent"` check used in Task 5.

- [ ] **Step 1: Write the failing test**

Add to `app/api/kit/letter-details/route.test.ts`, inside the existing `describe` block:

```ts
  it("refuses to edit once mailing has started", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ mailStatus: "sending" }));
    const res = await POST(request({ sessionId: "cs_test_1", details: validDetails }));
    expect(res.status).toBe(409);
    expect(setKitOrderLetterDetails).not.toHaveBeenCalled();
  });

  it("refuses to edit once the letter has been sent", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(order({ mailStatus: "sent" }));
    const res = await POST(request({ sessionId: "cs_test_1", details: validDetails }));
    expect(res.status).toBe(409);
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run app/api/kit/letter-details/route.test.ts`
Expected: the two new tests FAIL (still 200 today), existing tests still PASS.

- [ ] **Step 3: Add the lock check**

In `app/api/kit/letter-details/route.ts`, right after the `loadPaidOrder` access check and before `parseDetails`:

```ts
  if (access.order.mailStatus !== "unsent") {
    return NextResponse.json({ ok: false, error: "locked_after_mailing" }, { status: 409 });
  }
```

- [ ] **Step 4: Run tests to verify they all pass**

Run: `npx vitest run app/api/kit/letter-details/route.test.ts`
Expected: PASS (6 tests total)

- [ ] **Step 5: Commit**

```bash
git add app/api/kit/letter-details/route.ts app/api/kit/letter-details/route.test.ts
git commit -m "fix: lock letter-details editing once mailing has started"
```

---

### Task 7: Return `answers` from `GET /api/kit/order`

**Files:**
- Modify: `app/api/kit/order/route.ts`
- Modify: `app/api/kit/order/route.test.ts`

**Interfaces:**
- Produces: response body gains `answers: unknown` (the raw `KitOrder.answers` passthrough, same as `letterDetails`), consumed by `KitSuccessClient.tsx` in Task 9.

- [ ] **Step 1: Write the failing test**

Add to `app/api/kit/order/route.test.ts`:

```ts
  it("returns the order's answers snapshot", async () => {
    vi.mocked(getKitOrderBySessionId).mockResolvedValue(
      order({ status: "fulfilled", answers: { depositAmount: "2000" } })
    );

    const res = await GET(request());
    const json = (await res.json()) as { ok: boolean; answers: unknown };
    expect(json.answers).toEqual({ depositAmount: "2000" });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/kit/order/route.test.ts`
Expected: FAIL — `json.answers` is `undefined` today.

- [ ] **Step 3: Add the field**

In `app/api/kit/order/route.ts`, add `answers: order.answers,` to the returned JSON object:

```ts
  return NextResponse.json({
    ok: true,
    status,
    answers: order.answers,
    letterDetails: order.letterDetails,
    mailStatus: order.mailStatus,
    mailTracking: order.mailTracking,
  });
```

- [ ] **Step 4: Run tests to verify they all pass**

Run: `npx vitest run app/api/kit/order/route.test.ts`
Expected: PASS (4 tests total)

- [ ] **Step 5: Commit**

```bash
git add app/api/kit/order/route.ts app/api/kit/order/route.test.ts
git commit -m "feat: return the order's answers snapshot from GET /api/kit/order"
```

---

### Task 8: `AnswersSummaryForm` component

**Files:**
- Create: `components/kit/AnswersSummaryForm.tsx`

**Interfaces:**
- Consumes: `flowSteps` (`components/flow/steps.tsx`), `isCompleteFlowAnswers` (Task 1), `FlowAnswers` (`lib/flow/types.ts`).
- Produces: `AnswersSummaryForm({ sessionId, initial, onSaved })`, consumed by `KitSuccessClient.tsx` in Task 9.

No component test file — this codebase has no component-level test tooling installed (`components/kit/LetterDetailsForm.tsx`, the closest sibling, has none either); this component is verified in Task 10's manual end-to-end pass instead.

- [ ] **Step 1: Write the component**

```tsx
// components/kit/AnswersSummaryForm.tsx
"use client";

import { useState } from "react";
import type { FlowAnswers } from "@/lib/flow/types";
import { flowSteps } from "@/components/flow/steps";
import { isCompleteFlowAnswers } from "@/lib/flow/validation";

type Status = "idle" | "saving" | "error";

interface AnswersSummaryFormProps {
  sessionId: string;
  initial: FlowAnswers;
  onSaved: () => void;
}

export function AnswersSummaryForm({ sessionId, initial, onSaved }: AnswersSummaryFormProps) {
  const [answers, setAnswers] = useState<FlowAnswers>(initial);
  const [status, setStatus] = useState<Status>("idle");

  function update(patch: Partial<FlowAnswers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/kit/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("idle");
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  const valid = isCompleteFlowAnswers(answers);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {flowSteps.map((step) => (
        <div key={step.id}>
          <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {step.title}
          </p>
          {step.render(answers, update)}
        </div>
      ))}
      <button
        type="submit"
        disabled={status === "saving" || !valid}
        className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save changes"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">Could not save. Check the fields and try again.</p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/kit/AnswersSummaryForm.tsx
git commit -m "feat: add AnswersSummaryForm, reusing flowSteps field components"
```

---

### Task 9: Wire "Your answers" into `KitSuccessClient`

**Files:**
- Modify: `components/kit/KitSuccessClient.tsx`

**Interfaces:**
- Consumes: `AnswersSummaryForm` (Task 8), `summarizeFlowAnswers` (Task 4), `FlowAnswers` (`lib/flow/types.ts`), the `answers` field now returned by `/api/kit/order` (Task 7).

- [ ] **Step 1: Add imports and extend `OrderInfo`**

```tsx
import type { FlowAnswers } from "@/lib/flow/types";
import { summarizeFlowAnswers } from "@/lib/flow/summarize";
import { AnswersSummaryForm } from "./AnswersSummaryForm";
```

Extend the `OrderInfo` interface:

```tsx
interface OrderInfo {
  status: string;
  answers: FlowAnswers;
  letterDetails: LetterDetails | null;
  mailStatus: MailStatus;
  mailTracking: string | null;
}
```

- [ ] **Step 2: Populate `answers` in `refreshOrder`**

```tsx
      const info: OrderInfo = {
        status: data.status,
        answers: data.answers as FlowAnswers,
        letterDetails: data.letterDetails,
        mailStatus: data.mailStatus ?? "unsent",
        mailTracking: data.mailTracking,
      };
```

(The `data` type annotation two lines above, `({ ok: true } & OrderInfo) | { ok: false }`, already covers the new field since it's derived from `OrderInfo`.)

- [ ] **Step 3: Add `editingAnswers` state and a shared lock flag**

Near the existing `editingDetails` state:

```tsx
  const [editingAnswers, setEditingAnswers] = useState(false);
```

Just above the `details`/`showForm` lines in the render body:

```tsx
  const details = order?.letterDetails ?? null;
  const mailLocked = order?.mailStatus !== "unsent";
  const showForm = !mailLocked && (!details || editingDetails);
  const showAnswersForm = !mailLocked && editingAnswers;
```

- [ ] **Step 4: Gate the existing "Edit details" affordance on `mailLocked`**

Replace the `<button ... >Edit details</button>` block (inside the collapsed-details `else` branch) with:

```tsx
            {mailLocked ? (
              <p className="mt-2 text-xs text-gray-500">
                Your letter has already been mailed, so these details are locked and can no
                longer be edited. Contact support if something here was wrong.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                className="mt-2 text-sm font-medium text-accent hover:underline"
              >
                Edit details
              </button>
            )}
```

- [ ] **Step 5: Add the "Your answers" section and renumber existing steps**

Insert a new section immediately before the existing "Letter details" `<section>`, and bump the existing `StepHeading` numbers from `1, 2, 3` to `2, 3, 4`:

```tsx
      <section className="mb-10">
        <StepHeading number={1} title="Your answers" />
        {order && (
          showAnswersForm ? (
            <AnswersSummaryForm
              sessionId={sid}
              initial={order.answers}
              onSaved={() => {
                setEditingAnswers(false);
                void refreshOrder(sid);
                void refreshLetter(sid);
              }}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p>{summarizeFlowAnswers(order.answers)}</p>
              {mailLocked ? (
                <p className="mt-2 text-xs text-gray-500">
                  Your letter has already been mailed, so these answers are locked and can no
                  longer be edited. Contact support if something here was wrong.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingAnswers(true)}
                  className="mt-2 text-sm font-medium text-accent hover:underline"
                >
                  Edit answers
                </button>
              )}
            </div>
          )
        )}
      </section>

      <section className="mb-10">
        <StepHeading number={2} title="Letter details" />
        {/* rest of this section (the LetterDetailsForm / collapsed-details block from Step 4 above) is unchanged */}
      </section>
```

Do not add a new section for "Letter details" — this is the existing section, with its `<StepHeading number={1} title="Letter details" />` changed to `number={2}` in place. Below it, two more existing `StepHeading` calls need the same literal number bump and nothing else:
- `<StepHeading number={2} title="Review your letter" />` → `<StepHeading number={3} title="Review your letter" />`
- `<StepHeading number={3} title="Send it certified" />` → `<StepHeading number={4} title="Send it certified" />`

- [ ] **Step 6: Update the hero copy to match the new step count**

```tsx
        <p className="mt-2 text-sm text-white/90">
          Four steps: check your answers, fill in the details, review the letter, and have us
          mail it certified. Bookmark this page, it stays available.
        </p>
```

(Note: the existing copy used a semicolon before "it stays available" — replaced with a period/comma per the project's no-em/en-dash rule; semicolons are fine, this is an incidental style match to the sentence split, not a required change. Keep the semicolon if you prefer; either is compliant.)

- [ ] **Step 7: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add components/kit/KitSuccessClient.tsx
git commit -m "feat: add Your answers step to the kit workspace, lock both edit steps post-mail"
```

---

### Task 10: Manual end-to-end verification

This codebase has no component/browser test tooling, so this is the substitute for that coverage — required before merge because this is the exact page real paying customers use to trigger an irreversible certified mailing.

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated suite**

Run: `npm test && npm run type-check && npm run build`
Expected: all pass, zero type errors, build succeeds.

- [ ] **Step 2: Local walkthrough with Stripe test mode**

In one terminal: `npm run dev`. In another: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Complete the question flow with a deliberately wrong deposit amount, buy the kit with a Stripe test card, land on `/kit/success`.

- [ ] **Step 3: Confirm the new step appears and edits recalculate the letter**

Confirm "Your answers" appears as step 1 with the collapsed summary matching what was entered. Click "Edit answers," change the deposit amount, save. Confirm the collapsed summary updates and the "Review your letter" preview (step 3) reflects the corrected amount and recalculated demand math, without a page reload.

- [ ] **Step 4: Confirm the lock takes effect after mailing**

Fill in letter details (step 2), use a Lob test-mode key, click "mail it" (step 4). Reload the page. Confirm both "Your answers" and "Letter details" now show the locked copy with no edit button, and that hitting `POST /api/kit/answers` or `POST /api/kit/letter-details` directly (e.g. via `curl` with the same `sessionId`) returns `409`.

- [ ] **Step 5: Confirm graceful degradation is unaffected**

Skim `lib/db/kitOrders.ts` to confirm `setKitOrderAnswers` still follows the `if (!pool) return;` pattern (already covered by Task 3's implementation) — no action needed if Task 3 was followed as written, this is a final sanity check before sign-off.

- [ ] **Step 6: Report results to the user**

Summarize pass/fail for each step above. Do not merge to `main` until the user confirms Mary Kirnon's corrected letter has actually been mailed (her `kit_orders` row's `mail_status` is `sent`), per the rollout plan in the design spec — this feature's own correctness doesn't depend on her order, but deploying to `/kit/success` while she's plausibly still mid-session on it is the risk to avoid.
