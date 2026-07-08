import { getPool } from "./client";

export type KitOrderStatus = "pending" | "paid" | "fulfilled";

export interface KitOrder {
  id: string;
  email: string | null;
  answers: unknown;
  stripeSessionId: string | null;
  status: KitOrderStatus;
  src: string | null;
}

interface KitOrderRow {
  id: string;
  email: string | null;
  answers: unknown;
  stripe_session_id: string | null;
  status: KitOrderStatus;
  src: string | null;
}

function toKitOrder(row: KitOrderRow): KitOrder {
  return {
    id: row.id,
    email: row.email,
    answers: row.answers,
    stripeSessionId: row.stripe_session_id,
    status: row.status,
    src: row.src,
  };
}

/**
 * Creates a pending kit order holding the buyer's answers snapshot. Unlike the
 * other db modules this returns null (rather than degrading to a console log)
 * when the database is unconfigured: taking a payment without a stored
 * snapshot would create an order we can never fulfill, so the caller must
 * refuse checkout instead.
 */
export async function createKitOrder(input: {
  answers: unknown;
  src: string | null;
}): Promise<{ id: string } | null> {
  const pool = getPool();
  if (!pool) {
    console.log("[kit_orders] POSTGRES_URL not configured, cannot create order");
    return null;
  }
  try {
    const result = await pool.query<{ id: string }>(
      "INSERT INTO kit_orders (answers, src) VALUES ($1, $2) RETURNING id",
      [JSON.stringify(input.answers), input.src]
    );
    const row = result.rows[0];
    return row ? { id: row.id } : null;
  } catch (error) {
    console.error("[kit_orders] failed to create order", error);
    return null;
  }
}

export async function setKitOrderSession(id: string, stripeSessionId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET stripe_session_id = $2 WHERE id = $1", [
    id,
    stripeSessionId,
  ]);
}

export async function setKitOrderEmail(id: string, email: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET email = $2 WHERE id = $1", [id, email]);
}

export async function getKitOrderById(id: string): Promise<KitOrder | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<KitOrderRow>(
    "SELECT id, email, answers, stripe_session_id, status, src FROM kit_orders WHERE id = $1",
    [id]
  );
  return result.rows[0] ? toKitOrder(result.rows[0]) : null;
}

export async function getKitOrderBySessionId(stripeSessionId: string): Promise<KitOrder | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<KitOrderRow>(
    "SELECT id, email, answers, stripe_session_id, status, src FROM kit_orders WHERE stripe_session_id = $1",
    [stripeSessionId]
  );
  return result.rows[0] ? toKitOrder(result.rows[0]) : null;
}

/**
 * Atomically claims an order for fulfillment. Returns false when the order is
 * already fulfilled (or doesn't exist), which makes webhook retries and
 * concurrent deliveries idempotent: only one caller ever gets `true`.
 */
export async function claimKitOrderForFulfillment(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const result = await pool.query(
    "UPDATE kit_orders SET status = 'fulfilled', fulfilled_at = now() WHERE id = $1 AND status <> 'fulfilled' RETURNING id",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Undoes a fulfillment claim after a failed delivery so Stripe's retry can refulfill. */
export async function revertKitOrderToPaid(id: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET status = 'paid', fulfilled_at = NULL WHERE id = $1", [
    id,
  ]);
}
