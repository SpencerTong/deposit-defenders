import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { createKitOrder, setKitOrderSession } from "@/lib/db/kitOrders";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { src, answers } = (body ?? {}) as { src?: unknown; answers?: unknown };

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });
  }

  const order = await createKitOrder({
    answers,
    src: typeof src === "string" ? src : null,
  });
  if (!order) {
    // No stored snapshot means an unfulfillable order, so refuse payment.
    return NextResponse.json({ ok: false, error: "kit_unavailable" }, { status: 503 });
  }

  const origin = new URL(req.url).origin;
  const session = await createCheckoutSession({
    src: typeof src === "string" ? src : null,
    kitOrderId: order.id,
    successUrl: `${origin}/kit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/kit`,
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  await setKitOrderSession(order.id, session.sessionId);

  return NextResponse.json({ ok: true, url: session.url });
}
