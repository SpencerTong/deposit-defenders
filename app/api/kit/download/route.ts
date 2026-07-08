import { NextRequest, NextResponse } from "next/server";
import { getKitOrderBySessionId } from "@/lib/db/kitOrders";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { buildKitContent } from "@/lib/kit/content";
import { renderKitPdf } from "@/lib/kit/pdf";

// @react-pdf/renderer needs Node APIs, not available on the edge runtime.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  const order = await getKitOrderBySessionId(sessionId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "fulfilled") {
    return NextResponse.json({ ok: false, error: "not_paid" }, { status: 403 });
  }

  const tenancy = toTenancyInputs(order.answers as FlowAnswers);
  const analysis = analyzeTenancy(tenancy);
  const pdf = await renderKitPdf(buildKitContent(tenancy, analysis));

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="security-deposit-dispute-kit.pdf"',
    },
  });
}
