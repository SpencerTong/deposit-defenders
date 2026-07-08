import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutSession } from "@/lib/payments/stripe";
import { recordEvent } from "@/lib/db/events";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  const status = await retrieveCheckoutSession(sessionId);
  if (!status) {
    return NextResponse.json({ ok: false, error: "session_not_found" }, { status: 404 });
  }

  if (status.paid) {
    await recordEvent({ eventName: "purchased", src: status.src });
  }

  return NextResponse.json({ ok: true, paid: status.paid });
}
