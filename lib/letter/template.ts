import type { AnalysisResult, TenancyInputs } from "@/lib/statute/ma";
import { build93aDemand } from "@/lib/statute/ch93a";

const DISCLAIMER =
  "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney.";

const PLACEHOLDER_TENANT_NAME = "[Your Name]";
const PLACEHOLDER_TENANT_ADDRESS = "[Your Address]";
const PLACEHOLDER_LANDLORD_NAME = "[Landlord Name]";
const PLACEHOLDER_LANDLORD_ADDRESS = "[Landlord Address]";
const PLACEHOLDER_PROPERTY_ADDRESS = "[Property Address]";

export interface LetterParty {
  tenantName?: string;
  tenantAddress?: string;
  landlordName?: string;
  landlordAddress?: string;
  propertyAddress?: string;
}

export interface DemandLetterContent {
  date: string;
  tenantName: string;
  tenantAddress: string;
  landlordName: string;
  landlordAddress: string;
  propertyAddress: string;
  subject: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signatureName: string;
  disclaimer: string;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** For user-entered date-only values (parsed as UTC midnight). */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** For "now" timestamps: the letter is dated in Massachusetts local time. */
function formatTodayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

/**
 * States what was already returned so the outstanding balance in the demand
 * paragraph doesn't read as an unexplained smaller number than the deposit.
 * Omitted when nothing has been returned yet, since there's nothing to explain.
 */
function formatReturnedClause(tenancy: TenancyInputs, analysis: AnalysisResult): string {
  if (tenancy.amountReturned <= 0) return "";
  return (
    ` You returned ${formatCurrency(tenancy.amountReturned)} of that deposit, leaving an ` +
    `outstanding balance of ${formatCurrency(analysis.exposure.outstandingBalance)}.`
  );
}

/** Shows the arithmetic behind the demand total, mirroring the breakdown on the analysis screen. */
function formatExposureBreakdown(exposure: AnalysisResult["exposure"]): string {
  const parts: string[] = [];
  if (exposure.trebleApplies) {
    parts.push(
      `${formatCurrency(exposure.outstandingBalance)} in outstanding deposit balance, trebled ` +
        `under §15B(7) to ${formatCurrency(exposure.trebledPrincipal)}`
    );
  } else if (exposure.outstandingBalance > 0) {
    parts.push(`${formatCurrency(exposure.outstandingBalance)} in outstanding deposit balance`);
  }
  if (exposure.interestOwed > 0) {
    parts.push(
      `${formatCurrency(exposure.interestOwed)} in unpaid annual interest under §15B(3)(b)`
    );
  }
  return parts.join(", plus ");
}

export function buildDemandLetter(
  tenancy: TenancyInputs,
  analysis: AnalysisResult,
  party: LetterParty = {},
  today: Date = new Date()
): DemandLetterContent {
  const tenantName = party.tenantName ?? PLACEHOLDER_TENANT_NAME;
  const tenantAddress = party.tenantAddress ?? PLACEHOLDER_TENANT_ADDRESS;
  const landlordName = party.landlordName ?? PLACEHOLDER_LANDLORD_NAME;
  const landlordAddress = party.landlordAddress ?? PLACEHOLDER_LANDLORD_ADDRESS;
  const propertyAddress = party.propertyAddress ?? PLACEHOLDER_PROPERTY_ADDRESS;

  const introParagraph =
    `I am writing regarding the security deposit of ${formatCurrency(tenancy.depositAmount)} ` +
    `paid in connection with my tenancy at ${propertyAddress}, which ended on ${formatDate(
      tenancy.moveOutDate
    )}.` +
    formatReturnedClause(tenancy, analysis) +
    ` Massachusetts law, M.G.L. c. 186, §15B, imposes specific requirements on landlords who ` +
    `hold a tenant's security deposit, and this letter serves as formal demand for the amount ` +
    `described below.`;

  // R8, like R5, is excluded from this recital. The Court in Peebles expressly
  // declined to decide whether the clause alone (n.8) or in combination with a
  // deduction (§15B(6)(c) forfeiture) fails a §15B requirement, so asserting
  // "the following requirements of §15B were not met" would overstate what R8's
  // own explanation concedes is undecided. R8 still renders as a violation card
  // on the analysis screen; the letter argues it via a dedicated paragraph.
  const triggeredRules = analysis.rules.filter(
    (rule) =>
      rule.triggered &&
      rule.id !== "R5_WEAR_AND_TEAR_FLAGS" &&
      rule.id !== "R8_PROFESSIONAL_CLEANING_CLAUSE"
  );

  const violationParagraphs =
    triggeredRules.length > 0
      ? [
          "Based on the facts of my tenancy, the following requirements of §15B were not met:",
          ...triggeredRules.map((rule) => `${rule.title}. ${rule.explanation} (${rule.citation}).`),
        ]
      : [
          "I did not identify a clear violation of §15B's procedural requirements based on the " +
            "information available to me, but I have not yet received the full amount I am owed.",
        ];

  // R5 is keyword matching, so the letter never asserts that a given charge IS
  // wear and tear. It states the governing standard from Peebles and disputes
  // the charges, which is the tenant's position to take, not a legal conclusion
  // this tool draws for them.
  const contestedDeductions = analysis.deductionFlags.filter(
    (flag) => flag.classification === "commonly_contestable"
  );
  const wearAndTearParagraphs =
    contestedDeductions.length > 0
      ? [
          `I dispute the following itemized charge${contestedDeductions.length === 1 ? "" : "s"} as ` +
            `deductions for reasonable wear and tear: ` +
            contestedDeductions
              .map((flag) => `${flag.description} (${formatCurrency(flag.amount)})`)
              .join("; ") +
            `. In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025), the ` +
            `Supreme Judicial Court held that a tenant's reasonable use of a property as a ` +
            `residence is expected to result in gradual deterioration that may require painting, ` +
            `carpet cleaning or repair, or other refurbishment at the end of a lease, and that ` +
            `deductions from a security deposit to repair such reasonable wear and tear violate ` +
            `M.G.L. c. 186, §15B(4)(iii). The Court identified the unit's condition at the start ` +
            `of the lease and the length of the occupancy among the circumstances bearing on that ` +
            `question.`,
        ]
      : [];

  // Only argue the clause when a cleaning-related charge was actually taken
  // under it. The rule engine itself hedges the stand-alone-clause case (see
  // R8's contestableChargePresent === false branch in lib/statute/ma.ts): the
  // Court in Peebles did not decide whether a clause unbacked by any deduction
  // raises the same problem. Reuse the same "contestable charge" set the
  // wear-and-tear paragraph above is gated on, rather than re-deriving it.
  const cleaningClauseTriggered = analysis.rules.some(
    (rule) => rule.id === "R8_PROFESSIONAL_CLEANING_CLAUSE" && rule.triggered
  );
  const cleaningClauseParagraphs = cleaningClauseTriggered && contestedDeductions.length > 0
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

  const exposureBreakdown = formatExposureBreakdown(analysis.exposure);
  const demandParagraph =
    `Demand is hereby made for payment of ${formatCurrency(analysis.exposure.maxExposure)}` +
    (exposureBreakdown ? `, consisting of ${exposureBreakdown}.` : ".") +
    (analysis.exposure.notes.length > 0 ? ` ${analysis.exposure.notes.join(" ")}` : "");

  const deadlineParagraph =
    "Please remit payment within 10 business days of the date of this letter. If payment in " +
    "full is not received within that time, I am prepared to pursue all remedies available to " +
    "me in small claims court, which can include treble damages, interest, court costs, and " +
    "reasonable attorney's fees under M.G.L. c. 186, §15B(7).";

  return {
    date: formatTodayDate(today),
    tenantName,
    tenantAddress,
    landlordName,
    landlordAddress,
    propertyAddress,
    subject: `Re: Security deposit demand for ${propertyAddress}`,
    salutation: `Dear ${landlordName},`,
    paragraphs: [
      introParagraph,
      ...violationParagraphs,
      ...wearAndTearParagraphs,
      ...cleaningClauseParagraphs,
      demandParagraph,
      deadlineParagraph,
    ],
    closing: "Sincerely,",
    signatureName: tenantName,
    disclaimer: DISCLAIMER,
  };
}

export interface CombinedLetterOptions {
  ownerOccupied: boolean;
  today?: Date;
}

/**
 * The paid letter: a single demand under both M.G.L. c. 186, §15B and
 * M.G.L. c. 93A, §9, with the statutory 30-day response window 93A requires.
 * Falls back to the plain §15B letter when the landlord lives in the building
 * (no 93A claim; see lib/statute/ch93a.ts) or when no violation was found.
 */
export function buildCombinedDemandLetter(
  tenancy: TenancyInputs,
  analysis: AnalysisResult,
  party: LetterParty = {},
  opts: CombinedLetterOptions
): DemandLetterContent {
  const today = opts.today ?? new Date();
  const demand93a = build93aDemand(analysis, { ownerOccupied: opts.ownerOccupied });
  const base = buildDemandLetter(tenancy, analysis, party, today);
  if (!demand93a) return base;

  const introParagraph =
    `I am writing regarding the security deposit of ${formatCurrency(tenancy.depositAmount)} ` +
    `paid in connection with my tenancy at ${base.propertyAddress}, which ended on ` +
    `${formatDate(tenancy.moveOutDate)}.` +
    formatReturnedClause(tenancy, analysis) +
    ` This letter is a formal demand under the ` +
    `Massachusetts security deposit law, M.G.L. c. 186, §15B, and a written demand for ` +
    `relief under the Massachusetts Consumer Protection Act, M.G.L. c. 93A, §9.`;

  // The base letter's paragraphs are
  // [intro, ...violations, ...wearAndTearDispute?, demand, deadline].
  // Keep everything but the intro and deadline, which are replaced below.
  const violationAndDemand = base.paragraphs.slice(1, -1);

  const deadlineParagraph =
    "Please remit payment within 30 days of your receipt of this letter, the response " +
    "period M.G.L. c. 93A, §9(3) provides. If payment in full is not received within that " +
    "time, I am prepared to pursue all remedies available to me, including in small claims " +
    "court, which can include treble damages, interest, court costs, and reasonable " +
    "attorney's fees under M.G.L. c. 186, §15B(7) and M.G.L. c. 93A, §9.";

  return {
    ...base,
    subject: `Re: Demand under M.G.L. c. 93A and c. 186, §15B for ${base.propertyAddress}`,
    paragraphs: [
      introParagraph,
      ...violationAndDemand,
      demand93a.practiceParagraph,
      demand93a.remedyParagraph,
      deadlineParagraph,
    ],
  };
}
