# Runbook: renaming the product

**Written:** 2026-08-15. **Status:** not yet executed; the new name is not chosen.

Replace `NEWNAME` and `newname.com` throughout with the chosen name. Everything here is
name-independent, so this runbook stays valid whichever candidate wins.

**Why this is happening:** see the 2026-08-15 section of `HANDOFF.md`. Short version: a
competitor went live on `depositdefenders.com`, owns the exact-match `.com`, and outranks us
on our own name. Every backlink and press mention we earn under the old name feeds them.

**The deadline is the September outreach push, not a calendar date.** Everything through
Phase 6 is reversible in minutes. Press coverage, Reddit comments, and backlinks are not.
Lock the name before those land.

---

## Phase 0: before spending anything

- [ ] **Spell-back test.** Text the finalists to five people with no context. Ask them to spell
      each back and say what they think the company does. Catches misspellings, dead metaphors,
      and unintended words hiding inside the name. One hour, and it is the highest-value check
      available.
- [ ] **Sit 48 hours.** Strange on day one and fine on day three is fine, that is just
      unfamiliarity. Still wrong on day three means it is wrong.

## Phase 1: buy and park (zero risk)

- [ ] Buy `newname.com`. Re-verify availability first; it moves.
      `curl -s -o /dev/null -w "%{http_code}" https://rdap.verisign.com/com/v1/domain/newname.com`
      returns 404 when available. **`whois` on port 43 is blocked on this network**, which looks
      like every domain is free. Use RDAP over HTTPS.
- [ ] Optionally buy the `.net` and `get<newname>.com` defensively, about $12 each.
- [ ] **Do not cancel `deposit-defenders.com`.** The redirect depends on owning it. Keep it at
      least 12 months; Google wants a year on a change of address. It is roughly $20/yr, which is
      the cheapest brand insurance available.

## Phase 2: serve both domains at once (still zero risk)

- [ ] Vercel > project > Settings > Domains > add `newname.com`. Add the DNS records Vercel
      returns, at the registrar (DNS currently lives at Squarespace).
- [ ] Confirm `https://newname.com` loads. Both domains now serve the live site. Nothing has
      moved yet and nothing can break.

## Phase 3: email (start early, this is the long pole)

- [ ] Resend > add `newname.com` as a sending domain. Add the DKIM and SPF records at the
      registrar.
- [ ] Wait for verification. Minutes to hours.
- [ ] **Do not change `RESEND_FROM_EMAIL` yet.**
- [ ] Once verified, send a test from `letters@newname.com` and confirm delivery.

## Phase 4: flip the app

- [ ] Merge the `SITE_NAME` work if it is not already on `main` (`lib/site.ts`, `lib/site.test.ts`).
- [ ] Vercel > Environment Variables > Production:
      - `NEXT_PUBLIC_SITE_NAME` = `NEWNAME`
      - `NEXT_PUBLIC_SITE_URL` = `https://newname.com`
      - `RESEND_FROM_EMAIL` = `NEWNAME <letters@newname.com>`
- [ ] **Redeploy.** Required, not optional: `NEXT_PUBLIC_*` values are inlined at build time, so
      an env change alone does nothing until the app is rebuilt.
- [ ] Verify the header wordmark, `/terms`, `/faq`, `/kit`, and `/opengraph-image` (the OG images
      regenerate from `SITE_NAME` automatically).

## Phase 5: Stripe webhook

- [ ] Stripe > Developers > Webhooks > **edit the existing live endpoint in place**, changing the
      URL to `https://newname.com/api/webhooks/stripe`.
- [ ] **Edit, do not recreate.** A new endpoint issues a new signing secret, which would require
      updating `STRIPE_WEBHOOK_SECRET` in Vercel. Editing preserves it.
- [ ] Confirm a successful delivery in Stripe's recent-deliveries list.
- [ ] Optional: Stripe > Settings > Branding, for the checkout page name and logo.

## Phase 6: the 301 (last, and only once everything above works)

- [ ] Vercel > Domains > set `deposit-defenders.com` to **redirect** to `newname.com`.
- [ ] Verify the apex redirects: `deposit-defenders.com` returns 301 to `newname.com`.
- [ ] Verify a deep link keeps its path: `/guide/massachusetts-security-deposit-law`.
- [ ] **Verify a workspace link survives with its query string intact:**
      `deposit-defenders.com/kit/success?session_id=cs_...`. A buyer must always reach their
      workspace; that is a non-negotiable invariant.

> **Why the redirect goes last.** Stripe treats a 3xx on a webhook as a delivery failure rather
> than following it. While both domains serve the app directly, the old webhook URL keeps working
> throughout the migration. Redirect before Phase 5 and fulfillment breaks.

## Phase 7: search and outreach

- [ ] Search Console: add `newname.com` as a new **Domain** property, verify, submit the sitemap.
- [ ] Search Console: on the old property, use the **Change of Address** tool to point at the new
      one. This is the mechanism that transfers ranking signals. It requires both properties
      verified and the site-wide 301 already live, so it must come after Phase 6.
- [ ] Email the nine press and legal-aid contacts from the 2026-08-03 outreach round with a
      one-line note.
- [ ] Update destination URLs in the (paused) Google Ads account and any live `?src=` links.

## Phase 8: cleanup

- [ ] `package.json` name field, `.env.local` locally, optionally the Vercel project name.
- [ ] Update `CLAUDE.md` and `HANDOFF.md`: the URL in the opening line, `letters@...` in the stack
      section, the webhook URL, and the rename note itself.
- [ ] New `app/icon.svg` and `app/apple-icon.png` if the visual mark changes. **Favicons cache
      hard**; test in a private window.
- [ ] Leave the GitHub repo name alone until everything else is settled. Renaming it can briefly
      disturb the Vercel git integration.

---

## Verified as needing no change

Checked against the code on 2026-08-15, so do not re-investigate these:

- **Lob.** `lib/mail/lob.ts` sets `from` to the customer's own name and address. The demand letter
  is sent by the tenant, not by us, so there is no company return address anywhere in it.
- **The demand letter, kit PDF, and small-claims draft.** None of them carry company branding.
- **Stripe checkout success and cancel URLs.** `app/api/checkout/route.ts:27` derives `origin`
  from the request, so they follow whichever domain served the page.

## Rollback

Through Phase 5, revert by setting the three env vars back and redeploying; the old domain is
still serving directly, so nothing external has moved. After Phase 6, also remove the redirect.
After Phase 7, rollback is no longer clean: the Change of Address tool and any external mentions
have propagated.
