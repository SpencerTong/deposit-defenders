# MA Revenue Build-Out — Design

**Date:** 2026-07-08
**Status:** Approved by user (pending spec review)
**Goal:** Turn the validation MVP into a product that produces stable, predictable monthly revenue from Massachusetts renters, with automated fulfillment that scales with traffic instead of founder hours.

## Strategy decisions (settled with user)

1. **Revenue model: steady transactional revenue.** Keep the one-time $49 Dispute Kit. "Stable MRR" is achieved through a self-renewing customer pool (new MA renters hit deposit disputes every month) acquired via compounding SEO, not through subscriptions. No subscription product, no landlord-side pivot, no multi-state expansion yet.
2. **Kit fulfillment: fully automated digital kit.** No concierge, no fake door. The kit is generated and delivered by machine at any volume.
3. **SEO content: 6 new articles drafted by Claude** (8 total), with all legal claims reviewed by the user before publishing.
4. **Delivery architecture: webhook-driven email delivery.** Stripe webhook fulfills the order so the buyer gets the kit even if they never return to the site.

## 1. Product scope

The free funnel (questions → analysis → email-gated demand-letter PDF) is unchanged.

The $49 Dispute Kit becomes a real, personalized PDF bundle generated from the buyer's flow answers and rules-engine analysis:

- The demand letter (reuses `lib/letter/*`)
- Certified-mail sending instructions: addressing template, proof-of-mailing checklist
- Small-claims escalation guide pre-filled with their numbers: computed claim amount, treble-damages exposure, MA small-claims filing fee schedule, Statement of Small Claim walkthrough
- Evidence checklist
- Escalation timeline (day 0 / day 10 / day 30 actions) — printed inside the kit PDF, **not** drip emails (CLAUDE.md forbids email sequences)

**Deliverable shape:** two PDF attachments in one email — (1) the demand letter (unchanged from the free flow, so the buyer can mail it directly) and (2) a single "Dispute Kit" PDF containing all other sections above.

**Edge case — no answers:** A visitor landing on `/kit` from an SEO article may have no flow answers (answers live in localStorage via `lib/flow/storage.ts`). The kit CTA detects missing answers and routes the visitor through the free flow first. Side effect: every buyer passes the full funnel, keeping conversion metrics clean.

## 2. Purchase & fulfillment architecture

### Data

New `kit_orders` table:

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text | buyer email |
| `answers` | jsonb | `FlowAnswers` snapshot at checkout time |
| `stripe_session_id` | text UNIQUE, nullable | set when session created; uniqueness is the idempotency key |
| `status` | text | `pending` → `paid` → `fulfilled` |
| `src` | text nullable | attribution |
| `created_at`, `fulfilled_at` | timestamptz | |

### Flow

1. `POST /api/checkout` (modified): accepts `{ email, answers, src }`, validates, inserts a `pending` order, creates the Stripe Checkout session with `metadata.kit_order_id`, stores the session ID on the order, returns the redirect URL.
2. `POST /api/webhooks/stripe` (new): verifies the Stripe signature with `STRIPE_WEBHOOK_SECRET`. On `checkout.session.completed`:
   - Load the order by `metadata.kit_order_id`; verify the session ID matches.
   - If already `fulfilled`, return 200 (idempotent — Stripe retries).
   - Mark `paid`, generate the kit PDFs, email them via Resend, mark `fulfilled`, record the `purchased` funnel event once.
   - If PDF generation or email fails: return 500 so Stripe retries; order stays `paid`, and fulfillment is retried on the next webhook delivery.
3. Success page (`/kit/success`): "your kit is in your inbox" + re-download. Backed by `GET /api/kit/order?session_id=` (new) which returns order status and, when paid/fulfilled, streams the kit PDF on request. Replaces the current client-side `GET /api/checkout/confirm` (deleted — it recorded `purchased` unreliably and non-idempotently).

### Idempotency & revenue integrity

- Unique constraint on `stripe_session_id`; the `fulfilled` status check prevents double-send and double-count on webhook retries.
- `purchased` events are recorded only inside the webhook path.

## 3. Kit code layout

Mirrors the existing letter pattern — pure logic separate from rendering:

- `lib/kit/content.ts` — assembles kit sections from `TenancyInputs` + `analyzeTenancy` output. Pure functions, unit-tested.
- `lib/kit/pdf.tsx` — react-pdf rendering, same conventions as `lib/letter/pdf.tsx`.
- `lib/kit/court-data.ts` — static MA small-claims facts (fee schedule, filing process, court finder pointer), each with a source URL comment, verified against mass.gov.

All kit legal text follows the legal-safety rules: "may" / "can expose", no outcome promises, wear-and-tear flags labeled informational, persistent disclaimer included in the kit PDF.

## 4. SEO growth engine

- **6 new articles** (8 total) in the existing `guideArticles` structure, targeting real MA renter queries:
  1. Landlord didn't return my deposit within 30 days (MA)
  2. Treble damages under §15B — what 3x actually means
  3. Normal wear and tear vs. damage in Massachusetts
  4. Landlord never paid interest on my deposit
  5. No statement of condition / no bank receipt — what it means for your deposit
  6. Taking a landlord to small claims court in MA for a security deposit
- Every article: internal links to the other guides, CTA into the tool, correct statute citations. **User reviews all legal claims before publish.**
- New `/guide` index page (only `[slug]` exists today).
- JSON-LD: `Article` schema on all guides; `FAQPage` schema where the article has a Q&A section.
- Confirm sitemap covers all guide URLs.

## 5. Data, measurement, ops

- Finish and commit the in-flight `@vercel/postgres` → `pg` refactor (already staged in working tree).
- New migration for `kit_orders` in the existing `scripts/migrate.mjs` flow.
- `scripts/funnel-report.mjs`: run locally, prints step-to-step conversion (landed → started → completed_questions → viewed_analysis → submitted_email → clicked_kit → purchased) overall and per `src`. No admin panel (CLAUDE.md).

## 6. Legal accuracy pass (non-negotiable)

Before any new user-facing legal text is finalized: fetch M.G.L. c. 186 §15B from malegislature.gov and the mass.gov small-claims pages; cross-check every deadline (30-day, 10-day), fee, remedy, and citation used in the kit and the 6 new articles. Any discrepancy between the spec'd rule text and the current statute is flagged to the user, not silently resolved.

## 7. Explicitly not building

Subscriptions, auth/accounts, drip emails, multi-state content or rules, admin UI, photo upload. Multi-state later remains cheap because all legal logic stays isolated in `lib/statute/ma.ts`; this design does not touch that boundary.

## 8. Testing

- Unit: kit content assembly (`lib/kit/content.ts`), order state transitions, court-data invariants.
- Webhook: signature verification (reject bad signatures), fulfillment idempotency (same event twice → one email, one `purchased` event).
- Existing tests (`lib/statute/ma.test.ts`, letter, flow) stay green.
- Manual end-to-end with `stripe listen` + Stripe test mode before flipping live.

## 9. Environment / deploy prerequisites (user-owned)

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from `stripe listen` locally; from the dashboard webhook endpoint in prod)
- Resend domain verified for attachment delivery
- Stripe live mode + real $49 price when validation says go
