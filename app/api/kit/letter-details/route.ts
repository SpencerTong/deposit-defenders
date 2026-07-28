import { NextRequest, NextResponse } from "next/server";
import {
  setKitOrderLetterDetails,
  type LetterDetails,
  type MailAddress,
} from "@/lib/db/kitOrders";
import { loadPaidOrder } from "@/lib/kit/orderAccess";

export const runtime = "nodejs";

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const STATE_PATTERN = /^[A-Z]{2}$/i;

function parseAddress(value: unknown): MailAddress | null {
  if (!value || typeof value !== "object") return null;
  const a = value as Record<string, unknown>;
  if (typeof a.line1 !== "string" || a.line1.trim() === "") return null;
  if (typeof a.city !== "string" || a.city.trim() === "") return null;
  if (typeof a.state !== "string" || !STATE_PATTERN.test(a.state)) return null;
  if (typeof a.zip !== "string" || !ZIP_PATTERN.test(a.zip)) return null;
  const line2 = typeof a.line2 === "string" && a.line2.trim() !== "" ? a.line2.trim() : undefined;
  return {
    line1: a.line1.trim(),
    ...(line2 ? { line2 } : {}),
    city: a.city.trim(),
    state: a.state.toUpperCase(),
    zip: a.zip,
  };
}

function parseDetails(value: unknown): LetterDetails | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  const tenantAddress = parseAddress(d.tenantAddress);
  const landlordAddress = parseAddress(d.landlordAddress);
  if (
    typeof d.tenantName !== "string" ||
    d.tenantName.trim() === "" ||
    typeof d.landlordName !== "string" ||
    d.landlordName.trim() === "" ||
    typeof d.propertyAddress !== "string" ||
    d.propertyAddress.trim() === "" ||
    typeof d.ownerOccupied !== "boolean" ||
    !tenantAddress ||
    !landlordAddress
  ) {
    return null;
  }
  const customNote =
    typeof d.customNote === "string" && d.customNote.trim() !== ""
      ? d.customNote.trim().slice(0, 2000)
      : undefined;
  return {
    tenantName: d.tenantName.trim(),
    tenantAddress,
    landlordName: d.landlordName.trim(),
    landlordAddress,
    propertyAddress: d.propertyAddress.trim(),
    ownerOccupied: d.ownerOccupied,
    ...(customNote ? { customNote } : {}),
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { sessionId, details } = (body ?? {}) as { sessionId?: unknown; details?: unknown };
  const access = await loadPaidOrder(typeof sessionId === "string" ? sessionId : null);
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  if (access.order.mailStatus !== "unsent") {
    return NextResponse.json({ ok: false, error: "locked_after_mailing" }, { status: 409 });
  }

  const parsed = parseDetails(details);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid_details" }, { status: 400 });
  }

  await setKitOrderLetterDetails(access.order.id, parsed);
  return NextResponse.json({ ok: true });
}
