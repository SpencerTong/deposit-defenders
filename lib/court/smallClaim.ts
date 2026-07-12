import type { KitOrder } from "@/lib/db/kitOrders";
import type { FlowAnswers } from "@/lib/flow/types";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import { EFILING_SURCHARGE, SMALL_CLAIMS_LIMIT, filingFeeForClaim } from "@/lib/kit/court-data";
import { formatAddress } from "@/lib/letter/fromOrder";

export interface SmallClaimDraft {
  title: string;
  draftNote: string;
  plaintiffName: string;
  plaintiffAddress: string;
  defendantName: string;
  defendantAddress: string;
  claimAmount: string;
  claimDescription: string;
  venueGuidance: string;
  feeGuidance: string;
  disclaimer: string;
}

const DISCLAIMER =
  "This tool provides general legal information, not legal advice, and does not create an " +
  "attorney-client relationship. For advice about your situation, consult a licensed " +
  "Massachusetts attorney.";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * A filled-in draft of the Massachusetts "Statement of Small Claim and
 * Notice". The courts require their own form (on paper or through eFileMA),
 * so this is deliberately framed as a draft the buyer copies from, with every
 * field they need already worded and computed.
 */
export function buildSmallClaimDraft(order: KitOrder): SmallClaimDraft {
  const tenancy = toTenancyInputs(order.answers as FlowAnswers);
  const analysis = analyzeTenancy(tenancy);
  const details = order.letterDetails;

  const triggered = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
  );
  const violationList =
    triggered.length > 0
      ? triggered.map((rule) => `${rule.title} (${rule.citation})`).join("; ")
      : "failure to return the balance of my security deposit";

  const filingFee = filingFeeForClaim(analysis.exposure.outstandingBalance);

  const claimDescription =
    `The defendant was my landlord for the rental property at ` +
    `${details?.propertyAddress ?? "[Property Address]"}. I paid a security deposit of ` +
    `${formatCurrency(tenancy.depositAmount)}. My tenancy ended on ` +
    `${formatDate(tenancy.moveOutDate)}. The defendant did not comply with the ` +
    `Massachusetts security deposit law, M.G.L. c. 186, §15B, specifically: ${violationList}. ` +
    `I sent the defendant a written demand and did not receive the amount owed. I claim ` +
    `${formatCurrency(analysis.exposure.maxExposure)}, which may include multiple damages, ` +
    `interest, court costs, and attorney's fees as M.G.L. c. 186, §15B(7) provides.`;

  const venueGuidance =
    "File in the District Court, Boston Municipal Court, or Housing Court for the area where " +
    "you live or work, where the defendant lives or does business, or where the rental " +
    "property is located.";

  const feeGuidance =
    `Filing fee for a claim of this size: ${formatCurrency(filingFee)} (eFiling adds about ` +
    `${formatCurrency(EFILING_SURCHARGE)}). Small claims court generally handles claims of ` +
    `$${SMALL_CLAIMS_LIMIT.toLocaleString("en-US")} or less, though awards under statutes ` +
    `allowing multiple damages may exceed that. Fees are set by the courts and change, so ` +
    `confirm the current amount when you file.`;

  return {
    title: "Statement of Small Claim and Notice (draft)",
    draftNote:
      "This is a prepared draft. Copy these entries onto the court's official Statement of " +
      "Small Claim and Notice form, available at the clerk's office or through the " +
      "Massachusetts courts' eFileMA system.",
    plaintiffName: details?.tenantName ?? "[Your Name]",
    plaintiffAddress: details ? formatAddress(details.tenantAddress) : "[Your Address]",
    defendantName: details?.landlordName ?? "[Landlord Name]",
    defendantAddress: details ? formatAddress(details.landlordAddress) : "[Landlord Address]",
    claimAmount: formatCurrency(analysis.exposure.maxExposure),
    claimDescription,
    venueGuidance,
    feeGuidance,
    disclaimer: DISCLAIMER,
  };
}
