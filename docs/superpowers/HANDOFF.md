# HANDOFF: read this first

**Updated:** 2026-07-14

Orientation for a fresh session picking up Deposit Defenders. Read `CLAUDE.md` first (legal-safety rules are non-negotiable), then this file.

## The one-paragraph summary

**Deposit Defenders is a live business.** `https://deposit-defenders.com` charges real cards ($49 via live Stripe), emails customers from the verified domain (`letters@deposit-defenders.com` via Resend), and physically mails demand letters by USPS Certified Mail (live Lob). The build phase is complete; the current phase is **marketing and validation**. Do not rebuild things; drive traffic, measure, and iterate on conversion.

## Where things stand (2026-07-14)

- **Branch:** `main` is the only branch; everything is merged (PRs #1 through #6). Work on feature branches off `main`; the user merges PRs themselves (permission rules require it).
- **Live and proven by a real dollar test:** the owner bought the kit with a real card; the live webhook fulfilled instantly; the kit email arrived from the domain; the workspace produced the combined letter; a real certified letter was dispatched via Lob with a live USPS tracking number. (Envelope arrival pending as of this writing; $49 refunded via Stripe dashboard.)
- **The product:** free ungated §15B analysis (the hook) → $49 kit: combined §15B + Chapter 93A demand letter (30-day window; §15B-only when the landlord is owner-occupied, per Billings v. Wilson), post-purchase workspace at `/kit/success?session_id=` (details form, letter preview, PDF/.docx/kit/small-claim-draft downloads, one-click certified mailing with tracking emailed to the buyer), 8 SEO guide articles, `/faq` with FAQPage schema, `/terms`.
- **Env (all in Vercel Production):** live `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (live endpoint at `deposit-defenders.com/api/webhooks/stripe`, event `checkout.session.completed`), live `LOB_API_KEY` (Lob account has a payment card; required for live sends), `RESEND_API_KEY` + `RESEND_FROM_EMAIL="Deposit Defenders <letters@deposit-defenders.com>"`, `NEXT_PUBLIC_SITE_URL=https://deposit-defenders.com`, Supabase Postgres URLs. DNS lives at Squarespace (site A record + Resend DKIM/SPF, all verified).
- **Deliberately deferred by the owner:** attorney review of the combined letter text (accepted risk; plan is to buy a flat-fee review out of early revenue) and forming an LLC (MA fee is $500/yr). The mitigations shipped instead: disclaimers everywhere, `/terms`, hedged language, pre-mail acknowledgment, verified statute citations.

## Current phase: marketing and validation

The engineering is done. Next steps, in priority order:

1. **Seed traffic with source tags.** Reddit first (r/boston, r/massachusetts, r/CambridgeMA, r/somerville; check each sub's self-promo rules; answering real "landlord kept my deposit" threads helpfully beats cold posts). TikTok second (screen-record the flow to the "up to $X" analysis card). Every link gets `?src=` (`?src=reddit`, `?src=tiktok`, etc.).
2. **Measure with `npm run funnel`** (events: landed → started → completed_questions → viewed_analysis → submitted_email → clicked_kit → purchased, segmented by `src`). The willingness-to-pay signal is `clicked_kit` → `purchased`.
3. **Iterate on conversion, not features.** Copy tweaks, stat presentation, CTA wording; small PRs. Resist feature work until the funnel data demands it.
4. **Support:** buyers reply to the kit/tracking emails, which go to the Resend-account owner's inbox. The DB is the admin panel (read `kit_orders` directly).

Known candidate features if data or customers ask: editing letter paragraphs in the workspace before mailing (today: structured fields + custom-note paragraph; free-form edits only via the .docx download, which the mail-for-you path does not use), and a Lob delivery-status webhook (today: buyers track via USPS).

## Engineering conventions (when code work does come up)

- `superpowers:writing-plans` → `superpowers:executing-plans`, TDD, commit per task, verify with `npm test`, `npm run type-check`, `npm run build`, and drive the affected flow headless (Playwright + system Chrome; see scratchpad scripts pattern).
- Invariants to never break: a physical letter can never send twice (atomic mail claim, 409 on retry); the workspace opens on payment, never gated on email delivery; email/webhook failures degrade gracefully and Stripe retries fulfillment; no em dashes or outcome-promising language in any user-facing copy.

## Local dev gotchas

- Run `npm run dev` and `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in **your own terminals**; a dev server started by the assistant dies when the session pauses.
- **Postgres (Supabase) is intermittently blocked on the user's local network**: `npm run db:migrate` / `npm run funnel` may time out (it worked on 2026-07-12 and was blocked again on 2026-07-14). Use a hotspot, or verify through the production API/Vercel logs instead.
- Stripe CLI may need `stripe login` re-auth for live-mode reads.
- Favicon changes cache hard in browsers; test in a private window.
