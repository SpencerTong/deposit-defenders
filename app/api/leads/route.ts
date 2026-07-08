import { NextRequest, NextResponse } from "next/server";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { buildDemandLetter } from "@/lib/letter/template";
import { renderDemandLetterPdf } from "@/lib/letter/pdf";
import { sendLetterEmail } from "@/lib/email/resend";
import { recordLead } from "@/lib/db/leads";

// @react-pdf/renderer needs Node APIs (fontkit, etc.), not available on the edge runtime.
export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { email, src, answers } = (body ?? {}) as {
    email?: unknown;
    src?: unknown;
    answers?: unknown;
  };

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ ok: false, error: "missing_answers" }, { status: 400 });
  }

  const tenancy = toTenancyInputs(answers as FlowAnswers);
  const analysis = analyzeTenancy(tenancy);
  const letter = buildDemandLetter(tenancy, analysis);
  const pdf = await renderDemandLetterPdf(letter);

  const resolvedSrc = typeof src === "string" ? src : null;
  const rulesFired = analysis.rules.filter((rule) => rule.triggered).map((rule) => rule.id);

  await recordLead({
    email,
    src: resolvedSrc,
    depositAmount: tenancy.depositAmount,
    rulesFired,
  });
  const { sent } = await sendLetterEmail({ to: email, pdfBytes: pdf });

  return NextResponse.json({ ok: true, sent });
}
