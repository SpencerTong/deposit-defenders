import { NextRequest, NextResponse } from "next/server";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { buildLetterForOrder } from "@/lib/letter/fromOrder";
import { renderDemandLetterPdf } from "@/lib/letter/pdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const access = await loadPaidOrder(req.nextUrl.searchParams.get("session_id"));
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const pdf = await renderDemandLetterPdf(buildLetterForOrder(access.order));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="security-deposit-demand-letter.pdf"',
    },
  });
}
