import { NextRequest, NextResponse } from "next/server";
import { getKitOrderBySessionId, markKitOrderPaid } from "@/lib/db/kitOrders";
import { retrieveCheckoutSession } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  const order = await getKitOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  // Webhook-outage fallback: if the order still looks pending, confirm the
  // payment directly with Stripe so the buyer's workspace opens regardless of
  // webhook delivery. Fulfillment (the email copy) still arrives via the
  // webhook retry.
  let status = order.status;
  if (status === "pending") {
    const session = await retrieveCheckoutSession(sessionId);
    if (session?.paid) {
      await markKitOrderPaid(order.id);
      status = "paid";
    }
  }

  return NextResponse.json({
    ok: true,
    status,
    letterDetails: order.letterDetails,
    mailStatus: order.mailStatus,
    mailTracking: order.mailTracking,
  });
}
