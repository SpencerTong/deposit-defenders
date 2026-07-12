# HANDOFF — read this first

**Updated:** 2026-07-11

> **DO NOT MERGE PR #1 TO `main` (production) until Project 2's certified mailing is live.** The marketing copy on `revenue-buildout` now promises "we send your letter by certified mail for you" (settled launch decision 2026-07-11: no customer release before Project 2). Shipping this copy without working mailing would be false advertising. The kit PDF content (`lib/kit/content.ts`) intentionally still describes self-mailing because it is the delivered product for any test purchases.

Orientation for a fresh session picking up Deposit Defenders (MA security-deposit demand-letter tool). Read `CLAUDE.md` first (legal-safety rules are non-negotiable), then this file.

## Where things stand

- **Branch:** `revenue-buildout` (PR #1 open against `main`, **not merged**). Do new work from this branch.
- **Deployed:** live at `https://deposit-defenders.vercel.app`, running **Stripe TEST mode** (no real charges). Vercel Production has all required env vars: both Postgres URLs, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (currently the temporary `onboarding@resend.dev`), `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (test webhook already created and pointed at the prod URL).
- **Verified working end-to-end on Vercel** (test mode): question flow → analysis → email letter → `/kit` → Stripe test checkout → webhook fulfillment → kit email → `kit_orders` row flips to `fulfilled`.
- **Domain:** `deposit-defenders.com` is **purchased but not yet wired** to Vercel or verified in Resend.

## The v1 system (already built)

See `docs/superpowers/specs/2026-07-08-ma-revenue-buildout-design.md` and its plan. Summary: §15B rules engine (`lib/statute/ma.ts`), demand-letter + kit PDF generation, Stripe-webhook-driven automated $49 kit fulfillment (idempotent), 8 SEO guide articles with schema, `npm run funnel` report.

## Next work, in order

1. **Project 1 — Landing redesign + funnel restructure. ✅ DONE (2026-07-10, pushed to PR #1).** Spec: `docs/superpowers/specs/2026-07-10-project1-landing-funnel-design.md`; plan: `docs/superpowers/plans/2026-07-10-project1-landing-funnel.md`. Analysis is now free/ungated with a $49 CTA (fires `clicked_kit`), the letter is paid-only, `/api/leads` sends a lightweight results email instead of the letter PDF, and the landing page has the cited stat band. Verified end-to-end via headless Chrome (all funnel events fire with `src` attribution). Remaining: drive validation traffic and watch `npm run funnel` for the `clicked_kit` signal.
2. **Project 2 — Paid-product upgrade. ✅ BUILT (2026-07-11, pushed to PR #1).** Spec: `docs/superpowers/specs/2026-07-10-project2-paid-upgrade-design.md`; plan: `docs/superpowers/plans/2026-07-11-project2-paid-upgrade.md`. The 93A legal-research gate passed (93A §9 + 940 CMR 3.17(4) verified against primary sources; owner-occupied landlords get the §15B-only letter per Billings v. Wilson, user-approved). Built: combined §15B+93A letter (30-day window), post-purchase workspace at `/kit/success` (details form incl. owner-occupied question, letter preview, PDF/.docx/kit/small-claim-draft downloads, idempotent "Mail it certified" via Lob), `kit_orders` mailing columns (migrated in prod Supabase), fulfillment email links the workspace. Verified end-to-end headless incl. a real Lob **test-mode** certified send with tracking. Remaining before go-live: user's legal review of the 93A/combined letter text, domain wiring, `LOB_API_KEY` (test) + live key in Vercel, then Stripe live keys + live webhook.

Each spec has a "Handoff instructions" block. Use `superpowers:writing-plans` → `superpowers:executing-plans`, TDD, commit per task, and verify (`npm test`, `npm run type-check`, `npm run build`, plus driving the flow in a browser).

## Outstanding infra (independent of the two projects; do whenever)

- **Wire the domain:** add `deposit-defenders.com` to the Vercel project (set DNS at registrar), verify it in Resend (DNS records), then set `RESEND_FROM_EMAIL=letters@deposit-defenders.com` and `NEXT_PUBLIC_SITE_URL=https://deposit-defenders.com` in Vercel and remove the `onboarding@resend.dev` override. This is what lets **any** customer receive email (right now only the Resend-account owner's address does).
- **Go live on payments (later, explicit):** swap Stripe to live keys + create a live webhook endpoint at `https://<domain>/api/webhooks/stripe` (event `checkout.session.completed`). Only after Project 2 is built and the 93A text is legally reviewed.

## Local dev gotchas

- Run `npm run dev` and `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in **your own terminals** — a dev server started by the assistant dies when the session pauses.
- **Postgres (Supabase) is blocked on the user's local network** — `npm run db:migrate` / `npm run funnel` and local checkout time out. Use a different network (mobile hotspot) or run against Vercel. See the memory note `postgres-blocked-on-local-network`.
- The `kit_orders` table (incl. migrations) already exists in the production Supabase DB.
