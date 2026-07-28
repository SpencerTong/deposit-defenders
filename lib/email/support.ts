export interface SupportRequestInput {
  fromEmail: string;
  message: string;
}

export interface SupportRequestContent {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * The internal notification sent to the owner's inbox when a customer submits
 * the /support form. The customer's address is set as the email's reply-to,
 * not shown to the customer anywhere on the site (that's the point of the
 * relay: the owner's real address never reaches the client).
 */
export function buildSupportRequestEmail(input: SupportRequestInput): SupportRequestContent {
  return {
    subject: `Support request from ${input.fromEmail}`,
    html:
      `<p>New message from <strong>${escapeHtml(input.fromEmail)}</strong> via the /support form.</p>` +
      `<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>` +
      `<p style="color:#6b7280;font-size:13px">Reply to this email to respond directly to them.</p>`,
  };
}
