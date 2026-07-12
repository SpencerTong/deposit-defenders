# Project: MA Security Deposit Demand Letter Generator

## What this is

A single-purpose validation MVP: a free web tool where Massachusetts renters answer ~6 questions about their security deposit situation, see an analysis of their legal leverage under M.G.L. c. 186 §15B, and generate a formal demand letter as a PDF (delivered via email capture). After the free letter, a paid "$49 Dispute Kit" upsell tests willingness to pay (automated digital fulfillment: personalized kit PDF + demand letter emailed via Resend on payment).

This is NOT the full product. It is a two-week market validation experiment. Optimize for: speed to deploy, conversion measurement, shareability, and SEO. Do not build accounts, auth, dashboards, or multi-state support yet.

## Success criteria (what the code must enable measuring)

1. Visitor → completed letter flow conversion rate
2. Letter → paid kit click/purchase conversion rate
3. Traffic source attribution (Reddit vs TikTok vs organic)

## Stack

- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Deployed on Vercel (I will connect the repo myself)
- PDF generation: @react-pdf/renderer (or server-side with pdf-lib — pick one, justify briefly)
- Email capture + PDF delivery: Resend (free tier) — send the PDF as attachment; store the email
- Data storage: Vercel Postgres or a simple Vercel KV/Upstash store for leads + funnel events (keep it minimal; a `leads` table and an `events` table is enough)
- Payments: Stripe Checkout (one-time $49) + `checkout.session.completed` webhook for fulfillment. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Analytics: Vercel Analytics + a tiny custom event logger (funnel steps: landed, started, completed_questions, viewed_analysis, submitted_email, clicked_kit, purchased). Support `?src=` UTM-style attribution on the landing URL.

## Architecture

- `/` — landing + tool (single page, tool above the fold)
- `/letter/preview` — analysis + letter preview + email gate
- `/kit` — the $49 Dispute Kit offer page → Stripe Checkout
- `/guide/*` — 2 SEO article pages (content provided later)
- `lib/statute/ma.ts` — the rules engine (pure functions, unit tested). All legal logic lives here, config-style, so adding NY later = new file, not a rewrite.
- `lib/letter/template.ts` — letter assembly from rules-engine output

## The MA rules engine (core logic)

Inputs collected from the user:

1. `depositAmount` (number)
2. `monthlyRent` (number)
3. `moveOutDate` (date)
4. `tenancyEndConfirmed` (bool — lease ended / properly terminated)
5. `receivedItemizedList` (bool) and if yes, `itemizedListDate` (date) and `listSwornUnderPenalty` (bool/unknown)
6. `receivedBankReceipt` (bool/unknown — landlord provided bank name & account number for escrowed deposit within 30 days of receiving it)
7. `receivedStatementOfCondition` (bool/unknown — within 10 days of move-in)
8. `deductionsClaimed` (array of {description, amount}) — free text per line
9. `amountReturned` (number)
10. `interestPaidAnnually` (bool/unknown)

Rule outputs (each with: triggered boolean, plain-English explanation, statute citation, severity):

- `R1_DEPOSIT_EXCEEDS_ONE_MONTH`: deposit > monthly rent → landlord violated §15B(1)(b)
- `R2_NO_ESCROW_RECEIPT`: no bank receipt → potential forfeiture of right to retain deposit; treble damages exposure §15B(3)(a), §15B(7)
- `R3_LATE_OR_MISSING_ITEMIZATION`: no itemized list within 30 days of tenancy end, or list not sworn under penalty of perjury → forfeits right to deductions; treble exposure §15B(4), §15B(6)-(7)
- `R4_LATE_RETURN`: >30 days since tenancy end and full balance not returned → treble damages + costs + attorney's fees §15B(7)
- `R5_WEAR_AND_TEAR_FLAGS`: run each deduction description through a keyword classifier (cleaning, painting, carpet, nail holes, general wear terms) → flag as "commonly contestable as reasonable wear and tear" vs "potentially legitimate damage" vs "unclear". Keep this heuristic and clearly label it as informational.
- `R6_NO_INTEREST_PAID`: tenancy ≥ 1 year and no annual interest → §15B(3)(b) violation
- Compute `maxExposure`: up to 3x deposit + note re: costs and attorney's fees when treble-damage rules trigger.

IMPORTANT — legal accuracy: before finalizing rule text, fetch and verify the current text of M.G.L. c. 186 §15B from malegislature.gov and cross-check every citation, deadline (30 days, 10 days), and remedy above. If any rule as described conflicts with the current statute text, follow the statute and flag the discrepancy to me. Do not invent additional legal claims beyond what the statute supports.

## The demand letter

Formal business-letter format: tenant info, landlord info, property address, deposit facts, then a numbered list of the triggered violations each with statute citation, a demand for the specific amount, a 10-business-day response deadline, and a statement that the tenant is prepared to pursue remedies in small claims court including treble damages, interest, court costs, and attorney's fees under §15B(7). Tone: firm, factual, non-threatening, no legalese beyond citations. Placeholder fields for anything not collected.

## Legal-safety requirements (non-negotiable)

- Persistent disclaimer (footer + before letter generation): "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney."
- Never use outcome-promising language ("you will win", "guaranteed"). Use "may", "can expose the landlord to", "commonly contestable".
- The wear-and-tear classifier output must be labeled as informational flags, not legal conclusions.

## Design

Mobile-first (most traffic will come from Reddit/TikTok on phones). Clean, trustworthy, government-adjacent seriousness — think plain typography, one accent color, no startup gradients. The analysis screen is the money shot: it should be screenshot-worthy (e.g., a bold "Your potential claim: up to $7,200" card with the violations listed under it). Fast: no heavy client libs on the landing page.

## What NOT to build

No auth/accounts. No multi-state. No photo upload. No admin panel (I'll read the DB directly). No email drip sequences. No native app anything.
