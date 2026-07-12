import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { buildDemandLetter } from "@/lib/letter/template";
import { renderDemandLetterPdf } from "@/lib/letter/pdf";
import { buildKitContent } from "./content";
import { renderKitPdf } from "./pdf";
import {
  claimKitOrderForFulfillment,
  getKitOrderById,
  revertKitOrderToPaid,
  setKitOrderEmail,
  type KitOrder,
} from "@/lib/db/kitOrders";
import { sendKitEmail } from "@/lib/email/resend";
import { recordEvent } from "@/lib/db/events";
import { SITE_URL } from "@/lib/site";

export interface FulfillDeps {
  getOrder: (id: string) => Promise<KitOrder | null>;
  claimOrder: (id: string) => Promise<boolean>;
  revertOrder: (id: string) => Promise<void>;
  saveEmail: (id: string, email: string) => Promise<void>;
  sendEmail: (input: {
    to: string;
    letterPdf: Uint8Array;
    kitPdf: Uint8Array;
    workspaceUrl: string | null;
  }) => Promise<{ sent: boolean }>;
  recordPurchase: (src: string | null) => Promise<void>;
}

const defaultDeps: FulfillDeps = {
  getOrder: getKitOrderById,
  claimOrder: claimKitOrderForFulfillment,
  revertOrder: revertKitOrderToPaid,
  saveEmail: setKitOrderEmail,
  sendEmail: sendKitEmail,
  recordPurchase: (src) => recordEvent({ eventName: "purchased", src }),
};

export type FulfillResult = "fulfilled" | "already_fulfilled" | "retry" | "not_found";

/**
 * Fulfills a paid kit order exactly once: claims it (idempotency gate),
 * regenerates both PDFs from the stored answers snapshot, emails them, and
 * records the purchase. "retry" means the caller should return a non-2xx so
 * Stripe redelivers the webhook.
 */
export async function fulfillKitOrder(
  kitOrderId: string,
  email: string | null,
  deps: FulfillDeps = defaultDeps
): Promise<FulfillResult> {
  const order = await deps.getOrder(kitOrderId);
  if (!order) return "not_found";

  const deliverTo = email ?? order.email;
  if (!deliverTo) {
    console.error(`[kit] order ${kitOrderId} has no delivery email`);
    return "retry";
  }

  const claimed = await deps.claimOrder(kitOrderId);
  if (!claimed) return "already_fulfilled";

  try {
    if (email) await deps.saveEmail(kitOrderId, email);

    const tenancy = toTenancyInputs(order.answers as FlowAnswers);
    const analysis = analyzeTenancy(tenancy);
    const letter = buildDemandLetter(tenancy, analysis);
    const letterPdf = await renderDemandLetterPdf(letter);
    const kitPdf = await renderKitPdf(buildKitContent(tenancy, analysis));

    const workspaceUrl = order.stripeSessionId
      ? `${SITE_URL}/kit/success?session_id=${encodeURIComponent(order.stripeSessionId)}`
      : null;
    const { sent } = await deps.sendEmail({ to: deliverTo, letterPdf, kitPdf, workspaceUrl });
    if (!sent) {
      await deps.revertOrder(kitOrderId);
      return "retry";
    }

    await deps.recordPurchase(order.src);
    return "fulfilled";
  } catch (error) {
    console.error(`[kit] fulfillment failed for order ${kitOrderId}`, error);
    await deps.revertOrder(kitOrderId);
    return "retry";
  }
}
