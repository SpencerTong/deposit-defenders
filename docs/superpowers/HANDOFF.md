# HANDOFF — read this first

**Updated:** 2026-07-10

Orientation for a fresh session picking up Deposit Defenders (MA security-deposit demand-letter tool). Read `CLAUDE.md` first (legal-safety rules are non-negotiable), then this file.

## Where things stand

- **Branch:** `revenue-buildout` (PR #1 open against `main`, **not merged**). Do new work from this branch.
- **Deployed:** live at `https://deposit-defenders.vercel.app`, running **Stripe TEST mode** (no real charges). Vercel Production has all required env vars: both Postgres URLs, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (currently the temporary `onboarding@resend.dev`), `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (test webhook already created and pointed at the prod URL).
- **Verified working end-to-end on Vercel** (test mode): question flow → analysis → email letter → `/kit` → Stripe test checkout → webhook fulfillment → kit email → `kit_orders` row flips to `fulfilled`.
- **Domain:** `deposit-defenders.com` is **purchased but not yet wired** to Vercel or verified in Resend.

## The v1 system (already built)

See `docs/superpowers/specs/2026-07-08-ma-revenue-buildout-design.md` and its plan. Summary: §15B rules engine (`lib/statute/ma.ts`), demand-letter + kit PDF generation, Stripe-webhook-driven automated $49 kit fulfillment (idempotent), 8 SEO guide articles with schema, `npm run funnel` report.

## Next work, in order

1. **Project 1 — Landing redesign + funnel restructure.** Spec: `docs/superpowers/specs/2026-07-10-project1-landing-funnel-design.md`. Frontend-only, low risk, ships first. Makes the analysis the free hook, moves the letter behind the paywall, adds a compelling landing page with real cited stats. Purpose: start validation traffic and measure the `clicked_kit` willingness-to-pay signal.
2. **Project 2 — Paid-product upgrade.** Spec: `docs/superpowers/specs/2026-07-10-project2-paid-upgrade-design.md`. Build **after** Project 1 shows `clicked_kit` signal. Adds the Chapter 93A + §15B combined letter, Lob certified mailing, editable `.docx`, pre-filled Statement of Small Claim, and a post-purchase review/edit workspace. **Has a legal-research gate** (verify 93A against statute and flag to user before writing any 93A text) and **needs a Lob API key** from the user. Then the user flips Stripe to live.

Each spec has a "Handoff instructions" block. Use `superpowers:writing-plans` → `superpowers:executing-plans`, TDD, commit per task, and verify (`npm test`, `npm run type-check`, `npm run build`, plus driving the flow in a browser).

## Outstanding infra (independent of the two projects; do whenever)

- **Wire the domain:** add `deposit-defenders.com` to the Vercel project (set DNS at registrar), verify it in Resend (DNS records), then set `RESEND_FROM_EMAIL=letters@deposit-defenders.com` and `NEXT_PUBLIC_SITE_URL=https://deposit-defenders.com` in Vercel and remove the `onboarding@resend.dev` override. This is what lets **any** customer receive email (right now only the Resend-account owner's address does).
- **Go live on payments (later, explicit):** swap Stripe to live keys + create a live webhook endpoint at `https://<domain>/api/webhooks/stripe` (event `checkout.session.completed`). Only after Project 2 is built and the 93A text is legally reviewed.

## Local dev gotchas

- Run `npm run dev` and `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in **your own terminals** — a dev server started by the assistant dies when the session pauses.
- **Postgres (Supabase) is blocked on the user's local network** — `npm run db:migrate` / `npm run funnel` and local checkout time out. Use a different network (mobile hotspot) or run against Vercel. See the memory note `postgres-blocked-on-local-network`.
- The `kit_orders` table (incl. migrations) already exists in the production Supabase DB.
