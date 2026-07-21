/**
 * Rules engine for M.G.L. c. 186, section 15B (Massachusetts security deposit law).
 * Statute text verified against malegislature.gov on 2026-07-05.
 *
 * Only clauses (a), (d), (e) of subsection (6) are named in subsection (7) as
 * treble-damages triggers. Clauses (b) (late/missing itemization) and (c) (unlawful
 * lease provisions) forfeit the landlord's right to retain the deposit but do not
 * by themselves invoke treble damages -- treble damages only attach if that
 * forfeiture leaves an outstanding balance the landlord then fails to return within
 * 30 days of tenancy termination, which is itself a (6)(e) violation.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ITEMIZATION_DEADLINE_DAYS = 30;
const RETURN_DEADLINE_DAYS = 30;
const ANNUAL_INTEREST_RATE = 0.05;

export type TriState = "yes" | "no" | "unknown";

export interface Deduction {
  description: string;
  amount: number;
}

export interface TenancyInputs {
  depositAmount: number;
  monthlyRent: number;
  tenancyStartDate: Date;
  moveOutDate: Date;
  tenancyEndConfirmed: boolean;
  receivedItemizedList: boolean;
  itemizedListDate?: Date;
  listSwornUnderPenalty: TriState;
  receivedBankReceipt: TriState;
  receivedStatementOfCondition: TriState;
  deductionsClaimed: Deduction[];
  amountReturned: number;
  interestPaidAnnually: TriState;
}

export type Severity = "high" | "medium" | "low" | "info";

export interface RuleResult {
  id: string;
  triggered: boolean;
  title: string;
  explanation: string;
  /** One-sentence plain-English restatement of the explanation, no citations. */
  plainTerms: string;
  citation: string;
  severity: Severity;
}

export type WearAndTearClassification =
  | "commonly_contestable"
  | "potentially_legitimate"
  | "unclear";

export interface DeductionFlag extends Deduction {
  classification: WearAndTearClassification;
  note: string;
}

export interface ExposureBreakdown {
  outstandingBalance: number;
  trebleApplies: boolean;
  trebledPrincipal: number;
  interestOwed: number;
  maxExposure: number;
  notes: string[];
}

export interface AnalysisResult {
  rules: RuleResult[];
  deductionFlags: DeductionFlag[];
  exposure: ExposureBreakdown;
}

function daysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

function fullYearsBetween(start: Date, end: Date): number {
  let years = end.getFullYear() - start.getFullYear();
  const anniversaryThisYear = new Date(start);
  anniversaryThisYear.setFullYear(start.getFullYear() + years);
  if (anniversaryThisYear.getTime() > end.getTime()) years -= 1;
  return Math.max(years, 0);
}

const CONTESTABLE_KEYWORDS = [
  "clean",
  "paint",
  "nail hole",
  "nail holes",
  "carpet clean",
  "wear and tear",
  "scuff",
  "dust",
  "touch up",
  "touch-up",
  "faded",
];

const LEGITIMATE_KEYWORDS = [
  "broken",
  "break",
  "hole in the wall",
  "smoke damage",
  "water damage",
  "pet damage",
  "burn",
  "crack",
  "missing",
  "stolen",
  "infestation",
  "mold",
  "flood",
];

function classifyDeduction(description: string): {
  classification: WearAndTearClassification;
  note: string;
} {
  const text = description.toLowerCase();

  if (CONTESTABLE_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      classification: "commonly_contestable",
      note: "Commonly contestable as ordinary wear and tear, which §15B(4) excludes from deductions. This is an informational flag, not a legal conclusion.",
    };
  }

  if (LEGITIMATE_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      classification: "potentially_legitimate",
      note: "Describes specific damage rather than ordinary wear and tear, so it may be a legitimate deduction. This is an informational flag, not a legal conclusion.",
    };
  }

  return {
    classification: "unclear",
    note: "Not enough detail to classify as ordinary wear and tear or legitimate damage. This is an informational flag, not a legal conclusion.",
  };
}

export function analyzeTenancy(
  input: TenancyInputs,
  asOfDate: Date = new Date()
): AnalysisResult {
  const rules: RuleResult[] = [];

  // R1 -- deposit exceeds one month's rent, §15B(1)(b)(iii)
  const r1Triggered = input.depositAmount > input.monthlyRent;
  rules.push({
    id: "R1_DEPOSIT_EXCEEDS_ONE_MONTH",
    triggered: r1Triggered,
    title: "Security deposit exceeds one month's rent",
    explanation: r1Triggered
      ? "The deposit collected is more than one month's rent, which §15B(1)(b)(iii) does not allow. The excess amount can be recovered, though this violation alone does not carry the statute's treble-damages remedy."
      : "The deposit collected does not exceed one month's rent.",
    plainTerms: r1Triggered
      ? "In plain terms: a Massachusetts landlord cannot collect a deposit bigger than one month's rent, so the extra amount may be owed back to you."
      : "Your deposit was within the legal limit.",
    citation: "M.G.L. c. 186, §15B(1)(b)(iii)",
    severity: r1Triggered ? "medium" : "info",
  });

  // R2 -- no escrow/bank receipt within 30 days, §15B(3)(a); forfeiture (6)(a); treble (7)
  const r2Triggered = input.receivedBankReceipt !== "yes";
  rules.push({
    id: "R2_NO_ESCROW_RECEIPT",
    triggered: r2Triggered,
    title: "No bank name/account receipt for the escrowed deposit",
    explanation: r2Triggered
      ? "The landlord did not, to the tenant's knowledge, provide a receipt naming the bank and account number holding the deposit within 30 days of receiving it, as §15B(3)(a) requires. This can forfeit the landlord's right to retain any part of the deposit and can expose the landlord to treble damages under §15B(6)(a) and §15B(7)."
      : "The landlord provided a timely receipt naming the bank and account number for the escrowed deposit.",
    plainTerms: r2Triggered
      ? "In plain terms: without proof your deposit went into a proper bank account, your landlord may have lost the right to keep any of it, and a court can order up to three times the amount."
      : "Your landlord documented the deposit's bank account as required.",
    citation: "M.G.L. c. 186, §15B(3)(a), §15B(6)(a), §15B(7)",
    severity: r2Triggered ? "high" : "info",
  });

  // R3 -- late/missing/unsworn itemized list, §15B(4); forfeiture (6)(b)
  const itemizationLate =
    input.receivedItemizedList &&
    input.itemizedListDate !== undefined &&
    daysBetween(input.moveOutDate, input.itemizedListDate) > ITEMIZATION_DEADLINE_DAYS;
  const itemizationUnsworn = input.listSwornUnderPenalty === "no";
  const itemizationMissingDespiteDeductions =
    !input.receivedItemizedList && input.deductionsClaimed.length > 0;
  const r3Triggered = Boolean(
    itemizationLate || itemizationUnsworn || itemizationMissingDespiteDeductions
  );
  rules.push({
    id: "R3_LATE_OR_MISSING_ITEMIZATION",
    triggered: r3Triggered,
    title: "Itemized list of damages missing, late, or not sworn",
    explanation: r3Triggered
      ? "§15B(4) requires an itemized list of damages, sworn under pains and penalties of perjury, within 30 days of move-out. Failing to meet this forfeits the landlord's right to keep any deductions under §15B(6)(b). Treble damages under §15B(7) apply only if the resulting balance owed is not returned within 30 days (see the late-return rule)."
      : "The itemized list of damages (if any deductions were claimed) was timely and properly sworn.",
    plainTerms: r3Triggered
      ? "In plain terms: because the damage list was missing, late, or not properly sworn, your landlord may not be allowed to keep anything for repairs, no matter what the damage was."
      : "The damage paperwork was handled properly.",
    citation: "M.G.L. c. 186, §15B(4), §15B(6)(b)",
    severity: r3Triggered ? "high" : "info",
  });

  // R5 -- wear-and-tear keyword flags on each claimed deduction, informational only, §15B(4)(iii)
  const deductionFlags: DeductionFlag[] = input.deductionsClaimed.map((deduction) => {
    const { classification, note } = classifyDeduction(deduction.description);
    return { ...deduction, classification, note };
  });
  const contestableCount = deductionFlags.filter(
    (f) => f.classification === "commonly_contestable"
  ).length;
  rules.push({
    id: "R5_WEAR_AND_TEAR_FLAGS",
    triggered: contestableCount > 0,
    title: "Deductions that commonly resemble ordinary wear and tear",
    explanation:
      contestableCount > 0
        ? `${contestableCount} of ${deductionFlags.length} claimed deduction(s) use language commonly associated with ordinary wear and tear, which §15B(4)(iii) excludes from deductions. These are informational flags based on keyword matching, not legal conclusions about any specific deduction.`
        : "None of the claimed deductions match common ordinary-wear-and-tear language. This is an informational flag based on keyword matching, not a legal conclusion.",
    plainTerms:
      contestableCount > 0
        ? "In plain terms: charges like routine cleaning or repainting are often just normal wear from living there, which cannot be taken out of a deposit."
        : "No claimed deductions matched common wear-and-tear language.",
    citation: "M.G.L. c. 186, §15B(4)(iii)",
    severity: "info",
  });

  // Forfeited deductions (R3) mean the tenant is entitled to the full deposit back.
  const deductionsForfeited = r3Triggered;
  const entitledBalance = deductionsForfeited
    ? input.depositAmount
    : Math.max(
        input.depositAmount - input.deductionsClaimed.reduce((sum, d) => sum + d.amount, 0),
        0
      );
  const outstandingBalance = Math.max(entitledBalance - input.amountReturned, 0);

  // R4 -- balance not returned within 30 days of termination, §15B(4); forfeiture (6)(e); treble (7)
  const daysSinceMoveOut = daysBetween(input.moveOutDate, asOfDate);
  const r4Triggered =
    input.tenancyEndConfirmed &&
    daysSinceMoveOut > RETURN_DEADLINE_DAYS &&
    outstandingBalance > 0;
  rules.push({
    id: "R4_LATE_RETURN",
    triggered: r4Triggered,
    title: "Deposit balance not returned within 30 days of move-out",
    explanation: r4Triggered
      ? "More than 30 days have passed since the tenancy ended and the balance the tenant is entitled to has not been returned, violating §15B(4) and §15B(6)(e). This exposes the landlord to treble damages under §15B(7)."
      : "The deposit balance was returned within 30 days of move-out, or the 30-day window has not yet passed.",
    plainTerms: r4Triggered
      ? "In plain terms: your money is past due. When a deposit comes back late, a court can order up to three times the amount owed, plus your court costs and attorney's fees."
      : "The deposit was returned on time, or the deadline has not passed yet.",
    citation: "M.G.L. c. 186, §15B(4), §15B(6)(e), §15B(7)",
    severity: r4Triggered ? "high" : "info",
  });

  // R6 -- no annual interest paid on a deposit held a year or more, §15B(3)(b)
  const tenancyYears = fullYearsBetween(input.tenancyStartDate, input.moveOutDate);
  const r6Triggered = tenancyYears >= 1 && input.interestPaidAnnually !== "yes";
  rules.push({
    id: "R6_NO_INTEREST_PAID",
    triggered: r6Triggered,
    title: "No annual interest paid on the deposit",
    explanation: r6Triggered
      ? "The deposit was held for a year or more and the required 5% annual interest was not paid, violating §15B(3)(b). This violation alone does not carry the statute's treble-damages remedy unless the unpaid interest is also part of a balance not returned within 30 days of termination."
      : "Either the deposit was held less than a year (no interest yet due) or annual interest was paid as required.",
    plainTerms: r6Triggered
      ? "In plain terms: a deposit held a year or more earns 5% interest every year, and that unpaid interest is extra money you can add to your demand."
      : "No interest issue was found.",
    citation: "M.G.L. c. 186, §15B(3)(b)",
    severity: r6Triggered ? "medium" : "info",
  });

  // Treble damages under §15B(7) attach only to (6)(a) [R2] and (6)(e) [R4] violations.
  const trebleApplies = (r2Triggered || r4Triggered) && outstandingBalance > 0;
  const interestOwed = r6Triggered ? input.depositAmount * ANNUAL_INTEREST_RATE * tenancyYears : 0;
  const trebledPrincipal = trebleApplies ? outstandingBalance * 3 : 0;
  const maxExposure = (trebleApplies ? trebledPrincipal : outstandingBalance) + interestOwed;

  const notes: string[] = [];
  if (trebleApplies) {
    notes.push(
      "§15B(7) also allows recovery of court costs and reasonable attorney's fees on top of this amount."
    );
  }
  if (r1Triggered) {
    notes.push(
      `The $${(input.depositAmount - input.monthlyRent).toFixed(2)} collected in excess of one month's rent is separately recoverable under §15B(1)(b)(iii), even though it is not trebled.`
    );
  }

  const exposure: ExposureBreakdown = {
    outstandingBalance,
    trebleApplies,
    trebledPrincipal,
    interestOwed,
    maxExposure,
    notes,
  };

  return { rules, deductionFlags, exposure };
}
