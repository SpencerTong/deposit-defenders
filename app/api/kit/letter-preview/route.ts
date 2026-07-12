import { NextRequest, NextResponse } from "next/server";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { buildLetterForOrder } from "@/lib/letter/fromOrder";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const access = await loadPaidOrder(req.nextUrl.searchParams.get("session_id"));
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  return NextResponse.json({ ok: true, letter: buildLetterForOrder(access.order) });
}
