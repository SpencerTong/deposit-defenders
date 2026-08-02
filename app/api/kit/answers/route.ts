import { NextRequest, NextResponse } from "next/server";
import { setKitOrderAnswers } from "@/lib/db/kitOrders";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { isCompleteFlowAnswers } from "@/lib/flow/validation";
import type { DeductionDraft, FlowAnswers } from "@/lib/flow/types";
import type { TriState } from "@/lib/statute/ma";

export const runtime = "nodejs";

const INVALID = Symbol("invalid");

// `undefined` covers orders saved before a tri-state field existed: the stored
// answers JSON simply lacks the key, so it never reaches here as `null`.
// Treating it the same as `null` (unanswered) lets pre-existing buyers save
// edits instead of getting a spurious invalid_answers 400.
function parseTriStateOrNull(value: unknown): TriState | null | typeof INVALID {
  if (value === null || value === undefined) return null;
  if (value === "yes" || value === "no" || value === "unknown") return value;
  return INVALID;
}

function parseDeductions(value: unknown): DeductionDraft[] | null {
  if (!Array.isArray(value)) return null;
  const rows: DeductionDraft[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    if (typeof r.description !== "string" || typeof r.amount !== "string") return null;
    rows.push({ description: r.description, amount: r.amount });
  }
  return rows;
}

function parseAnswers(value: unknown): FlowAnswers | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;

  if (typeof a.depositAmount !== "string") return null;
  if (typeof a.monthlyRent !== "string") return null;
  if (typeof a.tenancyStartDate !== "string") return null;
  if (typeof a.moveOutDate !== "string") return null;
  if (a.tenancyEndConfirmed !== null && typeof a.tenancyEndConfirmed !== "boolean") return null;
  if (typeof a.itemizedListDate !== "string") return null;
  if (a.receivedItemizedList !== null && typeof a.receivedItemizedList !== "boolean") return null;
  if (typeof a.amountReturned !== "string") return null;

  const receivedBankReceipt = parseTriStateOrNull(a.receivedBankReceipt);
  const receivedStatementOfCondition = parseTriStateOrNull(a.receivedStatementOfCondition);
  const listSwornUnderPenalty = parseTriStateOrNull(a.listSwornUnderPenalty);
  const interestPaidAnnually = parseTriStateOrNull(a.interestPaidAnnually);
  const leaseRequiredProfessionalCleaning = parseTriStateOrNull(a.leaseRequiredProfessionalCleaning);
  if (
    receivedBankReceipt === INVALID ||
    receivedStatementOfCondition === INVALID ||
    listSwornUnderPenalty === INVALID ||
    interestPaidAnnually === INVALID ||
    leaseRequiredProfessionalCleaning === INVALID
  ) {
    return null;
  }

  const deductionsClaimed = parseDeductions(a.deductionsClaimed);
  if (!deductionsClaimed) return null;

  return {
    depositAmount: a.depositAmount,
    monthlyRent: a.monthlyRent,
    tenancyStartDate: a.tenancyStartDate,
    moveOutDate: a.moveOutDate,
    tenancyEndConfirmed: (a.tenancyEndConfirmed as boolean | null) ?? null,
    receivedBankReceipt: receivedBankReceipt as TriState | null,
    receivedStatementOfCondition: receivedStatementOfCondition as TriState | null,
    receivedItemizedList: (a.receivedItemizedList as boolean | null) ?? null,
    itemizedListDate: a.itemizedListDate,
    listSwornUnderPenalty: listSwornUnderPenalty as TriState | null,
    deductionsClaimed,
    amountReturned: a.amountReturned,
    interestPaidAnnually: interestPaidAnnually as TriState | null,
    leaseRequiredProfessionalCleaning: leaseRequiredProfessionalCleaning as TriState | null,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { sessionId, answers } = (body ?? {}) as { sessionId?: unknown; answers?: unknown };
  const access = await loadPaidOrder(typeof sessionId === "string" ? sessionId : null);
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  if (access.order.mailStatus !== "unsent") {
    return NextResponse.json({ ok: false, error: "locked_after_mailing" }, { status: 409 });
  }

  const parsed = parseAnswers(answers);
  if (!parsed || !isCompleteFlowAnswers(parsed)) {
    return NextResponse.json({ ok: false, error: "invalid_answers" }, { status: 400 });
  }

  const updated = await setKitOrderAnswers(access.order.id, parsed);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "locked_after_mailing" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
