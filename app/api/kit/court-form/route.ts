import { NextRequest, NextResponse } from "next/server";
import { loadPaidOrder } from "@/lib/kit/orderAccess";
import { buildSmallClaimDraft } from "@/lib/court/smallClaim";
import { renderSmallClaimPdf } from "@/lib/court/smallClaimPdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const access = await loadPaidOrder(req.nextUrl.searchParams.get("session_id"));
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const pdf = await renderSmallClaimPdf(buildSmallClaimDraft(access.order));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="statement-of-small-claim-draft.pdf"',
    },
  });
}
