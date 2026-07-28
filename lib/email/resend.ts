import { Resend } from "resend";
import { buildResultsEmail } from "./results";
import { buildTrackingEmail, type TrackingEmailInput } from "./tracking";
import { buildSupportRequestEmail, type SupportRequestInput } from "./support";

const DEFAULT_FROM = "Deposit Defenders <letters@deposit-defenders.com>";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export interface SendLetterEmailInput {
  to: string;
  pdfBytes: Uint8Array;
}

export interface SendLetterEmailResult {
  sent: boolean;
}

/**
 * Emails the generated demand letter PDF. Degrades to a console log (rather
 * than throwing) when RESEND_API_KEY isn't configured yet, matching the
 * lib/db graceful-fallback pattern used for local dev and pre-provisioned
 * deploys.
 */
export async function sendLetterEmail(input: SendLetterEmailInput): Promise<SendLetterEmailResult> {
  const resend = getClient();
  if (!resend) {
    console.log(
      `[email] RESEND_API_KEY not configured, would send ${input.pdfBytes.byteLength}-byte PDF to ${input.to}`
    );
    return { sent: false };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: input.to,
    subject: "Your Massachusetts security deposit demand letter",
    html:
      "<p>Your free demand letter is attached as a PDF.</p>" +
      "<p>This is general legal information, not legal advice, and does not create an " +
      "attorney-client relationship. For advice about your situation, consult a licensed " +
      "Massachusetts attorney.</p>",
    attachments: [
      {
        filename: "security-deposit-demand-letter.pdf",
        content: Buffer.from(input.pdfBytes),
      },
    ],
  });

  if (error) {
    console.error("[email] failed to send letter email", error);
    return { sent: false };
  }

  return { sent: true };
}

export interface SendKitEmailInput {
  to: string;
  letterPdf: Uint8Array;
  kitPdf: Uint8Array;
  workspaceUrl?: string | null;
}

/**
 * Emails the purchased Dispute Kit: the demand letter plus the kit packet.
 * Same graceful-degradation contract as sendLetterEmail.
 */
export async function sendKitEmail(input: SendKitEmailInput): Promise<{ sent: boolean }> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not configured, would send kit to ${input.to}`);
    return { sent: false };
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: input.to,
    subject: "Your Massachusetts Security Deposit Dispute Kit",
    html:
      "<p>Thank you for your purchase. Your Dispute Kit is attached:</p>" +
      "<ul><li><strong>Demand letter</strong>: your starting version, ready to personalize.</li>" +
      "<li><strong>Dispute Kit</strong>: evidence checklist, your escalation timeline, and the small-claims walkthrough.</li></ul>" +
      (input.workspaceUrl
        ? `<p><strong>Finish your letter in your workspace:</strong> add your addresses, ` +
          `strengthen it under Chapter 93A where it applies, download an editable copy, and ` +
          `have us send it by certified mail for you. ` +
          `<a href="${input.workspaceUrl}">Open your kit workspace</a>. Keep this link; it is ` +
          `your access to the workspace.</p>`
        : "") +
      "<p>This is general legal information, not legal advice, and does not create an " +
      "attorney-client relationship. For advice about your situation, consult a licensed " +
      "Massachusetts attorney.</p>",
    attachments: [
      {
        filename: "security-deposit-demand-letter.pdf",
        content: Buffer.from(input.letterPdf),
      },
      {
        filename: "security-deposit-dispute-kit.pdf",
        content: Buffer.from(input.kitPdf),
      },
    ],
  });

  if (error) {
    console.error("[email] failed to send kit email", error);
    return { sent: false };
  }
  return { sent: true };
}

export interface SendResultsEmailInput {
  to: string;
  maxExposure: number;
  violationCount: number;
}

/**
 * Emails the lightweight analysis results (no letter attached; the letter is
 * paid). Same graceful-degradation contract as sendLetterEmail.
 */
export async function sendResultsEmail(
  input: SendResultsEmailInput
): Promise<{ sent: boolean }> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not configured, would send results email to ${input.to}`);
    return { sent: false };
  }

  const content = buildResultsEmail({
    maxExposure: input.maxExposure,
    violationCount: input.violationCount,
  });

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: input.to,
    subject: content.subject,
    html: content.html,
  });

  if (error) {
    console.error("[email] failed to send results email", error);
    return { sent: false };
  }
  return { sent: true };
}

/**
 * Emails the certified-mail tracking confirmation after a successful Lob
 * dispatch. Same graceful-degradation contract as the other senders; the
 * caller must treat a failed send as non-fatal since the letter is already
 * in the mail stream.
 */
export async function sendTrackingEmail(
  input: TrackingEmailInput & { to: string }
): Promise<{ sent: boolean }> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not configured, would send tracking email to ${input.to}`);
    return { sent: false };
  }

  const content = buildTrackingEmail(input);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: input.to,
    subject: content.subject,
    html: content.html,
  });

  if (error) {
    console.error("[email] failed to send tracking email", error);
    return { sent: false };
  }
  return { sent: true };
}

/**
 * Relays a /support form submission to the owner's inbox via SUPPORT_NOTIFY_EMAIL,
 * with the customer's address set as reply-to. The owner's real address is never
 * sent to the client and never appears in source, so it stays out of view-source
 * and the network tab; it lives only in server-side env config.
 */
export async function sendSupportRequest(input: SupportRequestInput): Promise<{ sent: boolean }> {
  const resend = getClient();
  const notifyTo = process.env.SUPPORT_NOTIFY_EMAIL;
  if (!resend || !notifyTo) {
    console.log(
      `[email] RESEND_API_KEY or SUPPORT_NOTIFY_EMAIL not configured, would relay support ` +
        `request from ${input.fromEmail}`
    );
    return { sent: false };
  }

  const content = buildSupportRequestEmail(input);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: notifyTo,
    replyTo: input.fromEmail,
    subject: content.subject,
    html: content.html,
  });

  if (error) {
    console.error("[email] failed to relay support request", error);
    return { sent: false };
  }
  return { sent: true };
}
