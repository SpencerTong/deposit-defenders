# HANDOFF: read this first

**Updated:** 2026-08-01

Orientation for a fresh session picking up Deposit Defenders. Read `CLAUDE.md` first (legal-safety rules are non-negotiable), then this file.

## The one-paragraph summary

**Deposit Defenders is a live business.** `https://deposit-defenders.com` charges real cards ($49 via live Stripe), emails customers from the verified domain (`letters@deposit-defenders.com` via Resend), and physically mails demand letters by USPS Certified Mail (live Lob). The build phase is complete; the current phase is **marketing and validation**. Do not rebuild things; drive traffic, measure, and iterate on conversion.

## What changed 2026-07-31 and 2026-08-01

- **Google Ads test CONCLUDED and is paused.** Final: **$147.31, 44 clicks, $3.35 avg CPC, 1,435 impressions (3.07% CTR), 1 purchase** (Mary). Verdict: **paid search does not work at $49.** Contribution margin is about $35 after Lob (~$12) and Stripe (~$1.72); at 2.27% click-to-purchase, breakeven CPC is ~$0.79 against an actual $3.35, roughly **4.2x** off. Keyword selection cannot close a 4x gap. **Do not restart paid without funnel improvement.**
- **Search-terms finding (from the keyword report):** CTR splits sharply by intent. Grievance phrasing performed best, "landlord not returning security deposit" 6.31% and "landlord won't give back security deposit" 6.07%, while informational phrasing performed worst, "massachusetts security deposit law" 3.50% and "security deposit interest massachusetts" 0.85% (the latter flagged *Rarely shown, low Quality Score*). The single largest spend, ~$47 of $147, went to the informational "massachusetts security deposit law". Keywords ran **phrase match**, not exact as the original spec called for. Any retest should drop informational terms, keep grievance terms, and use exact match.
- **Funnel instrumentation was wrong and is now fixed.** `landed` fired on every mount, so refreshes and back-navigation counted as new visitors: 77 `landed` events against 44 billed clicks, ~1.75x. All seven client events now go through `trackEventOnce` (session-scoped). A real bug surfaced with it: `trackEvent` read `sessionStorage` unguarded, so in private mode the event was lost *and* the exception escaped into a React effect. **Rates before and after 2026-07-31 are not comparable.**
- **Peebles v. JRK Property Holdings, SJC-13702 (Aug. 1, 2025) is now cited throughout**, verified against the full opinion text. Holds that deductions for reasonable wear and tear violate §15B(4)(iii), and that a lease clause forcing "professionally cleaned" condition on penalty of such deductions is void under §15B(8). Cited in rules R5 and R7, in a new demand-letter paragraph that disputes contestable charges by name, and in the rewritten wear-and-tear guide. **Read `docs/` or the memory note before writing new copy about it: the Court expressly refused a bright-line rule, expressly left open stand-alone cleaning requirements (n.8), and expressly did not decide whether such a clause triggers §15B(6)(c) forfeiture.** The keyword hedging in R5 is deliberate and Peebles supports keeping it.
- **Pre-mail answer editing shipped.** Buyers can correct their own question-flow answers from `/kit/success` until mailing starts; both that step and letter details lock server-side once `mail_status` leaves `unsent`. Adds an `answers_history` audit column (applied to prod via the Supabase SQL editor).
- **Conversion changes shipped.** The analysis page's only CTA sat below the deduction flags *and* a disclaimer paragraph; a CTA now renders directly under the violation cards and the disclaimer moved to the page bottom (it also renders in the global footer, so it was duplicated). The landing page now asks the first question inline instead of behind a "start" click, seeding `QuestionFlow` so nothing is retyped.
- **Google Search Console is set up** (Domain property, sitemap submitted, 12 URLs discovered). Day-one index state: 1 indexed, 2 not. Both exclusions are benign, one is the correct `http` to `https` redirect, one is "crawled, currently not indexed," normal for a ~3-week-old domain.
- **Name/trademark check:** `depositdefenders.com` (no hyphen) is a dead Squarespace site whose domain was renewed March 2026, so it is held, not available. The only close live mark, **DEPOSITS DEFENDER** (serial 99914084, Analyticom LLC), covers "financial investment analysis and stock research," unrelated. Risk looks low. The USPTO scan was partial (~100 of 725 live "defender" marks, targeted at classes 036/045); a real clearance search is an attorney job if the brand ever gets real investment.
- **Vitest gotcha:** `.worktrees/` is now excluded in `vitest.config.ts`. Worktrees are full checkouts, so tests ran twice, and the `@` alias always resolves to the repo root, meaning a worktree copy's `vi.mock()` targeted the wrong module and failed spuriously. **If a test fails only under a `.worktrees/` path, suspect this before the code.**

## Where things stand (2026-07-27)

- **First real paying customer, 2026-07-27.** A Google Ads visitor (Mary Kirnon, `carlena1583@gmail.com`) bought the kit, was fulfilled instantly, and her combined §15B + Chapter 93A letter was mailed certified (USPS tracking `9214 8902 3589 0900 0043 4050 01`). Her 93A 30-day response window runs to ~2026-08-26. A personal (non-automated) thank-you was sent from the owner's own inbox, not the `letters@` sending domain, since that domain has no real receiving inbox behind it. Next touch: light check-in mid-August, then ask about outcome/feedback after the window closes, not before.
- **Legal-content fix shipped the same day, found while auditing that first real letter:** the intake flow asked whether the landlord gave a move-in statement of condition, but the answer was captured and never used by the rules engine, so it never appeared in any analysis or letter for any customer. Added as rule `R7_NO_STATEMENT_OF_CONDITION` in `lib/statute/ma.ts` (verified against malegislature.gov and 940 CMR 3.17(4)(e); not a §15B(6) forfeiture/treble trigger, so it adds zero dollars, just a citable practice). Also tightened letter wording: the demand paragraph now shows its arithmetic (balance, treble multiplier, interest) instead of a bare total, and the intro now discloses any amount already returned.
- **`/kit` page redesigned around value, not just a price note:** replaced the old one-line "for perspective" blurb with an itemized "what's actually in the $49" receipt (each deliverable priced against its standalone cost: $150+ attorney consult, ~$10 certified mail, an evening-or-more of DIY court paperwork research).
- **New: masked support contact.** `/support` (linked from the global footer) posts to `/api/support`, which relays through Resend to the owner's personal inbox via `SUPPORT_NOTIFY_EMAIL` (set in Vercel Production), with the customer's address as reply-to. The owner's real address never reaches the client. Didn't exist before this session; there was previously no real way for a customer to reach anyone.
- **Traffic channels, corrected:** a live Google Ads test (~$150 budget, `src=gads`) has been running since 2026-07-17 and produced the first sale; it auto-pauses ~2026-07-30, at which point funnel numbers should be reread across all `src` values before any decision on price or landing-page copy. Reddit/TikTok (below) are still the organic plan but were deprioritized behind the paid test.
- **Branch:** `main` is the only branch; everything is merged. Work on feature branches off `main`; the user merges PRs themselves (permission rules require it).
- **Live and proven by a real dollar test:** the owner bought the kit with a real card; the live webhook fulfilled instantly; the kit email arrived from the domain; the workspace produced the combined letter; a real certified letter was dispatched via Lob with a live USPS tracking number. (Envelope arrival pending as of this writing; $49 refunded via Stripe dashboard.)
- **The product:** free ungated §15B analysis (the hook) → $49 kit: combined §15B + Chapter 93A demand letter (30-day window; §15B-only when the landlord is owner-occupied, per Billings v. Wilson), post-purchase workspace at `/kit/success?session_id=` (details form, letter preview, PDF/.docx/kit/small-claim-draft downloads, one-click certified mailing with tracking emailed to the buyer), 8 SEO guide articles, `/faq` with FAQPage schema, `/terms`, `/support`.
- **Env (all in Vercel Production):** live `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (live endpoint at `deposit-defenders.com/api/webhooks/stripe`, event `checkout.session.completed`), live `LOB_API_KEY` (Lob account has a payment card; required for live sends), `RESEND_API_KEY` + `RESEND_FROM_EMAIL="Deposit Defenders <letters@deposit-defenders.com>"`, `SUPPORT_NOTIFY_EMAIL` (owner's personal inbox, added 2026-07-27), `NEXT_PUBLIC_SITE_URL=https://deposit-defenders.com`, Supabase Postgres URLs. DNS lives at Squarespace (site A record + Resend DKIM/SPF, all verified).
- **Deliberately deferred by the owner:** attorney review of the combined letter text (accepted risk; plan is to buy a flat-fee review out of early revenue) and forming an LLC (MA fee is $500/yr). The mitigations shipped instead: disclaimers everywhere, `/terms`, hedged language, pre-mail acknowledgment, verified statute citations.

## Current phase: marketing and validation

The engineering is done. Next steps, in priority order:

1. **Reread the Google Ads test at ~2026-07-30** when it auto-pauses ($150 budget, `src=gads`): full `npm run funnel` across all `src` values before touching price or landing copy. As of 2026-07-27, per-stage sample sizes are still small (single digits to low tens at most stages) except landed→started, which already has enough volume (n=300+) to be a real, actionable signal rather than noise; price should not be touched until `clicked_kit` has a meaningfully larger sample.
2. **Seed organic traffic with source tags**, deprioritized behind the paid test but still the plan: Reddit first (r/boston, r/massachusetts, r/CambridgeMA, r/somerville; check each sub's self-promo rules; answering real "landlord kept my deposit" threads helpfully beats cold posts), TikTok second (screen-record the flow to the "up to $X" analysis card). Every link gets `?src=`.
3. **Measure with `npm run funnel`** (events: landed → started → completed_questions → viewed_analysis → submitted_email → clicked_kit → purchased, segmented by `src`). The willingness-to-pay signal is `clicked_kit` → `purchased`.
4. **Iterate on conversion, not features.** Copy tweaks, stat presentation, CTA wording; small PRs. Resist feature work until the funnel data demands it.
5. **Support:** buyers can use `/support` (relays to the owner's personal inbox via `SUPPORT_NOTIFY_EMAIL`, added 2026-07-27) or reply directly to a customer's own outreach email. Replying to the automated kit/tracking emails does **not** reliably reach anyone; `letters@deposit-defenders.com` is a Resend sending identity with no real inbox behind it. The DB is still the admin panel (read `kit_orders` directly).

Known candidate features if data or customers ask: editing letter paragraphs in the workspace before mailing (today: structured fields + custom-note paragraph; free-form edits only via the .docx download, which the mail-for-you path does not use), and a Lob delivery-status webhook (today: buyers track via USPS). The masked support contact shipped 2026-07-27; pre-mail answer editing shipped 2026-07-31.

**A new candidate, from Peebles:** detecting lease clauses that require professional cleaning. Peebles makes these void under §15B(8) when they penalize via the deposit, and it was the single most active MA tenant thread on Reddit. It needs a new question in the intake flow, so it is a feature, not a copy tweak. Not built; awaiting a decision.

## Customer count, stated plainly (corrected 2026-08-01)

**There is exactly one real paying customer: Mary, from paid search.** The second `purchased` event in the `(none)` src bucket was the owner's own product test, not a customer. So **no free channel has ever produced a sale**, and the only channel that has produced one loses roughly $112 per acquisition. Reddit and SEO are hypotheses at this point, not results. Do not describe the business as having validated organic demand.

This is why the multi-state gate in `CLAUDE.md` exists: expansion is blocked until MA produces **10+ paying customers in a single month through a repeatable channel at positive contribution margin.**

## The September clock (added 2026-08-01)

Boston's lease turnover is concentrated on **September 1**, and §15B gives landlords 30 days, so disputes surface late September through October. That is the demand peak for this product, and it is the reason the July paid test read as weak: it ran in the deadest part of the summer.

Sequencing that follows from it:
- **August is for compounding assets**: SEO (the Peebles content is the strongest piece), Reddit comment history built *before* the wave (you cannot show up cold in r/boston in September without being read as a spammer), and conversion fixes that make every later channel worth more.
- **SEO will not rank by September.** The domain is ~3 weeks old with no backlinks; realistic payoff is October through December. Start now anyway, because that timing is exactly why starting now matters.
- **Any paid retest belongs late September**, small, exact-match, grievance keywords only, and only after conversion work. Treat it as tuition, not a growth channel.

## Engineering conventions (when code work does come up)

- `superpowers:writing-plans` → `superpowers:executing-plans`, TDD, commit per task, verify with `npm test`, `npm run type-check`, `npm run build`, and drive the affected flow headless (Playwright + system Chrome; see scratchpad scripts pattern).
- Invariants to never break: a physical letter can never send twice (atomic mail claim, 409 on retry); the workspace opens on payment, never gated on email delivery; email/webhook failures degrade gracefully and Stripe retries fulfillment; no em dashes or outcome-promising language in any user-facing copy.

## Local dev gotchas

- Run `npm run dev` and `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in **your own terminals**; a dev server started by the assistant dies when the session pauses.
- **Postgres (Supabase) is intermittently blocked on the user's local network**: `npm run db:migrate` / `npm run funnel` may time out (it worked on 2026-07-12 and was blocked again on 2026-07-14). Use a hotspot, or verify through the production API/Vercel logs instead.
- Stripe CLI may need `stripe login` re-auth for live-mode reads.
- Favicon changes cache hard in browsers; test in a private window.
