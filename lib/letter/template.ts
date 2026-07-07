import type { AnalysisResult, TenancyInputs } from "@/lib/statute/ma";

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

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
    )}. Massachusetts law, M.G.L. c. 186, §15B, imposes specific requirements on landlords who ` +
    `hold a tenant's security deposit, and this letter serves as formal demand for the amount ` +
    `described below.`;

  const triggeredRules = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
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

  const demandParagraph =
    `Demand is hereby made for payment of ${formatCurrency(analysis.exposure.maxExposure)}` +
    (analysis.exposure.trebleApplies
      ? ", which reflects treble damages on the outstanding balance plus accrued interest as " +
        "Massachusetts law may allow."
      : ".") +
    (analysis.exposure.notes.length > 0 ? ` ${analysis.exposure.notes.join(" ")}` : "");

  const deadlineParagraph =
    "Please remit payment within 10 business days of the date of this letter. If payment in " +
    "full is not received within that time, I am prepared to pursue all remedies available to " +
    "me in small claims court, which can include treble damages, interest, court costs, and " +
    "reasonable attorney's fees under M.G.L. c. 186, §15B(7).";

  return {
    date: formatDate(today),
    tenantName,
    tenantAddress,
    landlordName,
    landlordAddress,
    propertyAddress,
    subject: `Re: Security Deposit Demand — ${propertyAddress}`,
    salutation: `Dear ${landlordName},`,
    paragraphs: [introParagraph, ...violationParagraphs, demandParagraph, deadlineParagraph],
    closing: "Sincerely,",
    signatureName: tenantName,
    disclaimer: DISCLAIMER,
  };
}
