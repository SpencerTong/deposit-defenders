import { NextRequest, NextResponse } from "next/server";
import { getKitOrderBySessionId } from "@/lib/db/kitOrders";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  const order = await getKitOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: order.status });
}
