import { NextRequest, NextResponse } from "next/server";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { buildLetterForOrder } from "@/lib/letter/fromOrder";
import { renderDemandLetterDocx } from "@/lib/letter/docx";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const access = await loadPaidOrder(req.nextUrl.searchParams.get("session_id"));
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const docx = await renderDemandLetterDocx(buildLetterForOrder(access.order));
  return new NextResponse(new Uint8Array(docx), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="security-deposit-demand-letter.docx"',
    },
  });
}
