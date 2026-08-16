# Runbook: restarting the Google Ads campaign

**Written:** 2026-08-16. **Status:** not yet executed. Account paused pending advertiser verification.

Everything needed to restart paid search without rediscovering July's lessons. Read the
economics section before touching the account: it defines what a *successful* restart looks
like, and those numbers are what the kill rules are derived from.

---

## Fixed constraint: the price stays $49

Decided by the owner 2026-08-16, after seeing the math below. This is not an open question.
Every number here assumes it.

```
revenue                     $49.00
  less Lob certified mail   -$12.00
  less Stripe fee            -$1.72
= contribution margin       ~$35.00
```

## The economics, stated plainly

**July actuals:** $147.31 spent, 44 clicks, $3.35 avg CPC, 1,437 impressions (3.07% CTR),
1 purchase.

| Click to purchase | Revenue per click | Breakeven CPC |
| --- | --- | --- |
| 2.27% (July actual) | $0.79 | $0.79 |
| 4.5% (if the landing fix doubles it) | $1.58 | $1.58 |
| 5.7% | $2.00 | $2.00 |

Against a July CPC of **$3.35**, the gap was **4.2x**.

**The landing-page fix alone does not close it.** Doubling the start rate still leaves paid
roughly 2.1x underwater at July's CPC. A profitable restart at $49 needs *both* a materially
higher conversion rate *and* a materially lower CPC. Anyone who restarts expecting the
inline-question change to have fixed this will lose money again and be surprised.

**Sales needed to break even on a $150 test: 4.3.**

## Preconditions, all required before spending a dollar

- [ ] **Advertiser verification cleared.** Submitted 2026-08-16, days to weeks. Ads cannot run
      until it does.
- [ ] **Ad final URLs point at `https://slatebell.com/?src=gads`.** A cross-domain redirect on
      an ad destination is a destination-mismatch policy violation and gets ads disapproved;
      the working 301 does not save it. Keep `?src=gads`, since `npm run funnel` segments on it.
- [ ] **Sitelink URLs updated** (Assets > Assets, filter to Sitelink). Quite possibly none exist.
- [ ] **Google Ads account renamed** to Slatebell.
- [ ] **Search Console relinked** (Tools > Linked accounts) to the `slatebell.com` property.
- [ ] **Vercel on Pro, not Hobby.** A paused deployment mid-campaign burns the whole budget for
      nothing. See the Hobby-plan note in `HANDOFF.md`.
- [ ] **Start rate measured on free traffic**, ideally ~12%+ over a few hundred landings. If no
      free traffic has materialized by about 2026-09-15, proceed anyway and treat the spend as
      tuition rather than a test.

## Campaign configuration

**Match type: EXACT only.** July ran **phrase** match despite the original spec calling for
exact. That is a large part of where the money went. Verify this explicitly rather than
assuming.

**Keywords, grievance intent only.** From July's search-terms report, CTR split sharply by
intent:

| Keyword | July CTR | Action |
| --- | --- | --- |
| landlord not returning security deposit | 6.31% | keep, exact |
| landlord won't give back security deposit | 6.07% | keep, exact |
| massachusetts security deposit law | 3.50% | **delete**, it ate ~$47 of $147 |
| security deposit interest massachusetts | 0.85% | **delete**, flagged Rarely shown, low QS |

Add close grievance variants in exact match: `landlord kept my security deposit`,
`landlord did not return deposit`, `how to get security deposit back from landlord`.

**Negative keywords** to block informational intent, which is what drained July:
`law`, `laws`, `legal`, `interest`, `calculator`, `rules`, `statute`, `template`, `free`,
`form`, `sample`.

**Geo:** Massachusetts only. **Landing page:** `https://slatebell.com/?src=gads`.

**Timing.** Boston lease turnover concentrates on September 1 and §15B gives landlords 30 days,
so there are two demand waves, not one: **early-to-mid September**, when movers receive itemized
deduction statements that look bogus, and **early-to-mid October**, when the 30-day deadline
passes and nothing has arrived. October is the larger wave. Prefer it if only one run is funded.

## Kill rules, committed before launch

Write these down and obey them. The purpose of a preset kill number is that it is decided while
you are not emotionally invested in the outcome.

- **Hard budget cap: $150.** Set the campaign to pause automatically.
- **CPC preflight:** after the first 20 clicks, if average CPC is above **$2.50**, pause and
  rework keywords. At $49 there is no CPC above roughly $2.00 that works.
- **Midpoint checkpoint at $75 spent:** if there are **zero** purchases, stop. Do not reason
  about it, do not wait for it to turn around.
- **Full stop at $150** regardless of results.

**Reading the result:**

| Purchases per $150 | Verdict |
| --- | --- |
| 4 or more | Profitable. Scale carefully and re-measure. |
| 2 to 3 | Marginal but close. Worth one more run in the October wave. |
| 0 to 1 | Same as July. **Stop paid search at $49 permanently** and put the energy into free channels. |

**A caveat that matters:** $150 at roughly $2 CPC buys about 75 clicks. That is enough to detect
a catastrophe and not enough to prove profitability. A test this size cannot distinguish a 2.3%
conversion rate from a 5.7% one with confidence. Treat "4 or more" as encouraging rather than
established, and do not scale hard on it.

## Measuring

`npm run funnel` segments by `src`, and test traffic is hidden by default. Useful flags:
`--days N`, `--since`, `--until`, `--split DATE`, `--include-tests`.

**Use billed ad clicks as the paid denominator, not `landed`.** Before 2026-07-31 `landed` fired
on every mount, so it overcounted by roughly 1.75x. That bug is fixed, but rates before and after
that date are not comparable.

The willingness-to-pay signal is `clicked_kit` to `purchased`. July's back half was healthy
(8 analyses, 2 kit clicks, 1 purchase); the leak was the top, where 32 of 44 clicks left without
typing anything, roughly $107 of the $147.
