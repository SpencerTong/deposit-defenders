import Stripe from "stripe";

const KIT_PRICE_USD_CENTS = 4900;
const KIT_PRODUCT_NAME = "MA Security Deposit Dispute Kit";

let client: Stripe | null = null;

function getClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export interface CreateCheckoutSessionInput {
  src: string | null;
  kitOrderId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a one-time $49 Checkout Session. Returns null (rather than
 * throwing) when STRIPE_SECRET_KEY isn't configured, so local dev and
 * pre-provisioned deploys degrade gracefully like the other integrations.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<{ url: string; sessionId: string } | null> {
  const stripe = getClient();
  if (!stripe) {
    console.log("[stripe] STRIPE_SECRET_KEY not configured, cannot create checkout session");
    return null;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: KIT_PRICE_USD_CENTS,
          product_data: { name: KIT_PRODUCT_NAME },
        },
      },
    ],
    metadata: {
      kit_order_id: input.kitOrderId,
      ...(input.src ? { src: input.src } : {}),
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  if (!session.url) return null;
  return { url: session.url, sessionId: session.id };
}

export interface CheckoutSessionStatus {
  paid: boolean;
  src: string | null;
  amountTotal: number | null;
}

/**
 * Looks up a Checkout Session to confirm payment status. Returns null when
 * Stripe isn't configured or the session can't be retrieved.
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionStatus | null> {
  const stripe = getClient();
  if (!stripe) {
    console.log("[stripe] STRIPE_SECRET_KEY not configured, cannot confirm checkout session");
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      paid: session.payment_status === "paid",
      src: typeof session.metadata?.src === "string" ? session.metadata.src : null,
      amountTotal: session.amount_total,
    };
  } catch (error) {
    console.error("[stripe] failed to retrieve checkout session", error);
    return null;
  }
}
