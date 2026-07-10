# Project 1 — Landing Redesign + Funnel Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the analysis the free ungated hook, move the letter behind the $49 paywall, and redesign the landing page with real cited stats — so `clicked_kit` becomes a measurable willingness-to-pay signal.

**Architecture:** Frontend-only restructure of the existing Next.js 14 App Router app. A new pure email-content module (`lib/email/results.ts`) is unit-tested; the `/api/leads` route swaps letter-PDF generation for a lightweight results email and gets a route test with mocked db/email modules; `LetterGate` is deleted and replaced by an optional `ResultsEmailCapture` plus a `$49` CTA on the preview page; `app/page.tsx` gets the full landing redesign.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Vitest (node environment, no jsdom/RTL — component work is verified by type-check/build/browser), Resend, Postgres via `lib/db` (graceful degrade when unconfigured).

## Global Constraints

- Legal safety (CLAUDE.md, non-negotiable): no outcome-promising language — use "may", "can expose the landlord to", "commonly contestable". Persistent disclaimer stays. Wear-and-tear flags stay labeled informational.
- Stats must be real and cited verbatim from the spec (Rent.com survey of 1,000 U.S. renters, 2023): 26% of renters have lost a security deposit; only 41% expect to get their full deposit back; 36% who lost it got no explanation. Do NOT invent numbers or a deep URL — cite as small-print text "Source: Rent.com renter survey (1,000 U.S. renters, 2023)".
- Step-3 / paid copy must promise only what ships today: "we generate your ready-to-send demand letter and small-claims kit." No mailing, no 93A (those are Project 2).
- No new funnel events, no schema changes. Existing events: `landed`, `started`, `completed_questions`, `viewed_analysis`, `submitted_email`, `clicked_kit`, `purchased`.
- Do not remove `buildDemandLetter`, `renderDemandLetterPdf`, or `sendLetterEmail` modules — the paid webhook (`lib/kit/fulfill.ts`) still uses them. Only the `/api/leads` route stops using them.
- Keep the graceful-degrade pattern: db/email helpers log and return instead of throwing when `POSTGRES_URL` / `RESEND_API_KEY` are unset.
- Design language: mobile-first, one accent color (`accent` in Tailwind config), plain typography, no gradients, no heavy client libs on the landing page.
- Branch: work on `revenue-buildout` (already checked out). Commit per task.
- Local gotcha: Postgres is blocked on this network — `npm run db:migrate`/`npm run funnel` time out. Local verification relies on the graceful-degrade console logs, not DB rows.

---

### Task 1: Results email content + sender

The `/api/leads` route will stop emailing the letter PDF and instead send a lightweight "your results" email (potential claim + $49 link). This task builds the tested pure content builder and the thin Resend sender.

**Files:**
- Create: `lib/email/results.ts`
- Create: `lib/email/results.test.ts`
- Modify: `lib/email/resend.ts` (append `sendResultsEmail`)

**Interfaces:**
- Consumes: `SITE_URL` from `@/lib/site` (existing).
- Produces:
  - `buildResultsEmail(input: { maxExposure: number; violationCount: number }): { subject: string; html: string }` in `lib/email/results.ts`
  - `sendResultsEmail(input: { to: string; maxExposure: number; violationCount: number }): Promise<{ sent: boolean }>` in `lib/email/resend.ts` — Task 2's route calls this.

- [ ] **Step 1: Write the failing test**

Create `lib/email/results.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildResultsEmail } from "./results";

describe("buildResultsEmail", () => {
  it("includes the formatted potential claim and violation count when violations were found", () => {
    const { subject, html } = buildResultsEmail({ maxExposure: 7200, violationCount: 3 });
    expect(subject).toContain("$7,200");
    expect(html).toContain("$7,200");
    expect(html).toContain("3 potential violation");
  });

  it("links to the kit page", () => {
    const { html } = buildResultsEmail({ maxExposure: 7200, violationCount: 3 });
    expect(html).toContain("/kit");
  });

  it("uses non-promising language and includes the disclaimer", () => {
    const { subject, html } = buildResultsEmail({ maxExposure: 7200, violationCount: 3 });
    const combined = (subject + html).toLowerCase();
    expect(combined).not.toContain("guaranteed");
    expect(combined).not.toContain("you will win");
    expect(html).toContain("not legal advice");
  });

  it("handles the no-violation case without claiming money is owed", () => {
    const { subject, html } = buildResultsEmail({ maxExposure: 0, violationCount: 0 });
    expect(subject).not.toContain("$");
    expect(html).toContain("didn’t find a clear violation");
    expect(html).toContain("not legal advice");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/email/results.test.ts`
Expected: FAIL — cannot resolve `./results` (module doesn't exist).

- [ ] **Step 3: Write minimal implementation**

Create `lib/email/results.ts`:

```ts
import { SITE_URL } from "@/lib/site";

export interface ResultsEmailInput {
  maxExposure: number;
  violationCount: number;
}

export interface ResultsEmailContent {
  subject: string;
  html: string;
}

const DISCLAIMER =
  "<p style=\"color:#6b7280;font-size:13px\">This tool provides general legal information, " +
  "not legal advice, and does not create an attorney-client relationship. For advice about " +
  "your situation, consult a licensed Massachusetts attorney.</p>";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * The lightweight "your results" email sent on lead capture: the potential
 * claim + the $49 kit link. Deliberately NOT the demand letter — the letter
 * is part of the paid kit.
 */
export function buildResultsEmail(input: ResultsEmailInput): ResultsEmailContent {
  const kitUrl = `${SITE_URL}/kit`;

  if (input.violationCount === 0) {
    return {
      subject: "Your Massachusetts security deposit analysis",
      html:
        "<p>Based on your answers, we didn’t find a clear violation of the Massachusetts " +
        "security deposit law (M.G.L. c. 186 §15B). You may still want to review your " +
        "paperwork carefully.</p>" +
        DISCLAIMER,
    };
  }

  const amount = formatCurrency(input.maxExposure);
  const violations =
    input.violationCount === 1
      ? "1 potential violation"
      : `${input.violationCount} potential violations`;

  return {
    subject: `Your deposit analysis: up to ${amount} may be owed`,
    html:
      `<p>Based on your answers, your landlord’s handling of your security deposit shows ` +
      `<strong>${violations}</strong> of the Massachusetts security deposit law ` +
      `(M.G.L. c. 186 §15B), which may entitle you to <strong>up to ${amount}</strong> ` +
      `including treble damages where the law provides for them.</p>` +
      `<p>When you’re ready to act, we can generate your ready-to-send formal demand ` +
      `letter and small-claims kit for $49:</p>` +
      `<p><a href="${kitUrl}">Get my demand letter and dispute kit — $49</a></p>` +
      DISCLAIMER,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/email/results.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the sender to `lib/email/resend.ts`**

Append to the end of `lib/email/resend.ts` (thin wrapper over the tested builder, same graceful-degrade contract as the existing senders):

```ts
export interface SendResultsEmailInput {
  to: string;
  maxExposure: number;
  violationCount: number;
}

/**
 * Emails the lightweight analysis results (no letter attached — the letter is
 * paid). Same graceful-degradation contract as sendLetterEmail.
 */
export async function sendResultsEmail(
  input: SendResultsEmailInput
): Promise<{ sent: boolean }> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not configured, would send results email to ${input.to}`);
    return { sent: false };
  }

  const content = buildResultsEmail({
    maxExposure: input.maxExposure,
    violationCount: input.violationCount,
  });

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: input.to,
    subject: content.subject,
    html: content.html,
  });

  if (error) {
    console.error("[email] failed to send results email", error);
    return { sent: false };
  }
  return { sent: true };
}
```

And add the import at the top of `lib/email/resend.ts`:

```ts
import { buildResultsEmail } from "./results";
```

- [ ] **Step 6: Run full test suite + type-check**

Run: `npm test && npm run type-check`
Expected: all tests PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add lib/email/results.ts lib/email/results.test.ts lib/email/resend.ts
git commit -m "feat: results email (analysis summary + kit link) replacing free-letter email content"
```

---

### Task 2: `/api/leads` stops emailing the letter, sends results email instead

**Files:**
- Modify: `app/api/leads/route.ts`
- Test: `app/api/leads/route.test.ts` (create)

**Interfaces:**
- Consumes: `sendResultsEmail({ to, maxExposure, violationCount })` from Task 1; existing `recordLead` (`lib/db/leads.ts`), `analyzeTenancy` (`lib/statute/ma.ts`), `toTenancyInputs` (`lib/flow/toTenancyInputs.ts`).
- Produces: `POST /api/leads` accepting `{ email, src, answers }` returning `{ ok: true, sent: boolean }` — the request contract is unchanged, so Task 3's `ResultsEmailCapture` posts the same body `LetterGate` did.

- [ ] **Step 1: Write the failing test**

Create `app/api/leads/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { initialFlowAnswers, type FlowAnswers } from "@/lib/flow/types";

vi.mock("@/lib/db/leads", () => ({
  recordLead: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/email/resend", () => ({
  sendResultsEmail: vi.fn().mockResolvedValue({ sent: true }),
  sendLetterEmail: vi.fn().mockResolvedValue({ sent: true }),
  sendKitEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

import { POST } from "./route";
import { recordLead } from "@/lib/db/leads";
import { sendResultsEmail, sendLetterEmail } from "@/lib/email/resend";

// Answers with a clear R2 violation (no escrow bank receipt, nothing returned)
// so the analysis produces triggered rules and a nonzero exposure.
function answers(overrides: Partial<FlowAnswers> = {}): FlowAnswers {
  return {
    ...initialFlowAnswers,
    depositAmount: "1500",
    monthlyRent: "1500",
    tenancyStartDate: "2023-01-01",
    moveOutDate: "2024-01-01",
    tenancyEndConfirmed: true,
    receivedBankReceipt: "no",
    receivedStatementOfCondition: "yes",
    receivedItemizedList: true,
    itemizedListDate: "2024-01-10",
    listSwornUnderPenalty: "yes",
    deductionsClaimed: [],
    amountReturned: "0",
    interestPaidAnnually: "yes",
    ...overrides,
  };
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/leads", () => {
  it("rejects an invalid email", async () => {
    const res = await POST(request({ email: "not-an-email", answers: answers() }));
    expect(res.status).toBe(400);
    expect(recordLead).not.toHaveBeenCalled();
  });

  it("rejects missing answers", async () => {
    const res = await POST(request({ email: "renter@example.com" }));
    expect(res.status).toBe(400);
  });

  it("records the lead with computed deposit amount and fired rules", async () => {
    const res = await POST(
      request({ email: "renter@example.com", src: "reddit", answers: answers() })
    );
    expect(res.status).toBe(200);
    expect(recordLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "renter@example.com",
        src: "reddit",
        depositAmount: 1500,
        rulesFired: expect.arrayContaining(["R2_NO_ESCROW_RECEIPT"]),
      })
    );
  });

  it("sends the results email, not the letter", async () => {
    const res = await POST(request({ email: "renter@example.com", answers: answers() }));
    const json = (await res.json()) as { ok: boolean; sent: boolean };
    expect(json).toEqual({ ok: true, sent: true });
    expect(sendResultsEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "renter@example.com",
        violationCount: expect.any(Number),
        maxExposure: expect.any(Number),
      })
    );
    const call = vi.mocked(sendResultsEmail).mock.calls[0][0];
    expect(call.maxExposure).toBeGreaterThan(0);
    expect(call.violationCount).toBeGreaterThan(0);
    expect(sendLetterEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/leads/route.test.ts`
Expected: FAIL — the route module doesn't export/use `sendResultsEmail` yet; the mock's `sendResultsEmail` is never called and the route still imports `renderDemandLetterPdf` (the "sends the results email, not the letter" test fails; the PDF render may also error because `sendLetterEmail` is mocked but `renderDemandLetterPdf` is not — failures here are expected, any failure is fine).

- [ ] **Step 3: Rewrite the route**

Replace the full contents of `app/api/leads/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { sendResultsEmail } from "@/lib/email/resend";
import { recordLead } from "@/lib/db/leads";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { email, src, answers } = (body ?? {}) as {
    email?: unknown;
    src?: unknown;
    answers?: unknown;
  };

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });
  }

  const tenancy = toTenancyInputs(answers as FlowAnswers);
  const analysis = analyzeTenancy(tenancy);

  const resolvedSrc = typeof src === "string" ? src : null;
  const rulesFired = analysis.rules.filter((rule) => rule.triggered).map((rule) => rule.id);
  const violationCount = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
  ).length;

  await recordLead({
    email,
    src: resolvedSrc,
    depositAmount: tenancy.depositAmount,
    rulesFired,
  });
  const { sent } = await sendResultsEmail({
    to: email,
    maxExposure: analysis.exposure.maxExposure,
    violationCount,
  });

  return NextResponse.json({ ok: true, sent });
}
```

Notes: `violationCount` excludes `R5_WEAR_AND_TEAR_FLAGS` to match how `AnalysisResult.tsx` counts violations on screen (R5 is an informational flag, not a violation). The `runtime = "nodejs"` export stays (the route still touches `pg` via `recordLead`). The letter imports (`buildDemandLetter`, `renderDemandLetterPdf`, `sendLetterEmail`) are gone from this route but their modules remain — `lib/kit/fulfill.ts` still uses them.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/leads/route.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run full suite + type-check**

Run: `npm test && npm run type-check`
Expected: all PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/leads/route.ts app/api/leads/route.test.ts
git commit -m "feat: /api/leads records lead + sends results email instead of free letter PDF"
```

---

### Task 3: Preview page — analysis free/ungated, $49 CTA, optional email capture

**Files:**
- Create: `components/letter/ResultsEmailCapture.tsx`
- Modify: `components/letter/LetterPreviewClient.tsx`
- Delete: `components/letter/LetterGate.tsx`

**Interfaces:**
- Consumes: `POST /api/leads` with `{ email, src, answers }` (Task 2, contract unchanged); `trackEvent` from `@/lib/events` (`submitted_email`, `clicked_kit`); `ATTRIBUTION_STORAGE_KEY` from `@/lib/attribution`; `AnalysisResult` component (unchanged).
- Produces: `ResultsEmailCapture({ answers }: { answers: FlowAnswers })` client component. No other task depends on these files.

- [ ] **Step 1: Create `components/letter/ResultsEmailCapture.tsx`**

Optional capture — no gating, no letter reveal. Full contents:

```tsx
"use client";

import { useState } from "react";
import type { FlowAnswers } from "@/lib/flow/types";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution";
import { trackEvent } from "@/lib/events";

type SubmitStatus = "idle" | "submitting" | "sent" | "error";

export function ResultsEmailCapture({ answers }: { answers: FlowAnswers }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const src = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, src, answers }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
      trackEvent("submitted_email");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="font-medium text-gray-900">Results sent to {email}</p>
        <p className="mt-1 text-sm text-gray-600">
          Check your inbox for your analysis summary and next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
      <p className="mb-1 font-medium text-gray-900">Email me my results</p>
      <p className="mb-4 text-sm text-gray-600">
        Optional — get your analysis summary and next steps in your inbox.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="lead-email" className="sr-only">
          Email address
        </label>
        <input
          id="lead-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {status === "submitting" && (
            <svg
              className="h-4 w-4 animate-spin text-accent"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {status === "submitting" ? "Sending…" : "Email me my results"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
```

Note the secondary (outline) button styling — the $49 CTA above it is the primary action; the capture is deliberately visually subordinate.

- [ ] **Step 2: Rewrite `components/letter/LetterPreviewClient.tsx`**

Replace the full contents with (letter building removed; CTA fires `clicked_kit` then links to `/kit` — this measured click is the willingness-to-pay signal):

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { analyzeTenancy, type AnalysisResult as RulesAnalysis } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import type { FlowAnswers } from "@/lib/flow/types";
import { trackEvent } from "@/lib/events";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { ResultsEmailCapture } from "@/components/letter/ResultsEmailCapture";

export function LetterPreviewClient() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<RulesAnalysis | null>(null);
  const [answers, setAnswers] = useState<FlowAnswers | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(FLOW_ANSWERS_STORAGE_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }

    const parsedAnswers = JSON.parse(raw) as FlowAnswers;
    const result = analyzeTenancy(toTenancyInputs(parsedAnswers));
    setAnswers(parsedAnswers);
    setAnalysis(result);
    trackEvent("viewed_analysis", {
      maxExposure: result.exposure.maxExposure,
      violationCount: result.rules.filter((rule) => rule.triggered).length,
    });
  }, [router]);

  if (!analysis || !answers) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center text-gray-500">
        Loading your analysis…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <AnalysisResult analysis={analysis} />

      <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <p className="mb-1 font-medium text-gray-900">Ready to demand what you may be owed?</p>
        <p className="mb-4 text-sm text-gray-600">
          For $49, we generate your ready-to-send formal demand letter — citing each issue
          above with the exact Massachusetts statute — plus a small-claims kit with certified
          mail instructions, an evidence checklist, and a deadline tracker.
        </p>
        <Link
          href="/kit"
          onClick={() => trackEvent("clicked_kit")}
          className="inline-block w-full rounded-lg bg-accent px-6 py-4 text-center text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark sm:w-auto sm:px-10"
        >
          Get my demand letter — $49
        </Link>
      </div>

      <ResultsEmailCapture answers={answers} />
    </main>
  );
}
```

- [ ] **Step 3: Delete the letter gate**

```bash
git rm components/letter/LetterGate.tsx
```

- [ ] **Step 4: Verify nothing still references LetterGate, then type-check + test + build**

Run: `grep -rn "LetterGate" app components lib --include="*.ts" --include="*.tsx"`
Expected: no output.

Run: `npm test && npm run type-check && npm run build`
Expected: all PASS, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/letter/ResultsEmailCapture.tsx components/letter/LetterPreviewClient.tsx
git commit -m "feat: analysis page shows free ungated results with $49 CTA; letter gate removed"
```

(The `git rm` from Step 3 is already staged.)

---

### Task 4: Landing page redesign

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `QuestionFlow`, `trackEvent`/`getOrPersistAttributionSrc`, `FLOW_ANSWERS_STORAGE_KEY`, `FlowAnswers` — all existing, behavior unchanged (`landed` on mount, `started` on CTA click, `completed_questions` → `/letter/preview`).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Rewrite `app/page.tsx`**

Replace the full contents with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrPersistAttributionSrc, trackEvent } from "@/lib/events";
import { QuestionFlow } from "@/components/flow/QuestionFlow";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import type { FlowAnswers } from "@/lib/flow/types";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-3xl font-bold text-accent">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
}

function HowStep({ number, title, detail }: { number: number; title: string; detail: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-600">{detail}</p>
      </div>
    </li>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    getOrPersistAttributionSrc(window.location.search);
    trackEvent("landed");
  }, []);

  function handleStart() {
    setStarted(true);
    trackEvent("started");
  }

  function handleComplete(answers: FlowAnswers) {
    trackEvent("completed_questions");
    window.sessionStorage.setItem(FLOW_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
    router.push("/letter/preview");
  }

  if (started) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center px-6 py-10">
        <QuestionFlow onComplete={handleComplete} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <section className="text-center">
        <h1 className="mb-4 text-3xl font-serif font-bold leading-tight text-gray-900 sm:text-4xl">
          Your landlord kept your deposit? Massachusetts law may owe you triple.
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Answer six quick questions about your security deposit. See instantly — and free —
          what Massachusetts law says you may be owed.
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark sm:w-auto sm:px-10"
        >
          Check my deposit — it&apos;s free
        </button>
        <p className="mt-4 text-sm text-gray-600">Takes about 2 minutes. No account needed.</p>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
          Losing your deposit is common. Letting it go is optional.
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat value="26%" label="of renters have lost a security deposit" />
          <Stat value="41%" label="is all who expect to get their full deposit back" />
          <Stat value="36%" label="who lost one got no explanation from the landlord" />
        </div>
        <div className="mt-4 rounded-lg border-l-4 border-accent bg-gray-50 p-4">
          <p className="text-gray-800">
            Massachusetts law (M.G.L. c. 186 &sect;15B) can make a landlord who breaks the rules
            pay <strong>up to 3&times; the deposit</strong> plus court costs and attorney&apos;s
            fees.
          </p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Source: Rent.com renter survey (1,000 U.S. renters, 2023).
        </p>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-center text-lg font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-5">
          <HowStep
            number={1}
            title="Answer ~6 questions about your deposit"
            detail="Takes about 2 minutes. No account, no documents needed to start."
          />
          <HowStep
            number={2}
            title="See what the law says you may be owed — free"
            detail="An instant analysis of your situation under the Massachusetts security deposit law, with each potential violation cited to the statute."
          />
          <HowStep
            number={3}
            title="For $49, we generate your ready-to-send demand letter and small-claims kit"
            detail="A formal demand letter citing your specific violations, plus certified-mail instructions, an evidence checklist, and a deadline tracker."
          />
        </ol>
      </section>

      <section className="mt-14 text-center">
        <button
          type="button"
          onClick={handleStart}
          className="w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark sm:w-auto sm:px-10"
        >
          Check my deposit — it&apos;s free
        </button>
      </section>
    </main>
  );
}
```

Copy rules honored: stats verbatim from the spec with the Rent.com citation; the 3× line is the exact MA-law counter phrasing; step 3 promises only the current deliverable; "may be owed" language throughout; no gradients or new dependencies.

- [ ] **Step 2: Type-check + build**

Run: `npm run type-check && npm run build`
Expected: no errors; `/` still builds as a static/client page with no new dependencies.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: landing redesign — pain/outcome hero, cited stat band, how-it-works"
```

---

### Task 5: Full verification — suite + drive the funnel in a browser

**Files:** none created; verification only.

**Interfaces:**
- Consumes: everything above.
- Produces: evidence the funnel works end-to-end before claiming done.

- [ ] **Step 1: Full automated checks**

Run: `npm test && npm run type-check && npm run build`
Expected: all tests PASS, no type errors, production build succeeds.

- [ ] **Step 2: Start the dev server**

Run (background): `npm run dev`
Wait for "Ready" on `http://localhost:3000`.

Note: Postgres and Resend are not reachable/configured locally — the db/email layers degrade to console logs. Verification reads those logs instead of DB rows.

- [ ] **Step 3: Drive the funnel**

Using a browser (or the `run`/browser tooling available), on `http://localhost:3000/?src=verify`:

1. Landing: hero headline, stat band (26% / 41% / 36% + 3× law card + Rent.com citation), how-it-works render; no letter promised for free anywhere.
2. Click "Check my deposit — it's free" → question flow starts.
3. Complete the flow with a violation scenario (deposit 2000, rent 2000, tenancy 2023-01-01 → 2024-01-01, ended confirmed, bank receipt "no", itemized list no, amount returned 0) → lands on `/letter/preview`.
4. Analysis shows **ungated** — claim card + violations visible with no blur/email wall.
5. The "$49" CTA is present; clicking navigates to `/kit` and the dev-server log for `/api/events` shows a `clicked_kit` event (or observe the POST in the browser network tab).
6. Back on the preview page, submit the optional email capture with `test@example.com` → soft confirmation renders, dev-server log shows `[leads] POSTGRES_URL not configured, logging only:` with the lead payload and `[email] RESEND_API_KEY not configured, would send results email to test@example.com`.
7. `/kit` still renders with the working `BuyKitButton` (checkout itself needs Stripe + network; out of local scope).

Expected: all seven observations hold. If any fail, fix before proceeding (superpowers:systematic-debugging).

- [ ] **Step 4: Stop the dev server**

Kill the background dev process.

- [ ] **Step 5: Commit any verification fixes**

If Step 3 required fixes, commit them:

```bash
git add -A
git commit -m "fix: funnel verification fixes"
```

Otherwise nothing to commit.

---

## Spec-coverage checklist (self-review)

- Landing redesign with hero, cited stat band, how-it-works, trust/disclaimer, fast/no-libs → Task 4.
- Analysis free + ungated on `/letter/preview`, letter removed → Task 3.
- $49 CTA firing `clicked_kit` → Task 3 Step 2.
- Optional email capture posting to `/api/leads` with soft confirmation → Task 3 Step 1.
- `/api/leads` records lead, sends lightweight results email (not the letter), graceful degrade → Tasks 1–2.
- `LetterGate` retired → Task 3 Step 3.
- Letter/PDF modules preserved for the paid webhook → Global Constraints + Task 2 note.
- Analytics events unchanged and still firing (`viewed_analysis`, `submitted_email`, `clicked_kit`) → Tasks 3–5.
- Tests updated (none referenced LetterGate; new tests for results email + leads route) → Tasks 1–2.
- `npm test`, type-check, build green + browser drive → Task 5.
- Legal safety: disclaimer persists (global footer + AnalysisResult), "may" language, real cited stats → Global Constraints, enforced in Task 1 tests and Task 4 copy.
