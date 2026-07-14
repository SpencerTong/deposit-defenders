import { NextRequest, NextResponse } from "next/server";
import {
  claimKitOrderForMailing,
  revertKitOrderMailToUnsent,
  setKitOrderMailResult,
} from "@/lib/db/kitOrders";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { buildLetterForOrder } from "@/lib/letter/fromOrder";
import { renderDemandLetterPdf } from "@/lib/letter/pdf";
import { isMailFailure, mailCertifiedLetter } from "@/lib/mail/lob";
import { sendTrackingEmail } from "@/lib/email/resend";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { sessionId } = (body ?? {}) as { sessionId?: unknown };
  const access = await loadPaidOrder(typeof sessionId === "string" ? sessionId : null);
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }
  const order = access.order;

  const details = order.letterDetails;
  if (!details) {
    return NextResponse.json({ ok: false, error: "missing_letter_details" }, { status: 400 });
  }

  // Atomic claim: a physical letter must never go out twice. Anyone who loses
  // the race (double click, retry, second tab) gets a 409.
  const claimed = await claimKitOrderForMailing(order.id);
  if (!claimed) {
    return NextResponse.json({ ok: false, error: "already_mailed" }, { status: 409 });
  }

  try {
    const pdf = await renderDemandLetterPdf(buildLetterForOrder(order));
    const result = await mailCertifiedLetter({
      description: `Demand letter for order ${order.id}`,
      to: { name: details.landlordName, address: details.landlordAddress },
      from: { name: details.tenantName, address: details.tenantAddress },
      pdf: Buffer.from(pdf),
    });

    if (!result || isMailFailure(result)) {
      await revertKitOrderMailToUnsent(order.id);
      if (result && result.failure === "undeliverable_address") {
        return NextResponse.json({ ok: false, error: "address_unverified" }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: "mail_failed" }, { status: 502 });
    }

    await setKitOrderMailResult(order.id, {
      lobId: result.id,
      tracking: result.trackingNumber,
    });

    // Courtesy copy of the tracking number. Never fatal: the letter is
    // already in the mail stream, and the workspace shows the same number.
    if (order.email) {
      try {
        await sendTrackingEmail({
          to: order.email,
          landlordName: details.landlordName,
          trackingNumber: result.trackingNumber,
          workspaceUrl: `${SITE_URL}/kit/success?session_id=${encodeURIComponent(sessionId as string)}`,
        });
      } catch (error) {
        console.error(`[kit] tracking email failed for order ${order.id}`, error);
      }
    }

    return NextResponse.json({ ok: true, tracking: result.trackingNumber });
  } catch (error) {
    console.error(`[kit] mailing failed for order ${order.id}`, error);
    await revertKitOrderMailToUnsent(order.id);
    return NextResponse.json({ ok: false, error: "mail_failed" }, { status: 502 });
  }
}
