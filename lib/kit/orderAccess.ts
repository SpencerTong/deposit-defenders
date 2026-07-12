import { getKitOrderBySessionId, type KitOrder } from "@/lib/db/kitOrders";

export type OrderAccess =
  | { ok: true; order: KitOrder }
  | { ok: false; error: string; status: number };

/**
 * Shared gate for the paid workspace routes: the order must exist and be paid
 * for (fulfilled covers paid + delivered; paid covers the webhook race).
 */
export async function loadPaidOrder(sessionId: string | null): Promise<OrderAccess> {
  if (!sessionId) return { ok: false, error: "missing_session_id", status: 400 };

  const order = await getKitOrderBySessionId(sessionId);
  if (!order) return { ok: false, error: "order_not_found", status: 404 };
  if (order.status !== "fulfilled" && order.status !== "paid") {
    return { ok: false, error: "not_paid", status: 403 };
  }
  return { ok: true, order };
}
