export interface TrackingEmailInput {
  landlordName: string;
  trackingNumber: string | null;
  workspaceUrl: string;
}

export interface TrackingEmailContent {
  subject: string;
  html: string;
}

const DISCLAIMER =
  '<p style="color:#6b7280;font-size:13px">This tool provides general legal information, ' +
  "not legal advice, and does not create an attorney-client relationship. For advice about " +
  "your situation, consult a licensed Massachusetts attorney.</p>";

/**
 * Sent right after a successful Lob dispatch: confirms the letter is on its
 * way and puts the certified-mail tracking number in the buyer's inbox, since
 * that number is itself part of their evidence.
 */
export function buildTrackingEmail(input: TrackingEmailInput): TrackingEmailContent {
  const trackingBlock = input.trackingNumber
    ? `<p>Your USPS Certified Mail tracking number is:</p>` +
      `<p style="font-size:18px"><strong>${input.trackingNumber}</strong></p>` +
      `<p><a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(
        input.trackingNumber
      )}">Track it on usps.com</a>. The first scan usually appears within a day of printing. ` +
      `Keep this number with your records; it is your proof of mailing, and the return ` +
      `receipt will be your proof of delivery.</p>`
    : `<p>Your USPS Certified Mail tracking number will appear in your workspace shortly ` +
      `after the letter is printed.</p>`;

  return {
    subject: "Your demand letter is in the mail",
    html:
      `<p>Your demand letter to <strong>${input.landlordName}</strong> has been sent for ` +
      `printing and will be mailed by USPS Certified Mail with return receipt.</p>` +
      trackingBlock +
      `<p>Your letter, downloads, and mailing status stay available in ` +
      `<a href="${input.workspaceUrl}">your kit workspace</a>. The response deadline stated ` +
      `in your letter starts when it is received, so watch the tracking for the delivery date.</p>` +
      DISCLAIMER,
  };
}
