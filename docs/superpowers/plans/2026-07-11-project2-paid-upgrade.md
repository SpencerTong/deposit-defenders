# Project 2: Paid-Product Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After paying $49, a buyer can personalize a combined §15B + Chapter 93A demand letter (or §15B-only when the landlord is owner-occupied), download it as PDF and editable .docx plus a pre-filled small-claims draft, and have it mailed certified via Lob with a stored tracking number.

**Architecture:** Pure legal/content modules first (93A elements, combined letter), then persistence (kit_orders columns), then delivery surfaces (docx, court form, Lob), then API routes, then the post-purchase workspace UI that ties them together. `lib/statute/ma.ts` is untouched; 93A is a layer on top. Access model stays session_id-in-URL (documented v1 tradeoff).

**Tech Stack:** Existing stack + `docx` npm package. Lob REST API via fetch (no SDK dependency). All Lob/db/email modules keep the graceful-degrade pattern.

## Global Constraints

- Legal text verified 2026-07-11 against malegislature.gov (93A §9) and 940 CMR 3.17(4) (Cornell LII): demand letter must identify claimant, reasonably describe the unfair/deceptive practice and injury, and give **30 days**; 3.17(4) makes §15B failures per se unfair practices, catch-all at (4)(k); double-treble for willful/knowing violation or bad-faith refusal, plus fees/costs (§9(3),(4)).
- **Owner-occupied branch (user-approved):** if the buyer says the landlord lives in the building, generate the §15B-only letter (10 business days), never 93A claims (Billings v. Wilson, 397 Mass. 614).
- Hedged language everywhere ("may", "can expose"). Disclaimer on every letter/PDF/page. No invented claims.
- No em/en dashes in any new copy or comments.
- Mailing is never automatic: only the explicit workspace button mails, exactly once (idempotent).
- Do not flip Stripe live. Push only to `revenue-buildout`.
- Env: `LOB_API_KEY` (test key in .env.local; graceful no-op when unset).

---

### Task 1: 93A demand elements module (TDD)

**Files:** Create `lib/statute/ch93a.ts`, `lib/statute/ch93a.test.ts`.

**Produces:**
```ts
export interface Ch93aDemand {
  practiceParagraph: string;   // ties triggered rules to 940 CMR 3.17(4) subsections
  remedyParagraph: string;     // 93A damages/fees, hedged
  responseDays: 30;
}
export function build93aDemand(
  analysis: AnalysisResult,
  opts: { ownerOccupied: boolean }
): Ch93aDemand | null;
```
Returns null when `ownerOccupied` or when no non-R5 rule triggered. Rule-to-regulation map: R1→3.17(4)(a), R2→3.17(4)(d), R3→3.17(4)(f), R4→3.17(4)(g), R6→3.17(4)(c), fallback 3.17(4)(k). Tests: null for owner-occupied; null for clean analysis; cites (4)(g) and (4)(d) for an R2+R4 analysis; paragraphs contain "30 days", "94A"?? no: "M.G.L. c. 93A", "940 CMR 3.17(4)", no "guaranteed"/"will win".

### Task 2: Combined demand letter + kit-content deadline consistency (TDD)

**Files:** Modify `lib/letter/template.ts` (add `buildCombinedDemandLetter`), `lib/letter/template.test.ts`; modify `lib/kit/content.ts` (+test) to accept `responseDays`/mode.

**Produces:**
```ts
export interface CombinedLetterOptions { ownerOccupied: boolean; today?: Date }
export function buildCombinedDemandLetter(
  tenancy: TenancyInputs, analysis: AnalysisResult, party: LetterParty, opts: CombinedLetterOptions
): DemandLetterContent;  // same shape, works with existing pdf renderer
```
Owner-occupied or no 93A demand → delegates to `buildDemandLetter` (10 business days). Otherwise: subject "Re: Demand under M.G.L. c. 93A and c. 186, §15B for {property}"; intro names both statutes; §15B violation paragraphs (reused); then `practiceParagraph` and `remedyParagraph` from Task 1; deadline paragraph demands payment **within 30 days** citing §9(3). `buildKitContent` gains `opts?: { responseDays?: { days: number; business: boolean } }` so the escalation timeline matches whichever letter the buyer gets (default stays 10 business days). Tests: combined letter contains both citations + 30 days; owner-occupied output identical to §15B letter; kit content timeline reflects 30 calendar days when passed.

### Task 3: kit_orders persistence for details + mailing (migration + db functions)

**Files:** Modify `scripts/migrate.mjs` (idempotent ADD COLUMN IF NOT EXISTS: `letter_details JSONB`, `mail_status TEXT NOT NULL DEFAULT 'unsent'`, `lob_id TEXT`, `mail_tracking TEXT`, `mailed_at TIMESTAMPTZ`), `lib/db/kitOrders.ts`.

**Produces (in `lib/db/kitOrders.ts`):**
```ts
export interface MailAddress { line1: string; line2?: string; city: string; state: string; zip: string }
export interface LetterDetails {
  tenantName: string; tenantAddress: MailAddress;
  landlordName: string; landlordAddress: MailAddress;
  ownerOccupied: boolean; customNote?: string;
}
export type MailStatus = "unsent" | "sending" | "sent";
// KitOrder gains: letterDetails: LetterDetails | null; mailStatus: MailStatus; mailTracking: string | null;
export function setKitOrderLetterDetails(id: string, details: LetterDetails): Promise<void>;
export function claimKitOrderForMailing(id: string): Promise<boolean>; // atomic unsent->sending
export function setKitOrderMailResult(id: string, r: { lobId: string; tracking: string | null }): Promise<void>; // -> sent
export function revertKitOrderMailToUnsent(id: string): Promise<void>;
```
All SELECTs include the new columns. Thin SQL wrappers follow the repo's no-unit-test/graceful-degrade db pattern; correctness is covered by the route tests (Task 6) via mocks and the live e2e (Task 9). Run `npm run db:migrate` (worked from this network this morning; if it times out, flag and continue, prod migration happens on deploy day).

### Task 4: Letter-from-order assembly + docx + letter/court-form/preview routes (TDD)

**Files:** Create `lib/letter/fromOrder.ts` (+test), `lib/letter/docx.ts` (+smoke test), `lib/court/smallClaim.ts` (+test), `lib/court/smallClaimPdf.tsx`, routes `app/api/kit/letter-pdf/route.ts`, `app/api/kit/letter-docx/route.ts`, `app/api/kit/court-form/route.ts`, extend `app/api/kit/order/route.ts` response. `npm i docx`.

**Produces:**
```ts
// lib/letter/fromOrder.ts: single source of truth for "the buyer's current letter"
export function buildLetterForOrder(order: KitOrder, today?: Date): DemandLetterContent;
// uses order.answers + order.letterDetails (party + ownerOccupied); placeholders when details missing
export function formatAddress(a: MailAddress): string;
// lib/letter/docx.ts
export function renderDemandLetterDocx(letter: DemandLetterContent): Promise<Buffer>;
// lib/court/smallClaim.ts
export function buildSmallClaimDraft(order-ish inputs): SmallClaimDraft; // plaintiff, defendant, amount, claim description listing violations, venue + fee guidance (hedged), disclaimer, "draft" framing
```
Routes gate on order found + status fulfilled (paid also acceptable for preview) like `app/api/kit/download`. `/api/kit/order` GET now returns `{ ok, status, letterDetails, mailStatus, mailTracking }`. Tests: fromOrder uses details when present and placeholders when not and respects ownerOccupied; docx buffer starts with PK and > 2 kB; small-claim draft includes amount, violations, hedged fee line, draft disclaimer.

### Task 5: Lob certified mail module (TDD, mocked fetch)

**Files:** Create `lib/mail/lob.ts`, `lib/mail/lob.test.ts`.

**Produces:**
```ts
export interface MailLetterInput {
  description: string;
  to: { name: string; address: MailAddress };
  from: { name: string; address: MailAddress };
  pdf: Buffer;
}
export function mailCertifiedLetter(input: MailLetterInput): Promise<{ id: string; trackingNumber: string | null } | null>;
```
POST `https://api.lob.com/v1/letters`, basic auth `LOB_API_KEY:`, multipart form: to/from address fields, `file` (PDF), `color=false`, `address_placement=insert_blank_page`, `extra_service=certified`, `mail_type=usps_first_class`, `use_type=operational`. Returns Lob `id` + `tracking_number`. Null + log when key unset, null on non-2xx (log body). Tests stub `global.fetch`: unset key → null, no fetch; happy path → correct auth header + fields, parsed result; 422 → null.

### Task 6: letter-details and mail API routes (TDD, mocked modules)

**Files:** Create `app/api/kit/letter-details/route.ts` (+test), `app/api/kit/mail/route.ts` (+test).

- `POST /api/kit/letter-details` `{ sessionId, details }`: validate (non-empty names/line1/city, 2-letter state, 5-digit zip, ownerOccupied boolean), order exists + paid/fulfilled → `setKitOrderLetterDetails`. 400 on bad input, 404/403 as appropriate.
- `POST /api/kit/mail` `{ sessionId }`: order exists + fulfilled + letterDetails present + `claimKitOrderForMailing` true (else 409 `already_mailed`/`mailing`); render `buildLetterForOrder` PDF → `mailCertifiedLetter`; success → `setKitOrderMailResult`, return `{ ok, tracking }`; Lob failure → `revertKitOrderMailToUnsent`, 502. Tests (vi.mock db + lob + pdf): refuses without details; refuses when claim fails (never calls Lob twice); success stores result; failure reverts.

### Task 7: Post-purchase workspace UI

**Files:** Rewrite `components/kit/KitSuccessClient.tsx` (+ small subcomponents if useful: `components/kit/LetterDetailsForm.tsx`, `components/kit/MailPanel.tsx`).

States: checking → unconfirmed/paid (unchanged waiting copy) → fulfilled workspace:
1. Details form (tenant name + address, landlord name + address, "Does your landlord live in the building?" yes/no with a one-line explanation, optional note) pre-filled from `letterDetails`; save → POST letter-details → refresh order.
2. Letter preview: fetch `GET /api/kit/letter-preview?session_id=` (add tiny route returning `buildLetterForOrder` JSON) and render the letter body.
3. Downloads: letter PDF, editable .docx, Dispute Kit PDF (existing), Statement of Small Claim draft PDF.
4. Mail panel: address recap + confirm checkbox → "Mail it certified for me" → POST /api/kit/mail → success shows tracking number; `mailStatus=sent` renders tracking state instead of button.
Copy dash-free, disclaimer present, no outcome promises. Type-check + build.

### Task 8: Fulfillment email points to the workspace

**Files:** Modify `lib/email/resend.ts` (sendKitEmail gains `workspaceUrl`), `lib/kit/fulfill.ts` (passes `SITE_URL/kit/success?session_id=`), `lib/kit/fulfill.test.ts`.
Email copy: attachments unchanged (§15B letter + kit are the instant deliverables), plus "Finish your letter online: add your addresses, strengthen it under Chapter 93A where it applies, download an editable copy, and have us mail it certified" linking to the workspace. fulfill needs the order's stripeSessionId (already on KitOrder). Update tests.

### Task 9: Verification + push

- `npm test`, `npm run type-check`, `npm run build` green.
- `npm run db:migrate` against Supabase (from this network).
- Headless e2e without Stripe: insert a fulfilled test order via a scratch script (answers snapshot + fake `session_id`), drive `/kit/success?session_id=...` with Playwright: fill details (owner-occupied No), save, letter preview shows 93A + 30 days, download endpoints return PDF/PK bytes, click mail with confirm → real Lob **test-mode** send returns id + tracking → reload shows sent + tracking → second mail attempt refused (409). Also owner-occupied Yes path previews §15B-only letter.
- Existing funnel drive still passes. Push to `revenue-buildout`.
- Update HANDOFF (Project 2 built; remaining: legal review of 93A text, domain, Stripe live) and memory.
