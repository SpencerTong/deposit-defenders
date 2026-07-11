# Copy & Conversion Punch-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove AI tells from all user-facing copy, humanize the stat band, sell the $49 kit (including certified mailing) everywhere, and add a free-vs-paid comparison card to the analysis page.

**Architecture:** Copy-only changes plus one new presentational component (`KitComparisonCard`). No API, event, or schema changes. Tests asserting exact strings are updated in the same task as the string change.

**Tech Stack:** Existing Next.js 14 + Tailwind + Vitest setup.

## Global Constraints

- No em dashes (—) or en dashes (–) anywhere in `app/`, `components/`, `lib/` after this work (code, comments, and copy). Hyphens are fine.
- Legal safety: disclaimer persists; "may/can expose" language; stats accurate to the Rent.com survey (26% / 41% / 36%); wear-and-tear flags stay informational.
- Mailing claims ("we send it certified for you") ARE allowed on marketing surfaces (settled launch decision: no production release before Project 2). The kit PDF content (`lib/kit/content.ts`) stays truthful to current self-mail fulfillment.
- No Chapter 93A claims anywhere yet.
- Push only to `revenue-buildout`. Do NOT merge PR #1.

---

### Task 1: Comparison card on the analysis page

**Files:**
- Create: `components/letter/KitComparisonCard.tsx`
- Modify: `components/letter/LetterPreviewClient.tsx` (replace the CTA box)
- Modify: `components/letter/ResultsEmailCapture.tsx` (copy pass)

**Interfaces:** `KitComparisonCard({ onCtaClick }: { onCtaClick: () => void })` renders the two-column checklist + $49 Link to `/kit`; `onCtaClick` fires `clicked_kit` from the parent.

Rows (label, free?, paid?):
1. "Violation analysis under M.G.L. c. 186 §15B" ✓ ✓
2. "What you may be owed, in dollars" ✓ ✓
3. "Formal demand letter citing your exact violations" – ✓
4. "Sent to your landlord by certified mail, for you" – ✓
5. "Small claims filing plan with your numbers filled in" – ✓
6. "Evidence checklist and deadline tracker" – ✓

CTA button text: "Get my letter written and sent, $49". Steps: build component, swap into `LetterPreviewClient` (keep `trackEvent("clicked_kit")`), sweep `ResultsEmailCapture` copy, `npm run type-check && npm run build`, commit.

### Task 2: Landing page copy pass

**Files:** Modify `app/page.tsx`.

- Hero subhead loses the em dashes; plain sentences.
- Stats become: value "1 in 4" label "renters has lost a security deposit to their landlord"; value "Most" label "renters do not expect to get their full deposit back"; value "1 in 3" label "renters who lost a deposit never got an explanation". Citation line stays.
- Step 3 title: "For $49, we write your demand letter and send it certified mail"; detail: "A formal letter citing your exact violations, sent to your landlord by certified mail for you, plus a small claims plan with your numbers if they still do not pay."
- Section heading and remaining copy sweep for dashes/AI phrasing.
- `npm run type-check && npm run build`, commit.

### Task 3: Kit page, emails, letter template, kit content, metadata

**Files:** Modify `app/kit/page.tsx`, `lib/email/results.ts` (+`lib/email/results.test.ts`), `lib/email/resend.ts`, `lib/letter/template.ts` (+ its test if asserting the subject), `lib/kit/content.ts` (+ its test if asserting headings), `app/layout.tsx`.

- Kit hero: "For $49, we write your formal demand letter citing each violation, send it to your landlord by certified mail for you, and give you the complete plan for small claims court if they still do not pay." Certified-mail section reframed from instructions to "we handle the mailing; here is what you get as proof". Small-claims and evidence sections keep substance, dash-swept.
- `layout.tsx` metadata title: "Deposit Defenders: Massachusetts Security Deposit Help" (template `%s | Deposit Defenders`).
- Results email: sell letter + mailing + plan; keep disclaimer and accurate "may" language; update `results.test.ts` expectations (it asserts a curly-apostrophe string).
- `template.ts` subject: `Re: Security deposit demand for ${propertyAddress}`.
- `content.ts`: "Step 1 — " → "Step 1: " etc.; in-paragraph dashes to commas/periods.
- Run `npm test` (fix string assertions), type-check, commit.

### Task 4: Guide articles + comment sweep + acceptance grep

**Files:** Modify `lib/guide/articles.ts`, `app/guide/page.tsx`, `app/guide/[slug]/opengraph-image.tsx`, `app/api/checkout/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/leads/route.ts`, `lib/payments/stripe.ts`, `lib/site.ts` and any stragglers.

- Replace every em/en dash with sentence restructure, comma, colon, or period (never a robotic find-replace to hyphen in prose).
- Acceptance: `grep -rn "—\|–" app components lib --include="*.ts" --include="*.tsx"` → empty.
- `npm test && npm run type-check && npm run build`, commit.

### Task 5: Guardrail, verification, push

- HANDOFF.md: add "DO NOT merge PR #1 / deploy to production until Project 2 certified mailing is live; marketing copy promises mailing" and mark the punch-up done.
- Update scratchpad drive script assertions (step-3 copy changed; comparison card checks) and re-drive the funnel headless: all checks pass.
- `npm test && npm run type-check && npm run build` green. Commit, push to `revenue-buildout`.
