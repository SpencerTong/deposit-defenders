import type { AnalysisResult } from "./ma";

/**
 * Chapter 93A layer on top of the §15B rules engine.
 *
 * Verified 2026-07-11 against M.G.L. c. 93A §9 (malegislature.gov) and
 * 940 CMR 3.17(4): a written demand must identify the claimant, reasonably
 * describe the unfair or deceptive act and the injury, and be delivered at
 * least 30 days before filing suit. 940 CMR 3.17(4) declares specific §15B
 * failures to be unfair or deceptive practices, with a catch-all at (4)(k).
 * (4)(e) [statement of condition] added and re-verified 2026-07-27.
 *
 * The 93A demand is intentionally omitted when the landlord lives in the
 * building: renting a unit in an owner-occupied dwelling is generally not
 * "trade or commerce" (Billings v. Wilson, 397 Mass. 614 (1986)), so a 93A
 * claim would overreach. The §15B claims stand on their own in that case.
 */

export interface Ch93aDemand {
  practiceParagraph: string;
  remedyParagraph: string;
  responseDays: 30;
}

/** Maps rules-engine rule ids to the 940 CMR 3.17(4) subsection that makes
 * the same conduct an unfair or deceptive practice. */
const REGULATION_BY_RULE: Record<string, { cite: string; practice: string }> = {
  R1_DEPOSIT_EXCEEDS_ONE_MONTH: {
    cite: "940 CMR 3.17(4)(a)",
    practice: "requiring a security deposit greater than one month's rent",
  },
  R2_NO_ESCROW_RECEIPT: {
    cite: "940 CMR 3.17(4)(d)",
    practice:
      "failing to hold the deposit in a separate interest-bearing account or to give the required bank notice",
  },
  R3_LATE_OR_MISSING_ITEMIZATION: {
    cite: "940 CMR 3.17(4)(f)",
    practice:
      "failing to furnish a sworn, itemized list of damage within 30 days of the end of the tenancy",
  },
  R4_LATE_RETURN: {
    cite: "940 CMR 3.17(4)(g)",
    practice:
      "failing to return the security deposit or its balance within 30 days after termination of the tenancy",
  },
  R6_NO_INTEREST_PAID: {
    cite: "940 CMR 3.17(4)(c)",
    practice: "failing to pay the interest due on a deposit held for a year or longer",
  },
  R7_NO_STATEMENT_OF_CONDITION: {
    cite: "940 CMR 3.17(4)(e)",
    practice: "failing to furnish a written statement of the premises' condition at move-in",
  },
};

const FALLBACK_REGULATION = {
  cite: "940 CMR 3.17(4)(k)",
  practice: "otherwise failing to comply with M.G.L. c. 186, §15B",
};

export function build93aDemand(
  analysis: AnalysisResult,
  opts: { ownerOccupied: boolean }
): Ch93aDemand | null {
  if (opts.ownerOccupied) return null;

  // R8, like R5, is excluded here. The fallback regulation reads "otherwise
  // failing to comply with M.G.L. c. 186, §15B", which for R8 would assert the
  // §15B(6)(c) forfeiture question Peebles expressly declined to decide (n.8).
  // R8 is argued in the letter's dedicated paragraph, not in this 93A recital.
  const triggered = analysis.rules.filter(
    (rule) =>
      rule.triggered &&
      rule.id !== "R5_WEAR_AND_TEAR_FLAGS" &&
      rule.id !== "R8_PROFESSIONAL_CLEANING_CLAUSE"
  );
  if (triggered.length === 0) return null;

  const practices = triggered.map((rule) => {
    const reg = REGULATION_BY_RULE[rule.id] ?? FALLBACK_REGULATION;
    return `${reg.practice} (${reg.cite})`;
  });

  const practiceParagraph =
    "This letter also constitutes a written demand for relief under M.G.L. c. 93A, §9. " +
    "The Attorney General's regulations declare it an unfair or deceptive practice for an " +
    "owner to fail to comply with the security deposit law, including " +
    practices.join("; ") +
    ". The conduct described above therefore may constitute unfair or deceptive acts or " +
    "practices in violation of M.G.L. c. 93A, §2, and the injury I have suffered is the " +
    "loss of the funds described in this letter.";

  const remedyParagraph =
    "Under M.G.L. c. 93A, §9, you have 30 days from receipt of this letter to make a " +
    "reasonable written tender of settlement. If a court later finds the violation was " +
    "willful or knowing, or that a refusal to grant relief upon this demand was made in " +
    "bad faith, it may award up to two or three times my actual damages, plus reasonable " +
    "attorney's fees and costs.";

  return { practiceParagraph, remedyParagraph, responseDays: 30 };
}
