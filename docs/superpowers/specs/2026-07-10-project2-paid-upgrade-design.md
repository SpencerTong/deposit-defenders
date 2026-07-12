# Project 2 — Paid-Product Upgrade (Design Spec)

**Date:** 2026-07-10
**Status:** Approved decisions from brainstorming; ready for implementation planning **after Project 1 ships and shows willingness-to-pay signal** (`clicked_kit` volume).
**Prereq reading:** `CLAUDE.md` (legal-safety rules — non-negotiable), `2026-07-08-ma-revenue-buildout-design.md` (the built system), and `2026-07-10-project1-landing-funnel-design.md` (the funnel this builds on).

## Handoff instructions (for the implementing model)

Product decisions are **settled** — don't re-brainstorm. But **one item requires genuine legal research before coding** (Chapter 93A — see §3). Proceed:
1. Do the 93A legal research first (§3) and **flag findings to the user** before finalizing any 93A letter text. Per `CLAUDE.md`: fetch current statute text, cross-check every citation/deadline/remedy, do not invent claims, flag discrepancies.
2. Use `superpowers:writing-plans` → `superpowers:executing-plans` (TDD, commit per task).
3. Verify: `npm test`, `npm run type-check`, `npm run build`, and drive the full paid flow end-to-end (Stripe test mode + Lob test key) before claiming done.
4. **Do not flip Stripe to live keys** as part of this project — that's a separate, explicit go-live step the user controls.

## Goal

Make the $49 kit clearly worth $49 by adding differentiated, hard-to-copy value that free alternatives (MassLegalHelp, mass.gov, generic templates) don't offer: a stronger legal package (Chapter 93A + §15B), done-for-you certified mailing, an editable letter, and a pre-filled small-claims form. This is what justifies charging real money — build it, verify it, then the user flips to live cards.

## Why this exists (market grounding)

Research (2026-07-10): the bare §15B demand letter is commoditized — MassLegalHelp publishes free MA-specific demand letter forms (Form 5/Form 6), mass.gov covers small claims free, and DoNotPay charges ~$18/mo as a subscription (and drew an FTC penalty for overselling). So the paid product must be **more than a letter**: the differentiators are (a) the 93A-strengthened legal package, (b) we mail it certified for you with a tracked return receipt (itself court evidence), (c) editable format, (d) a filled-in Statement of Small Claim. Against a potential multi-thousand-dollar, trebled recovery and a $150+ attorney consult, $49 for that is very defensible.

## Settled decisions

1. **Paid deliverables ($49, all included):**
   - The demand letter as a combined **§15B + Chapter 93A** 30-day demand (pending legal verification — see §3).
   - **We mail it certified with return receipt for you** via Lob — included, not an add-on.
   - **Editable letter** (`.docx`) download, plus PDF.
   - A **pre-filled Statement of Small Claim** (MA small-claims form) populated with the buyer's parties, amounts, and venue.
   - The existing evidence checklist + escalation timeline (already built in `lib/kit/content.ts`).
2. **Mailing UX:** after purchase, the buyer **reviews and edits** the letter and enters/confirms the **landlord's mailing address** and their own **name + return address**, sees a final preview, then clicks **"Mail it certified for me."** We call Lob (certified + return receipt), store and display the tracking number. Nothing is mailed silently.
3. **Addresses are collected post-purchase** (keeps the free flow short). The free question flow is unchanged; the new party/address fields live in the paid workspace.

## Architecture

### 1. Post-purchase "Your Kit" workspace

Replace the current static `/kit/success` "check your inbox" page (`components/kit/KitSuccessClient.tsx`) with an interactive workspace, keyed by the Stripe `session_id` (same token model as today — no accounts; `getKitOrderBySessionId` already exists). The workspace, once the order is `paid`/`fulfilled`:

1. **Collect letter details:** tenant full name + return address; landlord/property-manager name + mailing address; optional free-text tweaks. Persist to the order (see data model).
2. **Preview** the generated §15B+93A letter with the details filled in (no more `[placeholders]`).
3. **Edit:** allow inline edits to the letter body/fields before finalizing. (Simplest viable: editable form fields for parties/addresses + an editable textarea for any custom paragraph; full rich-text editing is out of scope — keep it to structured fields + optional note.)
4. **Downloads:** editable `.docx` + PDF of the letter; PDF of the kit (checklist/timeline/small-claims walkthrough, already built); the pre-filled Statement of Small Claim (PDF).
5. **"Mail it certified for me"** button → confirms the final letter + addresses → calls Lob → shows status + tracking number. Disabled after a successful send (store `mail_status`).

Security note (v1, acceptable): access is by `session_id` in the URL, matching the existing re-download approach. Document this; no accounts per `CLAUDE.md`.

### 2. Address & party collection
New TypeScript types for `LetterParty` are already partially present in `lib/letter/template.ts` (`tenantName`, `tenantAddress`, `landlordName`, `landlordAddress`, `propertyAddress`). Reuse them. Validate addresses minimally (non-empty, US-address shape); Lob will also validate/verify on send.

### 3. Chapter 93A demand letter (REQUIRES LEGAL RESEARCH FIRST)

**Research task (do before coding, flag findings to user):**
- Fetch and read M.G.L. c. 93A §9 (the consumer remedy) and the MA AG's 93A demand-letter regulations (940 CMR 3.00). Confirm: the required elements of a 93A demand letter (identify the claimant; reasonably describe the unfair/deceptive act or practice; the injury suffered), the mandatory **30-day** response window, and that a §15B security-deposit violation can constitute an unfair/deceptive practice actionable under 93A. Cross-check against `lib/statute/ma.ts` (which already correctly limits §15B(7) treble triggers to §15B(6)(a),(d),(e)).
- Decide, based on research: a **single combined §15B + 93A 30-day demand letter** (recommended — it's how MA practitioners typically frame it) vs. two letters. Verify the combined form is proper.
- **Flag any discrepancy or uncertainty to the user. Do not invent legal claims beyond what the statutes support** (CLAUDE.md).

**Implementation (after research):**
- New module `lib/statute/ch93a.ts` (or extend the letter layer) that, given `TenancyInputs` + the §15B `AnalysisResult`, produces the 93A demand elements (claimant, description of the deceptive practice tied to the specific §15B violations found, injury/amount, the 30-day demand). Pure, unit-tested. Keep `lib/statute/ma.ts` untouched — 93A is a layer on top.
- Extend `lib/letter/template.ts` (or a new `lib/letter/template-combined.ts`) to assemble the combined §15B + 93A demand letter from both. Keep the firm/factual tone, hedged language, citations, disclaimer.
- Update `lib/letter/pdf.tsx` (or add a renderer) for the combined letter. The paid webhook (`lib/kit/fulfill.ts`) and the workspace both use this combined letter.

### 4. Editable `.docx` generation
- New module `lib/letter/docx.ts` using the `docx` npm package (server-side, Node runtime). Given the combined letter content, produce a `.docx` buffer mirroring the PDF layout. New API route `app/api/kit/letter-docx?session_id=` streams it (gated on order `paid`/`fulfilled`, like `app/api/kit/download`).

### 5. Lob certified mailing
- New module `lib/mail/lob.ts`. Env: `LOB_API_KEY` (test + live). Graceful-degrade to a logged no-op when unset (matching the Resend/Stripe pattern). Function `mailCertifiedLetter({ to, from, pdfBytes | html }): Promise<{ id, trackingNumber, status } | null>` using Lob's Letters API with `extra_service: "certified"` and return-receipt. Confirm exact Lob options/pricing during implementation (~$8–10/letter all-in; well within $49).
- New API route `app/api/kit/mail` (POST, `session_id` + confirmed addresses): loads the order, verifies it's paid and not already mailed, renders the final letter PDF, calls Lob, stores `lob_id` / `mail_status` / `mail_tracking` / `mailed_at` on the order, returns status. Idempotent — refuse if already mailed.
- Optional (nice-to-have, not required for v1): a Lob tracking webhook to update delivery status; otherwise show the tracking number and let the buyer track via USPS.

### 6. Pre-filled Statement of Small Claim
- Research the current MA "Statement of Small Claim and Notice" form. Generate a filled PDF (via `pdf-lib` overlaying a form template, or `@react-pdf/renderer` reproducing the fields) populated with the buyer's parties, claim amount (the computed §15B exposure), and venue guidance. Keep fees/venue copy hedged ("confirm the current fee when you file"), consistent with `lib/kit/court-data.ts` (verified fee tiers already there).

## Data model

Extend `kit_orders` (migration in `scripts/migrate.mjs`, idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`):
- `letter_details JSONB` — tenant/landlord names + addresses + optional custom note collected post-purchase.
- `mail_status TEXT` — e.g. `unsent` (default) / `sent` / `failed`.
- `lob_id TEXT`, `mail_tracking TEXT`, `mailed_at TIMESTAMPTZ`.
Add corresponding functions in `lib/db/kitOrders.ts` (`setKitOrderLetterDetails`, `setKitOrderMailResult`, and include the new columns in the `KitOrder` type + `SELECT`s).

## Fulfillment interaction with existing webhook
The current webhook (`lib/kit/fulfill.ts`) emails letter+kit on purchase. Keep that as the immediate "you're in — finish your letter here" trigger, but the **letter it emails should become the combined §15B+93A letter**, and the email should point the buyer to the workspace URL (`/kit/success?session_id=...`) to add addresses, edit, download `.docx`, and mail. Update the email copy in `lib/email/resend.ts` accordingly. Mailing is never automatic (decision above).

## Prerequisites (user-owned)
- **Lob account + `LOB_API_KEY`** (test key for building/verifying; live key at go-live) added to `.env.local` and Vercel.
- **Legal review** of the 93A letter text and the combined demand before it ships to real buyers.
- The pending domain/Resend wiring (`deposit-defenders.com`) and, separately, the eventual **live Stripe** switch — both outside this project.
- `npm i docx` (and `pdf-lib` if used for the court form) — justify/confirm versions.

## Testing
- Unit: 93A element assembly, combined-letter assembly, `.docx` smoke (valid file, non-trivial size), court-form fill, `kit_orders` new state transitions, Lob mailing orchestration (mocked Lob client, incl. idempotency — never mail twice).
- Manual end-to-end (Stripe test + Lob test): buy → workspace → enter addresses → preview combined letter → download `.docx`/PDF/court form → "Mail it for me" → Lob test send returns tracking → order shows `mail_status=sent` and won't re-send.
- `npm test`, `npm run type-check`, `npm run build` green.

## Legal-safety (non-negotiable, from CLAUDE.md)
- Verify all 93A and §15B citations/deadlines/remedies against current statute text; flag discrepancies; invent nothing. Hedged language throughout ("may", "can expose"). Wear-and-tear flags stay informational. Disclaimer on every letter/PDF/page. The combined letter's 93A 30-day demand language must match the statutory requirement.

## Success criteria
A buyer can, after paying, produce a §15B+93A demand letter personalized with real party/address details, download it as editable `.docx` and PDF plus a pre-filled Statement of Small Claim, and have us mail it certified with a tracked return receipt — a package materially better than any free alternative. Once verified in test mode and legally reviewed, the user flips Stripe to live and charges real cards.
