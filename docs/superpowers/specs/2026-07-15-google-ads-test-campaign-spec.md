# Google Ads $150 validation test: campaign spec

**Date:** 2026-07-15
**Purpose:** buy ~40-75 high-intent Massachusetts visitors to answer the validation question the organic channels are too thin to answer. Success is measured in our own funnel (`?src=gads`), not in Google's dashboard.

## LAUNCHED 2026-07-17

Account 330-101-5345, Campaign #1, built live with the owner. Everything below was implemented and audited: 14 exact-match keywords (verified saved as Exact match), 8 negative keywords at campaign level, MA-only presence targeting, no Search Partners or Display, Maximize Clicks with $4.00 CPC cap, $11/day custom budget, final URL `https://deposit-defenders.com/?src=gads`, auto-apply recommendations confirmed OFF, and the auto-attached account-level Call asset with the owner's personal phone number was found and removed. Google's own projection at these settings: ~65 clicks/week at ~$1.18 avg CPC. Ads and keywords are Pending/Under review as of launch; review usually clears within a day.

**Manual stop required: pause the campaign around 2026-07-30 (~$150 spent). There is no automatic total-budget cutoff.** Then run `npm run funnel` and use the readout table below.

## Step 0: Keyword Planner check (free, do this before spending anything)

After creating the account: Tools > Keyword Planner > "Get search volume and forecasts". Paste the keyword list below (without brackets), set location to Massachusetts, and read two columns: average monthly searches and "top of page bid (low range)".

**Decision rule:**
- Combined volume above ~500/month AND low-range bids mostly under ~$5: run the test as specced.
- Low-range bids mostly $10+: stop and reconsider; $150 would only buy 10-20 clicks. Options then: cut Tier 2 keywords and run Tier 1 only, or skip paid and stay organic until September move-out season.
- Volume under ~200/month: run it anyway but expect the $150 to take a month to spend. Fine; the data is the same.

## Account setup (owner does this part personally: account creation and billing)

1. ads.google.com, sign in with a Google account.
2. **Trap 1:** Google funnels new accounts into "Smart" guided setup. Look for the small link to switch to **Expert Mode** before creating any campaign. If you end up with a Smart campaign, delete it and start over in Expert Mode.
3. Add billing (your card). Skip any "get $500 credit when you spend" coupon only if it forces settings; otherwise coupons are fine to accept.

## Campaign settings checklist

| Setting | Value | Why |
|---|---|---|
| Campaign type | **Search** only | No Display, no Demand Gen, no Performance Max |
| Campaign goal | "Create a campaign without a goal's guidance" | Goal presets push automation we don't want |
| Search Network partners | **OFF** (uncheck) | Junk traffic |
| Display Network | **OFF** (uncheck) | Trap 2: on by default, burns budget on banner junk |
| Location | Massachusetts | |
| Location options | **"Presence: people in or regularly in"** | Trap 3: default "presence or interest" shows ads worldwide to people reading about MA |
| Language | English | |
| Bidding | **Manual CPC** or Maximize Clicks with **max CPC bid limit $4.00** | No conversion data yet, so no smart bidding. The cap stops lawyer-keyword bid wars |
| Daily budget | **$11/day** | ~$150 over 2 weeks |
| Ad rotation | Optimize (fine) | |
| Auto-apply recommendations | **ALL OFF** (Recommendations > Auto-apply) | Trap 4: Google silently rewrites keywords and settings |
| Audience segments | None; if forced, "Observation" only | No audience expansion |
| Final URL | `https://deposit-defenders.com/?src=gads` | Funnel attribution; no other tracking needed |
| Google conversion tracking | Skip for this test | We judge via `npm run funnel` by `src=gads` |

## Keywords (one ad group, all EXACT match, in brackets)

**Tier 1: the problem is happening to them right now**

- [landlord won't return security deposit]
- [landlord won't give back security deposit]
- [landlord kept my security deposit]
- [landlord not returning security deposit]
- [landlord keeping security deposit]
- [security deposit not returned]
- [how to get my security deposit back]
- [sue landlord for security deposit]

**Tier 2: researching MA law (cheaper, slightly less urgent)**

- [massachusetts security deposit law]
- [security deposit law massachusetts 30 days]
- [security deposit interest massachusetts]
- [massachusetts tenant rights security deposit]
- [security deposit demand letter massachusetts]
- [chapter 93a demand letter]

Geo targeting is MA-only, so the unqualified Tier 1 phrases are safe and carry the volume. Keep Tier 1 and Tier 2 as separate ad groups if you want per-tier cost data; one ad group is fine for a first pass.

**Negative keywords (campaign level):** direct deposit, pet deposit, car, deposit slip, how much security deposit, application fee, landlord insurance, commercial lease. (Exact match keeps most junk out; these catch close-variant drift.)

## Ad copy (one Responsive Search Ad; all within limits, rule-compliant: hedged, no outcome promises, no em dashes)

**Headlines (30 char max each):**

1. Landlord Kept Your Deposit?
2. MA Security Deposit Check
3. Free 2 Minute Analysis
4. Know Your Rights Under MA Law
5. Deposit Late or Reduced?
6. See What MA Law May Allow
7. Strict MA Deposit Rules
8. Free Check, No Sign Up
9. Demand Letter Kit, $49
10. Built for MA Renters

**Descriptions (90 char max each):**

1. Answer 6 questions and see what Massachusetts law may entitle you to. Free and ungated.
2. MA deposit rules are strict. See where your landlord may have slipped. Free 2 min check.
3. If your deposit came back late or short, MA law may be on your side. Check in 2 minutes.
4. Optional $49 kit: a personalized demand letter, mailed by certified mail for you.

**Display path:** deposit-defenders.com/**MA**/**Deposits**

Pin nothing (let Google combine), except optionally pin headline 1 or 2 to position 1.

## While it runs (2 minutes a day)

- Day 2: check Search Terms report (Insights > Search terms). Add negatives for anything irrelevant that slipped in.
- Watch average CPC. If it runs over ~$5, lower the bid cap or pause Tier 2.
- Do not accept any recommendation prompts. Dismiss them.

## Readout (after $150 spent or 2 weeks, whichever first)

Run `npm run funnel` and read the `src=gads` column:

| Signal | Reading | Next move |
|---|---|---|
| Low landed -> viewed_analysis | Landing page mismatch with search intent | Iterate hero copy for searchers |
| Good viewed_analysis, low clicked_kit | Analysis persuades but offer does not | Iterate /kit page and offer framing |
| Good clicked_kit, no purchased | Willingness-to-pay problem | Price/checkout iteration, the big question |
| 1+ purchases | Validation from strangers | Raise budget, keep iterating |

Any of these outcomes is a win for the test: each one tells us exactly where to work next.
