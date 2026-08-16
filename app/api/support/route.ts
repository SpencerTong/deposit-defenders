import { NextRequest, NextResponse } from "next/server";
import { sendSupportRequest } from "@/lib/email/resend";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { email, message, company } = (body ?? {}) as {
    email?: unknown;
    message?: unknown;
    company?: unknown;
  };

  // Honeypot: a real visitor never fills in this hidden field. Report success
  // without sending so a bot can't tell its submission was dropped.
  if (typeof company === "string" && company.trim().length > 0) {
    return NextResponse.json({ ok: true, sent: false });
  }

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "missing_message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ ok: false, error: "message_too_long" }, { status: 400 });
  }

  const { sent } = await sendSupportRequest({ fromEmail: email, message: message.trim() });
  if (!sent) {
    // The relay is the customer's only channel: letters@ is a sending identity
    // with no inbox behind it, so a dropped message reaches nobody and is not
    // recoverable. Say so rather than showing "Message sent" over a silent loss.
    // The signal is the status code, not `sent`, so the honeypot above can keep
    // returning a 200 that a bot cannot tell apart from a real success.
    return NextResponse.json({ ok: false, error: "relay_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sent: true });
}
