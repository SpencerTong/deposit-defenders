# Pre-mail answer editing (Design Spec)

**Date:** 2026-07-28
**Status:** Approved from brainstorming; ready for `superpowers:writing-plans`.
**Prereq reading:** `CLAUDE.md`, `lib/letter/fromOrder.ts`, `lib/db/kitOrders.ts`, `app/api/kit/letter-details/route.ts`, `components/kit/LetterDetailsForm.tsx`, `components/flow/steps.tsx`.

## Why this exists

On 2026-07-27 a paying customer (Mary Kirnon) had her deposit amount ($3,100 instead of $2,000, a typo from the pre-purchase question flow) baked into a letter that had already been mailed certified. There was no self-serve way for her to catch or fix this: the `/kit/success` workspace lets buyers edit `letterDetails` (names/addresses) but never surfaces or allows editing of `kit_orders.answers` (the deposit amount, dates, and other facts that actually drive the legal claims and demand math). Fixing it required a manual production-DB correction by the owner. This feature closes that gap for future buyers.

## Goal

Let a buyer review and correct their original question-flow answers from their own workspace, any time before their letter is mailed, with the same validation the intake flow already applies. Once mailing starts, both this and the existing "Edit details" step lock, server-side, not just in the UI.

## Non-goals

- Does **not** add self-serve re-mailing after a letter is `sent`. That stays a manual admin DB action by design (Lob cost control) — this feature only prevents the *need* for one caused by uncaught pre-mail typos, it doesn't change the one-mailing-per-order invariant.
- Does not touch `letterDetails` field content or validation, only adds the same lock check that already gates the new answers editor.
- Does not add accounts, notifications, or any UI beyond the `/kit/success` workspace.

## Architecture

### Component: `components/kit/AnswersSummaryForm.tsx`
New component, sibling to `LetterDetailsForm.tsx`. Props: `sessionId: string`, `initial: FlowAnswers`, `onSaved: () => void`.
- Local `useState<FlowAnswers>` seeded from `initial`.
- Renders every `flowSteps[i].title` as a section heading with `flowSteps[i].render(answers, update)` beneath it, stacked in one scroll — reuses the existing `NumberField`/`DateField`/`TriStateField`/`YesNoField`/`DeductionsEditor` components and their behavior verbatim. No new field UI.
- Save button disabled unless `flowSteps.every(s => s.isValid(answers))` (the same per-field validity predicates used at intake, ANDed across all six steps instead of gated step-by-step).
- On save: `POST /api/kit/answers` with `{ sessionId, answers }`; on `{ ok: true }`, call `onSaved()`.

### `components/kit/KitSuccessClient.tsx` changes
- New **Step 0** ("Your answers"), positioned above the existing "Letter details" step, using the identical collapsed-summary / expanded-edit-form toggle already used for `letterDetails` (see mockup, approved 2026-07-28):
  - Collapsed: one-paragraph plain-English summary (deposit, rent, tenancy dates, paperwork received y/n, deductions count + total, amount returned, interest) + "Edit answers" link.
  - Expanded: `AnswersSummaryForm`.
  - Locked (`mailStatus !== "unsent"`): collapsed summary only, no edit link, replaced with "Your letter has already been mailed, so these answers are locked and can no longer be edited. Contact support if something here was wrong."
- `OrderInfo` (client-side type) gains `answers: FlowAnswers`. `/api/kit/order` response gains the same field (`mailStatus` is already returned).
- The existing "Edit details" step gets the same lock treatment: hide/disable the "Edit details" link once `mailStatus !== "unsent"`, with equivalent locked-state copy.

## Data flow, API, and locking

### New route: `app/api/kit/answers/route.ts`
Mirrors `app/api/kit/letter-details/route.ts`:
1. `loadPaidOrder(sessionId)` for access (same as every other kit route).
2. **Server-side lock check** (the actual enforcement — the UI hiding the button is just the friendly version): if `order.mailStatus !== "unsent"`, return `423 Locked` before parsing or writing anything.
3. Parse the request body into a candidate `FlowAnswers`, reusing `flowSteps[i].isValid` per field (numbers non-negative, dates present, `itemizedListDate`/`listSwornUnderPenalty` only required when `receivedItemizedList` is true, etc.) — same predicates the intake flow uses, not reimplemented.
4. Invalid → `400`. Valid → `setKitOrderAnswers(order.id, parsed)` → `{ ok: true }`.

### `app/api/kit/letter-details/route.ts` change
Add the identical `mailStatus !== "unsent"` → `423` check at the top, before `parseDetails`. Closes the existing gap where letter details remain editable after mailing.

### `lib/db/kitOrders.ts` addition
```ts
export async function setKitOrderAnswers(id: string, answers: FlowAnswers): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `UPDATE kit_orders
     SET answers_history = answers_history || jsonb_build_array(
           jsonb_build_object('answers', answers, 'replaced_at', now())
         ),
         answers = $2
     WHERE id = $1`,
    [id, JSON.stringify(answers)]
  );
}
```
One query: appends the *current* (about-to-be-overwritten) `answers` onto `answers_history` with a timestamp, then overwrites `answers`. `getKitOrderById`/`getKitOrderBySessionId` need no changes — `answers_history` isn't read anywhere in the buyer-facing path, only ever written; it exists purely as an audit trail should a landlord dispute what was claimed, or a buyer dispute what they entered.

### Migration (`scripts/migrate.mjs`)
Additive, matches the file's existing idempotent style:
```sql
ALTER TABLE kit_orders
  ADD COLUMN IF NOT EXISTS answers_history JSONB NOT NULL DEFAULT '[]'::jsonb;
```

## Why `buildLetterForOrder` needs no changes

`lib/letter/fromOrder.ts` already rebuilds the letter fresh from `order.answers` + `order.letterDetails` on every call (preview, PDF, docx, mail). Correcting `answers` via this new route is automatically reflected everywhere the letter is rendered — this is the same mechanism that made the manual Mary Kirnon DB fix work without touching any letter-generation code.

## Testing

Following this codebase's existing pattern (colocated `route.test.ts`, pure-function unit tests, no live network calls):
- `app/api/kit/answers/route.test.ts`: valid edit persists and is reflected in a subsequent `buildLetterForOrder` call; edit rejected `423` once `mailStatus` isn't `unsent`; invalid payload (e.g. negative deposit, missing required date) rejected `400`; `answers_history` gains exactly one entry per successful edit, preserving the prior value.
- `app/api/kit/letter-details/route.test.ts`: add the same `423`-once-mailed case.
- No new tests needed for `lib/letter/fromOrder.ts` — already covered by `fromOrder.test.ts`, and this feature doesn't change its behavior, only what's stored upstream of it.

## Rollout

Standard Vercel preview-then-promote flow, nothing bespoke:
1. Build on a branch; verify locally with `npm run dev` — fill the flow, buy a test kit (Stripe test mode), confirm Step 0 appears, edit an answer, confirm the letter preview recalculates, confirm it locks after a test mail (Lob test key).
2. Push → Vercel preview deployment → sanity-check the preview URL end to end before merging.
3. Merge to `main` only when there's no `kit_orders` row with `status = 'paid'` AND `mail_status = 'unsent'` created in roughly the last hour (i.e., no customer plausibly mid-session on `/kit/success` right now). If one exists, wait until it clears (mailed, or enough time has passed) before merging. This is the general practice going forward for any change touching `/kit/success` or its API routes, not just this one.
