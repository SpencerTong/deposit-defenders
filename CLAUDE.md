# Project: Deposit Defenders — MA Security Deposit Demand Letters

## What this is

A **live, revenue-generating product** at `https://deposit-defenders.com`. Massachusetts renters answer ~6 questions, see a free ungated analysis of their leverage under M.G.L. c. 186 §15B, and can buy a $49 Dispute Kit: a personalized demand letter combining §15B and Chapter 93A (30-day statutory window), delivered instantly by email plus a post-purchase workspace where they add addresses, preview and download the letter (PDF + editable .docx) and a pre-filled small-claims draft, and have us mail the letter by USPS Certified Mail with return receipt (Lob), with the tracking number shown and emailed.

**Current phase: marketing and validation, not building.** Read `docs/superpowers/HANDOFF.md` for exact status and next steps before doing anything. Prefer conversion iteration over new features.

## Success criteria (what the code must enable measuring)

1. Visitor → completed analysis conversion, by traffic source (`?src=` attribution)
2. Analysis → `clicked_kit` → `purchased` conversion (the willingness-to-pay signal)
3. `npm run funnel` reports all of this from the `events` table

## Stack (as deployed)

- Next.js 14 (App Router), TypeScript, Tailwind CSS, deployed on Vercel; domain DNS at Squarespace
- PDF generation: @react-pdf/renderer; editable letters via the `docx` package
- Email: Resend from the verified domain (`letters@deposit-defenders.com`)
- Data: Supabase Postgres (`leads`, `events`, `kit_orders`); no ORM, `pg` directly; the DB is the admin panel
- Payments: **live** Stripe Checkout ($49 one-time) + `checkout.session.completed` webhook at `deposit-defenders.com/api/webhooks/stripe`
- Physical mail: **live** Lob Letters API, USPS Certified Mail with electronic return receipt
- Analytics: Vercel Analytics + custom funnel events (landed, started, completed_questions, viewed_analysis, submitted_email, clicked_kit, purchased) with `?src=` attribution

## Architecture

- `/` — landing (hero, cited stat band, how-it-works) + question flow
- `/letter/preview` — free ungated analysis + free-vs-paid comparison card + optional email capture
- `/kit` — the $49 offer page → Stripe Checkout
- `/kit/success?session_id=` — the post-purchase workspace (details form incl. owner-occupied question, letter preview, downloads, certified mailing). Access is by session id in the URL (no accounts, documented tradeoff); the workspace opens on payment, never gated on email delivery
- `/guide/*` (8 SEO articles), `/faq` (FAQPage schema), `/terms`
- `lib/statute/ma.ts` — the §15B rules engine (pure, unit tested; each rule has explanation + plainTerms + citation + severity). All §15B legal logic lives here; adding NY later = new file, not a rewrite
- `lib/statute/ch93a.ts` — the Chapter 93A layer (940 CMR 3.17(4) mapping, verified against primary sources 2026-07-11; returns null for owner-occupied landlords per Billings v. Wilson, 397 Mass. 614)
- `lib/letter/` — plain and combined letter assembly, PDF/docx renderers, `fromOrder.ts` as the single source of truth for a buyer's current letter
- `lib/kit/` — kit PDF content, fulfillment (idempotent, webhook-driven), order access gate
- `lib/mail/lob.ts` — certified mailing (graceful degrade; distinguishes undeliverable-address failures)
- `lib/email/` — Resend senders + pure content builders (results, tracking), all unit tested

## Non-negotiable invariants

- **A physical letter can never be sent twice.** Mailing claims are atomic (`unsent → sending → sent`); losers of the race get a 409.
- **A paying customer always reaches their workspace**, even if email, the webhook, or Lob is down. Email is a courtesy copy; the order route falls back to confirming payment directly with Stripe.
- **Graceful degradation everywhere:** db/email/Stripe/Lob helpers log and return rather than throw when unconfigured; fulfillment failures revert state so Stripe retries.

## Legal-safety requirements (non-negotiable)

- Persistent disclaimer (global footer, analysis, workspace, every PDF and email): "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney."
- Never use outcome-promising language ("you will win", "guaranteed"). Use "may", "can expose the landlord to", "commonly contestable".
- The wear-and-tear classifier output stays labeled as informational flags, not legal conclusions.
- Every statutory claim (citation, deadline, remedy) must be verified against current primary sources (malegislature.gov, official CMR text) before it ships. Do not invent legal claims. The 93A demand-letter elements and 30-day window were verified 2026-07-11.
- Stats in marketing copy must be real and cited (current stat band: Rent.com renter survey, 2023).
- Buyers affirmatively acknowledge (checkbox) before mailing that this is a self-help document sent at their direction.
- No em/en dashes in user-facing copy (owner's style rule; enforced by tests in several content modules).

## Design

Mobile-first (traffic comes from Reddit/TikTok on phones). Clean, trustworthy, government-adjacent seriousness: plain typography, one accent green (#1E4D3A), no gradients, no heavy client libs. The analysis screen is the money shot (screenshot-worthy claim card); violation cards use the brand green ("your leverage"), never alarm red.

## What NOT to build

No auth/accounts. No multi-state (until MA validates). No photo upload. No admin panel (read the DB directly). No email drip sequences. No native apps. No animation libraries. And in this phase: no new features without funnel data or customer requests demanding them — the two known candidates are in-workspace paragraph editing and a Lob delivery-status webhook.
