# Professional Cleaning Clause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ask whether the tenant's lease required professional cleaning at move-out, and when it did, surface a citable §15B(8) finding backed by Peebles and add a paragraph to the demand letter, without changing the dollar figure.

**Architecture:** One new tri-state field flows from `FlowAnswers` through `toTenancyInputs` into `TenancyInputs`, where a new informational rule `R8_PROFESSIONAL_CLEANING_CLAUSE` reads it alongside the deduction flags the engine already computes. The letter gains a conditional paragraph. Nothing touches exposure math.

**Tech Stack:** TypeScript, Next.js 14 App Router, Vitest. No new dependencies.

## Global Constraints

- **Never assert §15B(6)(c) forfeiture.** Peebles expressly declined to decide whether including such a clause triggers it ("we express no view"). The settled holding is only that the clause is void and unenforceable under §15B(8).
- **Never claim all professional-cleaning requirements are unlawful.** Footnote 8 expressly reserves the stand-alone case, one not tied to deposit deductions.
- **This rule adds zero dollars.** It must not touch `entitledBalance`, `deductionsForfeited`, `outstandingBalance`, or any field of `ExposureBreakdown`.
- **No em dashes or en dashes in any user-facing copy.** Use commas or periods.
- **Hedged register only:** "may", "can expose the landlord to", "commonly contestable". No outcome promises.
- Exact citation string, used verbatim: `M.G.L. c. 186, §15B(4), §15B(8); Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025)`
- Test conventions: colocated `*.test.ts`, Vitest, pure functions, no live DB or network. `vitest.config.ts` excludes `.worktrees/`, so a failure under that path is a config artifact, not real.

---

### Task 1: Thread the new field through the data model

**Files:**
- Modify: `lib/flow/types.ts`
- Modify: `lib/statute/ma.ts` (the `TenancyInputs` interface only)
- Modify: `lib/flow/toTenancyInputs.ts`
- Modify: `app/api/kit/answers/route.ts`
- Test: `lib/flow/toTenancyInputs.test.ts`

**Interfaces:**
- Produces: `FlowAnswers.leaseRequiredProfessionalCleaning: TriState | null`, and `TenancyInputs.leaseRequiredProfessionalCleaning: TriState` (required, already coerced). Tasks 2, 3 and 4 all read these.

**Why the API route is in this task:** `parseAnswers` in `app/api/kit/answers/route.ts` rebuilds a whitelisted object rather than spreading the input. If the new field is not parsed there, a buyer who edits their answers in the workspace silently loses their cleaning answer and their letter changes underneath them. TypeScript will flag it because the function is annotated `: FlowAnswers | null`, but it must be handled properly, not stubbed.

- [ ] **Step 1: Write the failing test**

Add to `lib/flow/toTenancyInputs.test.ts`:

```ts
it("maps the professional cleaning answer through", () => {
  const answers = { ...initialFlowAnswers, leaseRequiredProfessionalCleaning: "yes" as const };
  expect(toTenancyInputs(answers).leaseRequiredProfessionalCleaning).toBe("yes");
});

it("treats a snapshot saved before this field existed as not sure", () => {
  // kit_orders.answers rows predate the field, and fromOrder.ts rebuilds every
  // buyer's letter from that stored snapshot on each read.
  const legacy = { ...initialFlowAnswers } as Record<string, unknown>;
  delete legacy.leaseRequiredProfessionalCleaning;

  const result = toTenancyInputs(legacy as FlowAnswers);

  expect(result.leaseRequiredProfessionalCleaning).toBe("unknown");
});
```

Ensure the file imports `initialFlowAnswers` and the `FlowAnswers` type from `@/lib/flow/types` (add to the existing import if absent).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/flow/toTenancyInputs.test.ts`
Expected: FAIL, the property does not exist on the types.

- [ ] **Step 3: Add the field to `FlowAnswers` and its default**

In `lib/flow/types.ts`, add to the `FlowAnswers` interface (after `interestPaidAnnually`):

```ts
  leaseRequiredProfessionalCleaning: TriState | null;
```

And to `initialFlowAnswers`:

```ts
  leaseRequiredProfessionalCleaning: null,
```

- [ ] **Step 4: Add the field to `TenancyInputs`**

In `lib/statute/ma.ts`, add to the `TenancyInputs` interface (after `interestPaidAnnually: TriState;`):

```ts
  leaseRequiredProfessionalCleaning: TriState;
```

- [ ] **Step 5: Map it in `toTenancyInputs`**

In `lib/flow/toTenancyInputs.ts`, add to the returned object:

```ts
    leaseRequiredProfessionalCleaning: toTriState(answers.leaseRequiredProfessionalCleaning),
```

The existing `toTriState` helper is `value ?? "unknown"`, which is exactly the legacy-snapshot behavior the second test asserts. Do not add special handling.

- [ ] **Step 6: Parse it in the kit answers route**

In `app/api/kit/answers/route.ts`, inside `parseAnswers`, add the parse alongside the other tri-states:

```ts
  const leaseRequiredProfessionalCleaning = parseTriStateOrNull(a.leaseRequiredProfessionalCleaning);
```

Add it to the INVALID guard:

```ts
  if (
    receivedBankReceipt === INVALID ||
    receivedStatementOfCondition === INVALID ||
    listSwornUnderPenalty === INVALID ||
    interestPaidAnnually === INVALID ||
    leaseRequiredProfessionalCleaning === INVALID
  ) {
    return null;
  }
```

And to the returned object:

```ts
    leaseRequiredProfessionalCleaning: leaseRequiredProfessionalCleaning as TriState | null,
```

- [ ] **Step 7: Fix every fixture the compiler now rejects**

Run: `npm run type-check`

`TenancyInputs` and `FlowAnswers` are constructed in many test fixtures, and the compiler will list each one precisely. This is intentional: every construction site should be considered rather than silently defaulted. For each error, add the field with a value that preserves that fixture's existing intent:

- For `TenancyInputs` fixtures, add `leaseRequiredProfessionalCleaning: "no",`
- For `FlowAnswers` fixtures, add `leaseRequiredProfessionalCleaning: null,`

`"no"` is deliberate for `TenancyInputs`: `lib/statute/ma.test.ts` has a clean-case test asserting **every** rule is untriggered, and `"unknown"` would keep that passing too, but `"no"` states the fixture's intent explicitly. Do not use `"yes"` in any existing fixture, it would trigger the new rule and change other suites' expectations.

Repeat `npm run type-check` until clean.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: all pass, including the two new `toTenancyInputs` tests.

- [ ] **Step 9: Commit**

```bash
git add lib/flow/types.ts lib/statute/ma.ts lib/flow/toTenancyInputs.ts lib/flow/toTenancyInputs.test.ts app/api/kit/answers/route.ts
git add -u
git commit -m "feat: thread lease professional-cleaning answer through the data model

Includes parsing in the kit answers route, without which a buyer editing
their answers post-purchase would silently drop the field."
```

---

### Task 2: Ask the question in the existing deductions step

**Files:**
- Modify: `components/flow/steps.tsx`
- Test: `lib/flow/validation.test.ts`

**Interfaces:**
- Consumes: `FlowAnswers.leaseRequiredProfessionalCleaning` from Task 1.

The field goes inside the existing `"deductions"` step, not a new step. The landing page copy promises "six quick questions", and 73% of July's paid clicks never started the flow, so lengthening it is the wrong trade. The answer is optional, matching the move-in paperwork tri-states, so step validity must not change.

- [ ] **Step 1: Write the failing test**

Add to `lib/flow/validation.test.ts`:

```ts
it("does not require the professional cleaning answer to advance", () => {
  const withAnswer: FlowAnswers = {
    ...complete,
    leaseRequiredProfessionalCleaning: "yes",
  };
  const withoutAnswer: FlowAnswers = {
    ...complete,
    leaseRequiredProfessionalCleaning: null,
  };

  expect(isCompleteFlowAnswers(withoutAnswer)).toBe(true);
  expect(isCompleteFlowAnswers(withAnswer)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it passes already**

Run: `npx vitest run lib/flow/validation.test.ts`
Expected: PASS immediately. This test is a regression guard, not a red test. `flowFieldValidity["deductions"]` only checks `amountReturned`, so an optional field is already correct. The test exists so a future change that makes the question mandatory fails loudly.

- [ ] **Step 3: Render the field in the deductions step**

In `components/flow/steps.tsx`, change the `"deductions"` step's `render` from a bare `DeductionsEditor` to a fragment containing it plus the new question. `TriStateField` is already imported in this file.

```tsx
  {
    id: "deductions",
    title: "Deductions and refund",
    render: (answers, update) => (
      <>
        <DeductionsEditor answers={answers} update={update} />
        <TriStateField
          label="Did your lease require you to have the unit professionally cleaned when you moved out?"
          helpText="Often in a move-out addendum, sometimes with a list of charges if you don't."
          value={answers.leaseRequiredProfessionalCleaning}
          onChange={(v) => update({ leaseRequiredProfessionalCleaning: v })}
        />
      </>
    ),
    isValid: flowFieldValidity["deductions"],
  },
```

- [ ] **Step 4: Verify the suite and types**

Run: `npm test && npm run type-check`
Expected: all pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add components/flow/steps.tsx lib/flow/validation.test.ts
git commit -m "feat: ask about professional cleaning clauses in the deductions step"
```

---

### Task 3: The `R8_PROFESSIONAL_CLEANING_CLAUSE` rule

**Files:**
- Modify: `lib/statute/ma.ts`
- Test: `lib/statute/ma.test.ts`

**Interfaces:**
- Consumes: `TenancyInputs.leaseRequiredProfessionalCleaning` (Task 1), and the `deductionFlags` array the R5 block already builds.
- Produces: a rule with `id: "R8_PROFESSIONAL_CLEANING_CLAUSE"` in `AnalysisResult.rules`.

**Placement matters:** this rule reads `deductionFlags`, which is built inside the R5 block. Insert it **after** the R5 `rules.push({...})` call and **before** the `// Forfeited deductions (R3)` comment near line 265. It will therefore render last among violations on the analysis screen, which is appropriate for a low/medium supporting claim.

- [ ] **Step 1: Write the failing tests**

Add to `lib/statute/ma.test.ts`:

```ts
describe("R8 professional cleaning clause", () => {
  it("does not trigger when the lease had no cleaning requirement", () => {
    const result = analyzeTenancy(baseInputs({ leaseRequiredProfessionalCleaning: "no" }));
    expect(ruleById(result, "R8_PROFESSIONAL_CLEANING_CLAUSE").triggered).toBe(false);
  });

  it("does not trigger when the tenant is unsure", () => {
    const result = analyzeTenancy(baseInputs({ leaseRequiredProfessionalCleaning: "unknown" }));
    expect(ruleById(result, "R8_PROFESSIONAL_CLEANING_CLAUSE").triggered).toBe(false);
  });

  it("is a supporting claim when the clause exists but nothing was charged under it", () => {
    const result = analyzeTenancy(
      baseInputs({ leaseRequiredProfessionalCleaning: "yes", deductionsClaimed: [] })
    );
    const rule = ruleById(result, "R8_PROFESSIONAL_CLEANING_CLAUSE");
    expect(rule.triggered).toBe(true);
    expect(rule.severity).toBe("low");
    // The Court reserved the stand-alone case, so say so.
    expect(rule.explanation).toContain("did not decide");
  });

  it("is stronger when a contestable charge was actually taken under the clause", () => {
    const result = analyzeTenancy(
      baseInputs({
        leaseRequiredProfessionalCleaning: "yes",
        deductionsClaimed: [{ description: "Carpet cleaning", amount: 150 }],
      })
    );
    const rule = ruleById(result, "R8_PROFESSIONAL_CLEANING_CLAUSE");
    expect(rule.triggered).toBe(true);
    expect(rule.severity).toBe("medium");
    expect(rule.citation).toContain("§15B(8)");
    expect(rule.citation).toContain("SJC-13702");
  });

  it("adds no dollars to the claim", () => {
    const without = analyzeTenancy(
      baseInputs({
        leaseRequiredProfessionalCleaning: "no",
        deductionsClaimed: [{ description: "Carpet cleaning", amount: 150 }],
      })
    );
    const with_ = analyzeTenancy(
      baseInputs({
        leaseRequiredProfessionalCleaning: "yes",
        deductionsClaimed: [{ description: "Carpet cleaning", amount: 150 }],
      })
    );
    expect(with_.exposure).toEqual(without.exposure);
  });

  it("never claims forfeiture, which Peebles expressly left undecided", () => {
    const result = analyzeTenancy(baseInputs({ leaseRequiredProfessionalCleaning: "yes" }));
    const rule = ruleById(result, "R8_PROFESSIONAL_CLEANING_CLAUSE");
    expect(rule.explanation.toLowerCase()).not.toContain("forfeit");
    expect(rule.plainTerms.toLowerCase()).not.toContain("forfeit");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/statute/ma.test.ts`
Expected: FAIL with `rule R8_PROFESSIONAL_CLEANING_CLAUSE not found in result`.

- [ ] **Step 3: Implement the rule**

In `lib/statute/ma.ts`, insert after the R5 `rules.push({...})` and before the `// Forfeited deductions (R3)` comment:

```ts
  // R8 -- lease clause requiring professional cleaning at move-out, §15B(8).
  // Informational like R7: adds zero dollars. Peebles v. JRK Property Holdings,
  // SJC-13702 (Aug. 1, 2025) settles that such a clause is void where it imposes
  // deposit deductions regardless of reasonable wear and tear, but expressly
  // reserved the stand-alone case (n.8) and expressly declined to decide whether
  // including the clause triggers §15B(6)(c) forfeiture. Never assert forfeiture.
  const r8Triggered = input.leaseRequiredProfessionalCleaning === "yes";
  const cleaningChargeTaken = contestableCount > 0;
  rules.push({
    id: "R8_PROFESSIONAL_CLEANING_CLAUSE",
    triggered: r8Triggered,
    title: "Lease required professional cleaning at move-out",
    explanation: !r8Triggered
      ? "No lease provision requiring professional cleaning at move-out was reported."
      : cleaningChargeTaken
        ? "In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Aug. 1, 2025), the Supreme Judicial Court held that a lease provision requiring the unit be returned in professionally cleaned condition, on penalty of charges for cleaning, painting, or repairs regardless of whether the damage is reasonable wear and tear, conflicts with §15B(4) and is void and unenforceable under §15B(8). A charge of that kind appears among the deductions taken here, so any amount withheld under such a provision may be improper."
        : "In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Aug. 1, 2025), the Supreme Judicial Court held that a lease provision requiring professionally cleaned condition, on penalty of deposit deductions regardless of reasonable wear and tear, is void and unenforceable under §15B(8). No cleaning or painting charge was reported among the deductions here, and the Court did not decide whether a stand-alone cleaning requirement, one not backed by deposit deductions, raises the same problem.",
    plainTerms: !r8Triggered
      ? "No professional cleaning requirement was reported."
      : cleaningChargeTaken
        ? "In plain terms: a lease cannot make you pay for cleaning or painting that is just normal wear from living there, and it looks like you were charged for exactly that."
        : "In plain terms: a clause like this cannot be used to take cleaning or painting costs out of your deposit. You were not charged that way here, so this mainly supports the rest of your claim.",
    citation:
      "M.G.L. c. 186, §15B(4), §15B(8); Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025)",
    severity: r8Triggered ? (cleaningChargeTaken ? "medium" : "low") : "info",
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/statute/ma.test.ts`
Expected: PASS, including the exposure-equality and no-forfeiture assertions.

- [ ] **Step 5: Run the full suite**

Run: `npm test && npm run type-check`
Expected: all pass. The clean-case test still passes because every existing fixture sets `"no"`.

- [ ] **Step 6: Commit**

```bash
git add lib/statute/ma.ts lib/statute/ma.test.ts
git commit -m "feat: add R8 professional cleaning clause rule, zero dollars

Cites Peebles for the settled 15B(8) holding and stays inside its limits:
never asserts 15B(6)(c) forfeiture, and states plainly that the stand-alone
case was left undecided."
```

---

### Task 4: The demand letter paragraph

**Files:**
- Modify: `lib/letter/template.ts`
- Test: `lib/letter/template.test.ts`

**Interfaces:**
- Consumes: the `R8_PROFESSIONAL_CLEANING_CLAUSE` rule from Task 3, read off `analysis.rules`.

Grouped with the existing `wearAndTearParagraphs` block so the cleaning argument reads next to the charges it concerns. It reaches the combined 93A letter automatically, because `buildCombinedDemandLetter` keeps the base body via `paragraphs.slice(1, -1)`.

**Note on the violations list:** R8 is a normal rule, so the existing `triggeredRules` filter (which excludes only `R5_WEAR_AND_TEAR_FLAGS`) will already recite it among the enumerated violations. That is correct and intended; this task adds the dedicated argument paragraph on top of that.

- [ ] **Step 1: Write the failing tests**

Add to `lib/letter/template.test.ts`, inside the `buildDemandLetter` describe:

```ts
it("argues the cleaning clause is unenforceable when the lease had one", () => {
  const tenancy: TenancyInputs = {
    ...violatingTenancy(),
    leaseRequiredProfessionalCleaning: "yes",
  };
  const letter = buildDemandLetter(tenancy, analyzeTenancy(tenancy, new Date("2024-02-15")));
  const para = letter.paragraphs.find((p) => p.includes("professionally cleaned condition"));

  expect(para).toBeDefined();
  expect(para).toContain("§15B(8)");
  expect(para).toContain("SJC-13702");
  expect(para).toContain("void and unenforceable");
  // Peebles expressly declined to decide forfeiture.
  expect(para!.toLowerCase()).not.toContain("forfeit");
});

it("omits the cleaning paragraph when the lease had no such clause", () => {
  const tenancy: TenancyInputs = {
    ...violatingTenancy(),
    leaseRequiredProfessionalCleaning: "no",
  };
  const letter = buildDemandLetter(tenancy, analyzeTenancy(tenancy, new Date("2024-02-15")));
  expect(
    letter.paragraphs.some((p) => p.includes("professionally cleaned condition"))
  ).toBe(false);
});
```

And inside the `buildCombinedDemandLetter` describe:

```ts
it("carries the cleaning argument into the combined letter buyers receive", () => {
  const t: TenancyInputs = { ...violatingTenancy(), leaseRequiredProfessionalCleaning: "yes" };
  const letter = buildCombinedDemandLetter(t, analyzeTenancy(t), {}, {
    ownerOccupied: false,
    today: TODAY,
  });
  expect(letter.paragraphs.join(" ")).toContain("professionally cleaned condition");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/letter/template.test.ts`
Expected: FAIL, `para` is undefined.

- [ ] **Step 3: Add the paragraph**

In `lib/letter/template.ts`, directly after the existing `wearAndTearParagraphs` declaration, add:

```ts
  const cleaningClauseTriggered = analysis.rules.some(
    (rule) => rule.id === "R8_PROFESSIONAL_CLEANING_CLAUSE" && rule.triggered
  );
  const cleaningClauseParagraphs = cleaningClauseTriggered
    ? [
        `My lease required the unit to be returned in professionally cleaned condition. ` +
          `In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025), the ` +
          `Supreme Judicial Court held that such a provision, where it imposes charges for ` +
          `cleaning, painting, or repairs regardless of whether the damage is reasonable wear ` +
          `and tear, conflicts with M.G.L. c. 186, §15B(4) and is void and unenforceable under ` +
          `M.G.L. c. 186, §15B(8). Any deduction taken under that provision is therefore ` +
          `improper.`,
      ]
    : [];
```

Then include it in the returned `paragraphs`, immediately after `...wearAndTearParagraphs`:

```ts
    paragraphs: [
      introParagraph,
      ...violationParagraphs,
      ...wearAndTearParagraphs,
      ...cleaningClauseParagraphs,
      demandParagraph,
      deadlineParagraph,
    ],
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/letter/template.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/letter/template.ts lib/letter/template.test.ts
git commit -m "feat: argue the cleaning clause is void under 15B(8) in the demand letter"
```

---

### Task 5: Whole-feature verification

**Files:** none (verification only).

- [ ] **Step 1: Full automated suite**

Run: `npm test && npm run type-check && npm run build`
Expected: all tests pass, zero type errors, build succeeds.

- [ ] **Step 2: Confirm no em or en dashes reached user-facing copy**

Run: `grep -n "[—–]" lib/statute/ma.ts lib/letter/template.ts components/flow/steps.tsx lib/flow/types.ts`
Expected: no output.

- [ ] **Step 3: Confirm the forfeiture overclaim is absent**

Run: `npx vitest run lib/statute/ma.test.ts -t "never claims forfeiture"` and `npx vitest run lib/letter/template.test.ts -t "cleaning clause is unenforceable"`
Expected: PASS.

Do not grep the source for "forfeit". R3 and R7 legitimately use the word for §15B(6)(b), which is settled and unrelated, and R8's own explanatory comment mentions the reserved forfeiture question on purpose. The assertions above check the actual user-facing strings, which is the thing that matters.

- [ ] **Step 4: Confirm exposure is untouched by the new rule**

Run: `npx vitest run lib/statute/ma.test.ts -t "adds no dollars"`
Expected: PASS. This is the single most important behavioral guarantee in the feature.

- [ ] **Step 5: Visual check of the new question**

Start the dev server (`npm run dev`), open `http://localhost:3000`, complete the flow to the "Deductions and refund" step, and confirm the new tri-state question renders below the deductions editor and that "Next" is enabled without answering it. Then answer "Yes", add a "Carpet cleaning" deduction, and confirm the analysis screen shows a "Lease required professional cleaning at move-out" card with the "Supporting claim" badge.

Note: `/letter/preview` computes entirely client-side from sessionStorage, so it works despite the known local Postgres block.

- [ ] **Step 6: Report results**

Summarize pass/fail per step. Do not deploy; the owner decides when to push.
