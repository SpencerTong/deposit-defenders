import { SITE_URL } from "@/lib/site";

export interface ResultsEmailInput {
  maxExposure: number;
  violationCount: number;
}

export interface ResultsEmailContent {
  subject: string;
  html: string;
}

const DISCLAIMER =
  '<p style="color:#6b7280;font-size:13px">This tool provides general legal information, ' +
  "not legal advice, and does not create an attorney-client relationship. For advice about " +
  "your situation, consult a licensed Massachusetts attorney.</p>";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * The lightweight "your results" email sent on lead capture: the potential
 * claim + the $49 kit link. Deliberately NOT the demand letter; the letter
 * is part of the paid kit.
 */
export function buildResultsEmail(input: ResultsEmailInput): ResultsEmailContent {
  const kitUrl = `${SITE_URL}/kit`;

  if (input.violationCount === 0) {
    return {
      subject: "Your Massachusetts security deposit analysis",
      html:
        "<p>Based on your answers, we didn't find a clear violation of the Massachusetts " +
        "security deposit law (M.G.L. c. 186 §15B). You may still want to review your " +
        "paperwork carefully.</p>" +
        DISCLAIMER,
    };
  }

  const amount = formatCurrency(input.maxExposure);
  const violations =
    input.violationCount === 1
      ? "1 potential violation"
      : `${input.violationCount} potential violations`;

  return {
    subject: `Your deposit analysis: up to ${amount} may be owed`,
    html:
      `<p>Based on your answers, your landlord's handling of your security deposit shows ` +
      `<strong>${violations}</strong> of the Massachusetts security deposit law ` +
      `(M.G.L. c. 186 §15B), which may entitle you to <strong>up to ${amount}</strong> ` +
      `including treble damages where the law provides for them.</p>` +
      `<p>Ready to collect? For a one-time $49, we write your formal demand letter citing ` +
      `each violation, send it to your landlord by certified mail for you, and include the ` +
      `complete small claims plan with your numbers if they still do not pay.</p>` +
      `<p><a href="${kitUrl}">Get my letter written and sent for $49</a></p>` +
      DISCLAIMER,
  };
}
