# Professional cleaning clause detection (Design Spec)

**Date:** 2026-08-01
**Status:** Approved from brainstorming; ready for `superpowers:writing-plans`.
**Prereq reading:** `CLAUDE.md` (legal-safety rules are non-negotiable), the Peebles memory note, `lib/statute/ma.ts` (rules R3 and R7 are the two precedents that matter here), `components/flow/steps.tsx`, `lib/letter/template.ts`.

## Why this exists

Peebles v. JRK Property Holdings, Inc., SJC-13702 (Aug. 1, 2025) held that a lease provision requiring the unit be returned in "professionally cleaned" condition, **on penalty of** security-deposit deductions for cleaning, painting, or repairs regardless of whether the damage is reasonable wear and tear, conflicts with M.G.L. c. 186, §15B(4) and is **void and unenforceable under §15B(8)**.

The product cites Peebles for wear and tear already (rules R5 and R7, plus the letter's disputed-charges paragraph), but has no way to know whether a given tenant's lease contained such a clause, because the intake flow never asks. These clauses are common in Boston-area leases and were the single most active Massachusetts tenant discussion on Reddit in late July 2026.

This is a deliberate exception to the "no new features" rule of the current marketing/validation phase. It is justified by real customer-adjacent demand signal and because it strengthens the paid product's core deliverable.

## What Peebles does and does not support

Getting this boundary right is the whole design constraint.

**Settled by Peebles, safe to assert:** such a clause conflicts with §15B(4) and is void and unenforceable under §15B(8). It follows that a deduction taken under that clause is improper.

**Expressly NOT decided, must never be asserted:**
- Footnote 8: the Court expressly declined to rule on a **stand-alone** cleaning requirement not tied to deposit deductions.
- The Court expressly declined to decide whether merely including such a clause triggers **§15B(6)(c) forfeiture** of the right to retain any portion of the deposit. The defendants argued no "attempt to enforce" occurred; the question was not briefed and the Court "express[ed] no view."

Because forfeiture is undecided, **this feature adds zero dollars to exposure.**

## Settled decisions

1. **Zero dollars.** The rule is informational and citable, following the R7 precedent, not the R3 precedent that forfeits deductions and changes `entitledBalance`. Asserting a dollar figure here would mean answering a question the SJC refused to answer.
2. **A field, not a step.** The question is added inside the existing "Deductions and refund" step. The landing page promises "six quick questions" and 73% of July's paid clicks never started the flow, so lengthening it is the wrong trade.
3. **No second question about the penalty element.** Whether the clause was tied to charges is inferred from data already collected (see below) rather than asked, because it is a legal distinction a layperson cannot reliably make about their own lease.

## Data model

One new field on `FlowAnswers` (`lib/flow/types.ts`):

```ts
leaseRequiredProfessionalCleaning: TriState | null;
```

Defaulting to `null` in `initialFlowAnswers`, matching every other tri-state paperwork field. It flows into `TenancyInputs` via `lib/flow/toTenancyInputs.ts` in the same way as `receivedBankReceipt` and `receivedStatementOfCondition`.

**Backward compatibility:** existing `kit_orders.answers` snapshots predate this field, so it will be `undefined` when older orders are re-rendered. `toTenancyInputs` must coerce a missing value to the same result as "not sure" so that no previously purchased letter changes retroactively and nothing throws. This matters because `lib/letter/fromOrder.ts` rebuilds every buyer's letter from their stored snapshot on every read.

## Intake question

Rendered as a `TriStateField` (Yes / No / Not sure) in the "Deductions and refund" step:

> **Did your lease require you to have the unit professionally cleaned when you moved out?**
> Help text: *Often in a move-out addendum, sometimes with a list of charges if you don't.*

Deliberately a factual question about what the lease says. The legal nuance lives in the rule's explanation, not in the tenant's answer.

## The rule: `R8_PROFESSIONAL_CLEANING_CLAUSE`

Lives in `lib/statute/ma.ts`. Triggers when `leaseRequiredProfessionalCleaning === "yes"`.

Severity depends on whether the clause was apparently enforced, which is inferred from existing data: whether any claimed deduction was classified `commonly_contestable` by the existing wear-and-tear classifier (cleaning, painting, carpet, refurbishment, and similar).

- **Clause + at least one contestable deduction** → severity `medium`. This is the Peebles fact pattern: the clause exists and the landlord charged under it.
- **Clause + no contestable deduction** → severity `low`, and the explanation states plainly that the Court expressly declined to address a stand-alone cleaning requirement not tied to deposit deductions.

**Citation:** `M.G.L. c. 186, §15B(4), §15B(8); Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025)`

**Exposure:** unchanged. The rule must not touch `entitledBalance`, `deductionsForfeited`, or any exposure field.

**Copy constraints:** never assert §15B(6)(c) forfeiture; never claim all professional-cleaning requirements are unlawful; keep the hedged register used throughout (`may`, `can expose the landlord to`, `commonly contestable`).

## Analysis screen

No new UI. The rule renders through the existing violation-card machinery in `components/analysis/AnalysisResult.tsx`, inheriting the brand-green "your leverage" styling and the severity badge treatment automatically.

## Demand letter

When triggered, one paragraph is added, grouped with the existing wear-and-tear dispute paragraph in `lib/letter/template.ts` so the cleaning argument reads alongside the charges it relates to:

> My lease required the unit to be returned in professionally cleaned condition. In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025), the Supreme Judicial Court held that such a provision, where it imposes charges for cleaning, painting, or repairs regardless of whether the damage is reasonable wear and tear, conflicts with M.G.L. c. 186, §15B(4) and is void and unenforceable under §15B(8). Any deduction taken under that provision is therefore improper.

Like the wear-and-tear paragraph, this flows into the combined §15B + 93A letter automatically, because `buildCombinedDemandLetter` keeps the base letter's body via `paragraphs.slice(1, -1)`.

## Testing

Following existing conventions (colocated tests, pure-function unit tests, no live network or DB):

- `lib/statute/ma.test.ts`: rule triggers on `"yes"` and not on `"no"`, `"unknown"`, or `null`; severity is `medium` with a contestable deduction present and `low` without; **exposure figures are byte-for-byte identical whether or not the rule fires**; the citation includes both §15B(8) and the Peebles docket.
- A test asserting the rule's `explanation` and `plainTerms` never contain "forfeit" (the one overclaim this feature could plausibly drift into).
- `lib/letter/template.test.ts`: paragraph present when triggered, absent otherwise, present in the combined 93A letter, and never asserting forfeiture.
- `lib/flow/toTenancyInputs.test.ts`: a snapshot missing the field entirely behaves as "not sure" and does not throw.
- Existing no-em-dash content tests continue to pass.

## Non-goals

- Does not ask the tenant to upload or paste their lease.
- Does not attempt to classify clause text; it asks a yes/no/not-sure question.
- Does not change pricing, the exposure math, or any existing rule's behavior.
- Does not add a seventh flow step.
