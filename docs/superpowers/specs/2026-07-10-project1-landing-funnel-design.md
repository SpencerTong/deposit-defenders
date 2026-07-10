# Project 1 — Landing Redesign + Funnel Restructure (Design Spec)

**Date:** 2026-07-10
**Status:** Approved decisions from brainstorming; ready for implementation planning.
**Prereq reading:** `CLAUDE.md` (legal-safety rules are non-negotiable), and the two earlier specs in this folder (`2026-07-08-ma-revenue-buildout-design.md` for the built system).

## Handoff instructions (for the implementing model)

The product decisions below are **settled** — do not re-brainstorm them. Proceed:
1. Use `superpowers:writing-plans` to turn this spec into a bite-sized implementation plan.
2. Use `superpowers:executing-plans` (or subagent-driven-development) to build it, TDD, committing per task.
3. Verify with `npm test`, `npm run type-check`, `npm run build`, and drive the funnel in a browser before claiming done.
4. Work on a feature branch; the repo's default is `main`, current work branch is `revenue-buildout` (PR #1 open). Branch from `revenue-buildout` (it has the built system) unless it has merged to `main` by then.

## Current state (as of 2026-07-10)

- The full v1 system is built and **deployed to Vercel production** at `https://deposit-defenders.vercel.app`, running Stripe in **test mode** (no real charges). Env vars for Postgres, Resend, Stripe (test), and the Stripe webhook are set in Vercel Production.
- Domain `deposit-defenders.com` is **purchased but not yet wired** to Vercel/Resend.
- Current funnel: `/` (landing) → question flow → `/letter/preview` (shows analysis + **email-gated free letter** via `LetterGate`) → `/kit` (offer) → Stripe → `/kit/success` (webhook emails letter+kit PDFs).
- Key files: `app/page.tsx`, `components/flow/QuestionFlow.tsx`, `app/letter/preview/page.tsx`, `components/letter/LetterPreviewClient.tsx`, `components/letter/LetterGate.tsx`, `components/analysis/AnalysisResult.tsx`, `app/api/leads/route.ts`, `app/kit/page.tsx`, `components/kit/BuyKitButton.tsx`, `lib/statute/ma.ts`, `lib/events.ts`, `lib/db/leads.ts`.

## Goal

Make the landing page genuinely compelling and restructure the funnel so the **analysis is the free hook and the letter becomes paid**, while still capturing leads. This ships first (frontend-only, low risk) to start driving validation traffic and — critically — to measure the `clicked_kit` willingness-to-pay signal **before** investing in Project 2's paid-product build.

## Settled decisions

1. **Free vs. paid split:** FREE = the analysis ("you may be owed $X" + violations), shown **ungated**. PAID ($49) = the demand letter and everything else (Project 2 fills this out). In Project 1, the paid button still delivers the *current* letter+kit (already built) — no paid-flow changes here.
2. **Analysis presentation:** shown free and ungated (maximizes screenshot/share hook), with (a) a prominent `$49` CTA and (b) an **optional** "email me my results" capture for remarketing. Not gated.
3. **Landing page:** redesigned with real, cited stats and "here's what we do / here's the one thing you do" framing.

## Scope of Project 1

### 1. Landing page redesign (`app/page.tsx`)

Keep the existing behavior (client component; `trackEvent("landed")` on mount; "Check my deposit — it's free" starts the `QuestionFlow`). Replace the thin hero with a fuller, mobile-first page. Sections, in order:

- **Hero:** headline + subhead + the free CTA + "2 minutes, no account." Headline should name the pain and the outcome (e.g., "Your landlord kept your deposit? Massachusetts law may owe you triple.").
- **Stat band** (real, cited — do NOT invent numbers; these are verified from a Rent.com survey of 1,000 U.S. renters, 2023):
  - 26% of renters have lost a security deposit.
  - Only 41% expect to get their full deposit back.
  - 36% who lost it got no explanation from the landlord.
  - Pair with the MA-law counter: "Massachusetts law (M.G.L. c. 186 §15B) can make a landlord who breaks the rules pay **up to 3× the deposit** plus court costs and attorney's fees."
  - Cite the survey source in small print (link to rent.com survey or footnote "Source: Rent.com renter survey").
- **How it works (3 steps, the "we do X, you do Y" clarity):**
  1. Answer ~6 questions about your deposit (2 minutes).
  2. See instantly what the law says you may be owed — free.
  3. For $49, we write your formal demand letter and (Project 2: strengthen it under Chapter 93A and mail it certified for you). *In Project 1, phrase step 3 as only what's currently delivered — "we generate your ready-to-send demand letter and small-claims kit." Do not promise mailing or 93A until Project 2 ships.*
- **Trust/seriousness:** brief, government-adjacent tone; the persistent disclaimer in the footer (already global). No outcome-promising language ("may", "can expose", per CLAUDE.md).
- **Keep it fast:** no heavy client libs. Static/SSR-friendly; the interactive flow only mounts after "start."

Design language per `CLAUDE.md`: mobile-first, clean, one accent color, plain typography, no startup gradients. Tailwind, matching existing components.

### 2. Funnel restructure: analysis free, letter paid

- **`/letter/preview` (via `components/letter/LetterPreviewClient.tsx`):** keep showing the analysis (`AnalysisResult`). **Remove the free letter** from this page — delete/replace the `LetterGate` letter-unlock behavior. Below the analysis, render:
  - The **$49 CTA** → routes to `/kit` (fire `clicked_kit` via `trackEvent`, as `BuyKitButton` already does; the CTA here can link to `/kit`).
  - An **optional email-capture** ("Email me my results and next steps") that posts to `/api/leads` and shows a soft confirmation. This is optional — visitors can proceed to `/kit` without it.
- **`/api/leads` (`app/api/leads/route.ts`):** currently generates and emails the **free letter PDF**. Change it to **not** generate or email the letter. Instead: record the lead (email + `src` + answers + computed `depositAmount`/`rulesFired`, as it already does via `recordLead`) and, optionally, send a lightweight **results email** (their potential claim amount + the $49 link) — NOT the letter. Keep the graceful-degrade pattern. The letter-generation imports (`buildDemandLetter`, `renderDemandLetterPdf`, `sendLetterEmail`) are no longer used here (they remain used by the paid webhook `lib/kit/fulfill.ts` — do not remove those modules).
- **`components/letter/LetterGate.tsx`:** repurpose or retire. The blur-to-unlock-letter mechanic is gone. If keeping a component for the optional email capture, simplify it to just the email field + submit + confirmation (no letter reveal).

### 3. Analytics
Funnel events already exist (`landed`, `started`, `completed_questions`, `viewed_analysis`, `submitted_email`, `clicked_kit`, `purchased`). Ensure the restructured pages still fire them correctly — especially `viewed_analysis` on the analysis page and `clicked_kit` on the $49 CTA. Add nothing new; the existing `scripts/funnel-report.mjs` then measures the willingness-to-pay signal.

## Out of scope for Project 1 (goes in Project 2)
93A letter, Lob mailing, editable `.docx`, pre-filled court forms, the post-purchase review/edit workspace, moving to live Stripe. The paid button in Project 1 keeps delivering the existing letter+kit.

## Data model
No schema changes. `leads` and `kit_orders` tables unchanged.

## Testing
- Update/relocate any tests that assumed the free letter (e.g., `LetterGate` behavior). The rules engine and letter/kit builder tests are untouched.
- Manual: complete the flow, confirm the analysis shows free, the email capture records a lead (check DB or logs), and the $49 CTA fires `clicked_kit` and reaches `/kit`.
- `npm test`, `npm run type-check`, `npm run build` all green.

## Legal-safety (non-negotiable, from CLAUDE.md)
- Persistent disclaimer stays. No outcome-promising language. Stats must be real and cited. The wear-and-tear flags (if surfaced) stay labeled informational.

## Success criteria
The restructured funnel is live; the free analysis is ungated and shareable; leads are captured optionally; and `clicked_kit` is measurable per `src` via `npm run funnel`. This produces the willingness-to-pay signal that gates whether to build Project 2.
