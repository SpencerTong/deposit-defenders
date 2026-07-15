# Marketing Launch Playbook (Approach A: comment-first Reddit + weekly TikTok)

**Date:** 2026-07-14
**Status:** Active. This is the playbook for the marketing and validation phase.
**Owner constraints:** a few hours per week in 1 or 2 sittings, organic first, comfortable with voiceover screen recordings, wants to avoid public criticism and account bans.

## Goal

Drive enough tagged traffic through the funnel in 3 to 4 weeks to judge willingness to pay, measured by the `events` table (`landed -> started -> completed_questions -> viewed_analysis -> submitted_email -> clicked_kit -> purchased`, segmented by `?src=`).

## Success criteria and decision gate

- Weekly: run `npm run funnel` (or read Vercel Analytics if local Postgres is blocked) and record the numbers by `src`.
- **Week 4 gate:** if total `viewed_analysis` is under ~200, organic alone is too thin to learn from. Trigger the fallback: a ~$150 Google Ads test on exact-match high-intent queries ("landlord kept security deposit massachusetts" and similar), tagged `?src=gads`.
- The real validation signal is `clicked_kit -> purchased`. Any organic purchase is a strong signal at this volume.

## Channel 1: Reddit (`?src=reddit`)

**The rule that prevents both bans and embarrassment: never cold-post a promo thread. Comment helpfully in threads where someone already has the problem.**

Cadence per sitting (60 to 90 min, 1 or 2 sittings per week):

1. Search r/boston, r/massachusetts, r/CambridgeMA, r/somerville (and r/legaladvice for reading only) for new threads: "security deposit", "landlord kept", "deposit back", sorted by new. Also check r/renters and r/TenantHelp.
2. Answer the person's actual question first, substantively, from §15B knowledge. Most comments get **no link at all**.
3. **Ratio rule: at least 3 helpful unlinked comments for every 1 comment that links the tool.** This is what keeps the account safe and the participation genuine.
4. When the thread is squarely about a withheld MA deposit, add one sentence at the end: disclosure plus link, e.g. "I built a free tool that checks this against the statute for your exact situation" with `https://deposit-defenders.com?src=reddit`.
5. Check each sub's rules in the sidebar before the first linked comment there. r/legaladvice forbids links; help there without any link, or skip.

**Sub rules audit (checked 2026-07-14):**

- **r/massachusetts rule 9:** bans commercial advertising INCLUDING "subtle promotion of products, services, or websites through disguised posts or comments". Rule 8 bans AI-generated text. Verdict: **no links here, ever.** Pure-value comments only, written in the owner's own voice.
- **r/boston rule 5:** bans self/link posts that constitute advertising, including "self-affiliated business... service promoting". Verdict: **no links here either.** Same pure-value approach.
- Adjusted link strategy: the site link (with `?src=reddit`) lives in the **Reddit profile bio**, not in comments in these subs. Helpful commenters get profile clicks; this is the ban-proof pattern. Direct links only in subs whose rules allow them (check each before first link) and only when someone asks directly.
- r/legaladvice: no links allowed at all; read-only or unlinked help.

**Account safety rules:**

- Use the established account. Personalize every comment; never paste the same text twice.
- Space linked comments out (no more than 1 or 2 per sitting, days apart per sub).
- Always disclose "I built this". Undisclosed promotion is what gets people banned and flamed.

**Handling criticism (the fear plan):**

- Expected worst case in a comment thread is mild ("just use small claims", "not a lawyer"). Reply once, calmly and factually, then stop. Never argue in threads.
- If a mod removes a comment, message them politely asking what rule it broke, and follow it. One removal is not a ban.
- Downvotes on one comment disappear from view within a day and do not affect anything.

## Channel 2: TikTok (`?src=tiktok`)

- Batch 2 or 3 videos in one sitting; post them spaced across the week.
- Format: screen recording of the question flow ending on the "up to $X" analysis card, with voiceover.
- Link in bio: `https://deposit-defenders.com?src=tiktok` (TikTok does not allow links in captions).
- Hook ideas (all hedged, per legal-safety rules): "Massachusetts landlords may owe you 3x your deposit if they miss this deadline", "6 questions to find out what your landlord may owe you".

## Legal-safety rules for ALL marketing copy (mirrors CLAUDE.md, non-negotiable)

- Never promise outcomes. Use "may", "can expose the landlord to", "commonly contestable".
- Every statutory claim must match the verified statute text already in the product.
- Stats must be real and cited (current: Rent.com renter survey, 2023).
- No em or en dashes in any copy.
- In Reddit comments, frame everything as general legal information, not legal advice.

## What we are NOT doing (this phase)

- No cold promo posts on Reddit until the account has weeks of helpful history in a sub.
- No paid spend before the week-4 gate.
- No new product features; conversion copy tweaks only, driven by funnel data.

## Weekly rhythm

| When | What |
|------|------|
| Sitting 1 (60-90 min) | Reddit thread hunt + comments; record 2-3 TikToks |
| Sitting 2 (30-60 min) | Post remaining TikToks; reply to any Reddit responses; run `npm run funnel`; note numbers by src |
