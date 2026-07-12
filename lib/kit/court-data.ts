/**
 * Massachusetts small-claims facts used in the Dispute Kit.
 * Verified 2026-07-08 against:
 * - https://www.mass.gov/info-details/small-claims-court
 * - https://www.mass.gov/how-to/file-a-small-claim-in-the-boston-municipal-court-district-court-or-housing-court
 * Fees are set by the courts (M.G.L. c. 218 §22) and can change; all kit copy
 * that mentions a fee must tell the reader to confirm the current amount.
 */

/** Small claims handle claims of $7,000 or less. Statutory multiple damages
 * (like §15B(7) treble damages) may exceed this when actual damages are within
 * the limit. */
export const SMALL_CLAIMS_LIMIT = 7000;

/** Optional surcharge when filing through the courts' online eFiling tool. */
export const EFILING_SURCHARGE = 7;

interface FilingFeeTier {
  maxClaim: number;
  fee: number;
}

const FILING_FEE_TIERS: FilingFeeTier[] = [
  { maxClaim: 500, fee: 40 },
  { maxClaim: 2000, fee: 50 },
  { maxClaim: 5000, fee: 100 },
  { maxClaim: 7000, fee: 150 },
];

/** Filing fee for a claim amount; amounts above the small-claims limit use the
 * top tier (the claim itself would be capped at actual damages ≤ $7,000). */
export function filingFeeForClaim(amount: number): number {
  for (const tier of FILING_FEE_TIERS) {
    if (amount <= tier.maxClaim) return tier.fee;
  }
  return FILING_FEE_TIERS[FILING_FEE_TIERS.length - 1]!.fee;
}
