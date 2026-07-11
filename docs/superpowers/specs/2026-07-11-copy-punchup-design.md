# Copy & Conversion Punch-Up (Design Spec)

**Date:** 2026-07-11
**Status:** Decisions settled with user; ready for implementation planning.
**Prereq reading:** `CLAUDE.md` (legal-safety rules), `docs/superpowers/specs/2026-07-10-project1-landing-funnel-design.md` (the shipped funnel this modifies).

## Context and settled decisions

User feedback after testing the Project 1 funnel on a phone:

1. **Remove "AI tells" project-wide** in user-facing copy: no em/en dashes, no AI-flavored phrasing (e.g. "— free and instantly —", stacked triads, "Whether you… or…"). Plain, direct sentences. Applies to every user-visible string: pages, components, guide articles, emails, the kit PDF content, and the demand-letter template. Code comments with em dashes get cleaned opportunistically in touched files.
2. **Stat band, punchier but accurate.** User proposed "nearly a third" for the 26% stat; settled on accurate ratio phrasing instead ("More than 1 in 4"). Numbers must keep matching the cited Rent.com survey (26% lost a deposit / only 41% expect full return / 36% got no explanation).
3. **Sell the $49 kit hard, including mailing.** LAUNCH DECISION: the user will not release to customers until Project 2 (Lob certified mailing) is built, so copy may describe the full product: "we write your demand letter AND send it for you by certified mail." **Guardrail: PR #1 must not merge to `main` (production) until Project 2's mailing works.** Record in HANDOFF.md. No Chapter 93A claims yet: that copy waits for Project 2's legal-research gate.
4. **Free-vs-paid comparison card** on the analysis page (`/letter/preview`), replacing the current $49 CTA box: two columns ("Free check" vs "$49 Dispute Kit") with ✓/– rows, the $49 button beneath, the optional email capture below it, visually secondary.

## Scope

### Files with user-facing copy to sweep and/or rewrite

- `app/page.tsx` — stat band rewrite (ratios + labels), step-3 sell (now includes mailing), dash removal.
- `components/letter/LetterPreviewClient.tsx` — CTA box becomes the comparison card.
- `components/letter/ResultsEmailCapture.tsx` — dash removal, copy tightening.
- `app/kit/page.tsx` — hero + sections re-sold around "we mail it for you"; certified-mail section becomes "we handle this" instead of instructions; dash removal.
- `app/layout.tsx` — site metadata title/dash cleanup ("Deposit Defenders — MA…" → dash-free).
- `app/guide/page.tsx`, `lib/guide/articles.ts` (59 dashes), `app/guide/[slug]/opengraph-image.tsx` — dash/AI-tell sweep only; no substantive rewrites.
- `lib/email/results.ts` — dash removal + harder sell of the $49 kit (mailing included).
- `lib/email/resend.ts` — letter/kit email HTML dash sweep and copy alignment.
- `lib/letter/template.ts` — subject-line em dash removal ("Re: Security Deposit Demand — X" → "Re: Security deposit demand for X"); body already dash-free.
- `lib/kit/content.ts` — heading dashes ("Step 1 — …" → "Step 1: …") and in-paragraph dashes. NOTE: kit content stays truthful to current fulfillment (self-mail instructions) because it is the delivered product, not marketing; Project 2 rewrites it when mailing ships.
- Code comments in `app/api/checkout/route.ts`, `app/api/webhooks/stripe/route.ts`, `lib/payments/stripe.ts` — dash cleanup only.

### New copy (marketing surfaces)

- Landing step 3 (and equivalent mentions): "For $49 we write your formal demand letter citing the exact violations, send it to your landlord by certified mail for you, and include the full small-claims plan if they still don't pay."
- Comparison card rows: violation analysis (✓/✓), what you may be owed (✓/✓), formal demand letter citing your violations (–/✓), sent certified mail for you (–/✓), small-claims filing plan with your numbers (–/✓), evidence checklist and deadline tracker (–/✓).
- Results email: same sell, one link to `/kit`.

### Not in scope

Chapter 93A claims, actual Lob integration (Project 2), visual polish pass (logo, animations), any funnel/event changes, schema changes.

## Legal safety (unchanged, non-negotiable)

Persistent disclaimer stays everywhere it exists. No outcome-promising language. Stats stay accurate to the cited survey. Wear-and-tear flags stay informational.

## Acceptance

- `grep -rn "—\|–" app components lib --include="*.ts" --include="*.tsx"` returns nothing (excluding test files' quoted expectations if any).
- Stat band shows ratio phrasing with the Rent.com citation intact.
- Analysis page shows the comparison card with ✓/– rows and the $49 CTA; email capture below.
- Kit page and results email sell letter + certified mailing + small-claims plan.
- HANDOFF.md records the do-not-merge-until-Project-2 guardrail.
- `npm test`, `npm run type-check`, `npm run build` green; headless funnel drive passes; push to `revenue-buildout` only.
