import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/payments/stripe";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { src } = (body ?? {}) as { src?: unknown };
  const origin = new URL(req.url).origin;

  const session = await createCheckoutSession({
    src: typeof src === "string" ? src : null,
    successUrl: `${origin}/kit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/kit`,
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, url: session.url });
}
