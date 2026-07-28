import { getPool } from "./client";
import type { FlowAnswers } from "@/lib/flow/types";

export type KitOrderStatus = "pending" | "paid" | "fulfilled";

export type MailStatus = "unsent" | "sending" | "sent";

export interface MailAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface LetterDetails {
  tenantName: string;
  tenantAddress: MailAddress;
  landlordName: string;
  landlordAddress: MailAddress;
  /** The rental unit the deposit was for; the tenant may live elsewhere now. */
  propertyAddress: string;
  ownerOccupied: boolean;
  customNote?: string;
}

export interface KitOrder {
  id: string;
  email: string | null;
  answers: unknown;
  stripeSessionId: string | null;
  status: KitOrderStatus;
  src: string | null;
  letterDetails: LetterDetails | null;
  mailStatus: MailStatus;
  mailTracking: string | null;
}

interface KitOrderRow {
  id: string;
  email: string | null;
  answers: unknown;
  stripe_session_id: string | null;
  status: KitOrderStatus;
  src: string | null;
  letter_details: LetterDetails | null;
  mail_status: MailStatus;
  mail_tracking: string | null;
}

const ORDER_COLUMNS =
  "id, email, answers, stripe_session_id, status, src, letter_details, mail_status, mail_tracking";

function toKitOrder(row: KitOrderRow): KitOrder {
  return {
    id: row.id,
    email: row.email,
    answers: row.answers,
    stripeSessionId: row.stripe_session_id,
    status: row.status,
    src: row.src,
    letterDetails: row.letter_details,
    mailStatus: row.mail_status ?? "unsent",
    mailTracking: row.mail_tracking,
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
    `SELECT ${ORDER_COLUMNS} FROM kit_orders WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? toKitOrder(result.rows[0]) : null;
}

export async function getKitOrderBySessionId(stripeSessionId: string): Promise<KitOrder | null> {
  const pool = getPool();
  if (!pool) return null;
  const result = await pool.query<KitOrderRow>(
    `SELECT ${ORDER_COLUMNS} FROM kit_orders WHERE stripe_session_id = $1`,
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

/**
 * Marks a pending order paid after payment is confirmed directly with Stripe
 * (the fallback path when the webhook hasn't arrived). Never downgrades a
 * fulfilled order.
 */
export async function markKitOrderPaid(id: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET status = 'paid' WHERE id = $1 AND status = 'pending'", [
    id,
  ]);
}

/** Undoes a fulfillment claim after a failed delivery so Stripe's retry can refulfill. */
export async function revertKitOrderToPaid(id: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET status = 'paid', fulfilled_at = NULL WHERE id = $1", [
    id,
  ]);
}

export async function setKitOrderLetterDetails(
  id: string,
  details: LetterDetails
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query("UPDATE kit_orders SET letter_details = $2 WHERE id = $1", [
    id,
    JSON.stringify(details),
  ]);
}

/**
 * Overwrites the order's answers snapshot, first appending the prior value
 * onto answers_history with a timestamp. Postgres evaluates every SET
 * expression in an UPDATE against the pre-update row, so referencing
 * `answers` while also setting it in the same statement is safe: the
 * history append always captures the value being replaced, not the new one.
 */
export async function setKitOrderAnswers(id: string, answers: FlowAnswers): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `UPDATE kit_orders
     SET answers_history = answers_history || jsonb_build_array(
           jsonb_build_object('answers', answers, 'replaced_at', now())
         ),
         answers = $2
     WHERE id = $1`,
    [id, JSON.stringify(answers)]
  );
}

/**
 * Atomically claims an order for certified mailing. Only one caller ever gets
 * `true` per order: the physical letter must never be sent twice.
 */
export async function claimKitOrderForMailing(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const result = await pool.query(
    "UPDATE kit_orders SET mail_status = 'sending' WHERE id = $1 AND mail_status = 'unsent' RETURNING id",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setKitOrderMailResult(
  id: string,
  result: { lobId: string; tracking: string | null }
): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    "UPDATE kit_orders SET mail_status = 'sent', lob_id = $2, mail_tracking = $3, mailed_at = now() WHERE id = $1",
    [id, result.lobId, result.tracking]
  );
}

/** Undoes a mailing claim after a failed Lob call so the buyer can retry. */
export async function revertKitOrderMailToUnsent(id: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    "UPDATE kit_orders SET mail_status = 'unsent' WHERE id = $1 AND mail_status = 'sending'",
    [id]
  );
}
