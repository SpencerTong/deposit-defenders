import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/payments/stripe";
import { fulfillKitOrder } from "@/lib/kit/fulfill";

// PDF generation needs Node APIs; signature verification needs the raw body.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const payload = await req.text();
  const event = constructWebhookEvent(payload, signature);
  if (!event) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: true, ignored: "not_paid" });
  }

  const kitOrderId = session.metadata?.kit_order_id;
  if (!kitOrderId) {
    // Not one of ours (or created before order tracking); acknowledge so
    // Stripe doesn't retry forever.
    console.error("[webhook] checkout.session.completed without kit_order_id", session.id);
    return NextResponse.json({ ok: true, ignored: "no_kit_order_id" });
  }

  const email = session.customer_details?.email ?? null;
  const result = await fulfillKitOrder(kitOrderId, email);

  if (result === "retry") {
    return NextResponse.json({ ok: false, error: "fulfillment_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result });
}
