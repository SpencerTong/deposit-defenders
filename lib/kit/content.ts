import type { AnalysisResult, TenancyInputs } from "@/lib/statute/ma";
import { EFILING_SURCHARGE, SMALL_CLAIMS_LIMIT, filingFeeForClaim } from "./court-data";

const DISCLAIMER =
  "This tool provides general legal information, not legal advice, and does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney.";

export interface KitSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface KitContent {
  title: string;
  generatedDate: string;
  demandAmount: string;
  responseDeadlineDate: string;
  trebleApplies: boolean;
  sections: KitSection[];
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

export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export function buildKitContent(
  tenancy: TenancyInputs,
  analysis: AnalysisResult,
  today: Date = new Date()
): KitContent {
  const demandAmount = formatCurrency(analysis.exposure.maxExposure);
  const responseDeadline = addBusinessDays(today, 10);
  const responseDeadlineDate = formatDate(responseDeadline);
  const trebleApplies = analysis.exposure.trebleApplies;
  const triggered = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
  );
  const filingFee = filingFeeForClaim(analysis.exposure.outstandingBalance);
  const fitsSmallClaims = analysis.exposure.outstandingBalance <= SMALL_CLAIMS_LIMIT;

  const sections: KitSection[] = [
    {
      heading: "How to use this kit",
      paragraphs: [
        `This kit was generated on ${formatDate(today)} from the answers you gave about your tenancy. It walks you through sending your demand letter the right way and keeping the evidence organized. If your landlord doesn't respond by ${responseDeadlineDate}, it walks you through taking the claim to Massachusetts small claims court.`,
        triggered.length > 0
          ? `Based on your answers, ${triggered.length} requirement(s) of M.G.L. c. 186, §15B may not have been met, and your demand letter asks for ${demandAmount}.` +
            (trebleApplies
              ? " That figure reflects treble damages the statute may allow, plus accrued interest."
              : "")
          : `Your answers did not show a clear procedural violation of §15B, so your demand letter asks for the outstanding balance of ${demandAmount}.`,
      ],
    },
    {
      heading: "Step 1: Send your demand letter by certified mail",
      paragraphs: [
        "Certified mail with a return receipt creates dated proof that your landlord received your demand. That proof is often the single most useful piece of paper if the dispute goes to court.",
      ],
      list: [
        "Print and sign the enclosed demand letter, and fill in any [bracketed] fields (names, addresses) before sending.",
        "At any post office, send it via USPS Certified Mail® and add Return Receipt (the green card, or electronic return receipt).",
        "Keep the mailing receipt with the tracking number, and keep a dated copy of exactly what you sent.",
        "When the signed return receipt comes back, file it with your records. It proves delivery.",
        `Mark your calendar: the letter gives your landlord 10 business days to respond (${responseDeadlineDate} if you mail it today).`,
      ],
    },
    {
      heading: "Step 2: Build your evidence packet",
      paragraphs: [
        "Organized evidence is what turns a he-said-she-said into a documented claim. Gather:",
      ],
      list: [
        "Your lease and any statement of condition from move-in.",
        "Move-in and move-out photos or video, dated if possible.",
        "Every written exchange with your landlord about the deposit: texts, emails, letters.",
        "Bank records showing the deposit you paid and anything returned.",
        "Any itemized list of deductions your landlord sent, with its envelope or email date.",
        "Your demand letter, the certified-mail receipt, and the return receipt once delivered.",
      ],
    },
    {
      heading: "Your escalation timeline",
      paragraphs: ["Three dates matter from the day you mail the letter:"],
      list: [
        `Day 0 (${formatDate(today)}): mail the demand letter by certified mail and start your evidence packet.`,
        `Day 10 business days (${responseDeadlineDate}): the response deadline stated in your letter. If you've received full payment, you're done. Partial offers are your call. The statute's remedies don't disappear if you decline.`,
        "If the deadline passes without payment: you can file in small claims court (Step 3). Many tenants also send one short follow-up note first saying they're proceeding to court. Sometimes that alone prompts payment.",
      ],
    },
    {
      heading: "Step 3: Massachusetts small claims court, start to finish",
      paragraphs: [
        fitsSmallClaims
          ? `Small claims court handles claims of $${SMALL_CLAIMS_LIMIT.toLocaleString("en-US")} or less, and your outstanding balance fits. Where a statute allows multiple damages, like the treble damages §15B(7) can provide, the final award may exceed that limit even though the underlying claim fits.`
          : `Small claims court handles claims of $${SMALL_CLAIMS_LIMIT.toLocaleString("en-US")} or less in actual damages. Your outstanding balance is above that, so consider whether to waive the excess to stay in small claims, or ask a Massachusetts attorney about a regular civil action.`,
        "No lawyer is required. The process:",
      ],
      list: [
        "Where to file: the District Court, Boston Municipal Court, or Housing Court for the area where you live or work, where the landlord lives or does business, or where the rental property is located.",
        'Fill out the "Statement of Small Claim and Notice" form, available at the clerk\'s office, by mail, or through the courts\' online eFiling tool.',
        `Filing fee for a claim like yours: ${formatCurrency(filingFee)} (eFiling adds about ${formatCurrency(EFILING_SURCHARGE)}). Fees are set by the courts and change, so confirm the current amount when you file.`,
        "In the claim description, state the deposit amount, the move-out date, and each §15B requirement that wasn't met. Your demand letter already lists them in the right order.",
        "The clerk mails the claim to your landlord with a hearing date. Bring your evidence packet, your demand letter, and proof of certified mailing to the hearing.",
        "At the hearing, tell it plainly: what you paid, when you moved out, what the landlord did and didn't do, and what §15B required. The magistrate asks questions, and you don't need legal language.",
      ],
    },
  ];

  return {
    title: "Massachusetts Security Deposit Dispute Kit",
    generatedDate: formatDate(today),
    demandAmount,
    responseDeadlineDate,
    trebleApplies,
    sections,
    disclaimer: DISCLAIMER,
  };
}
