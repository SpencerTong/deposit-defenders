import { NextRequest, NextResponse } from "next/server";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import type { FlowAnswers } from "@/lib/flow/types";
import { sendResultsEmail } from "@/lib/email/resend";
import { recordLead } from "@/lib/db/leads";

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

  const resolvedSrc = typeof src === "string" ? src : null;
  const rulesFired = analysis.rules.filter((rule) => rule.triggered).map((rule) => rule.id);
  // R5 is an informational wear-and-tear flag, not a violation; matches the
  // on-screen count in AnalysisResult.
  const violationCount = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
  ).length;

  await recordLead({
    email,
    src: resolvedSrc,
    depositAmount: tenancy.depositAmount,
    rulesFired,
  });
  const { sent } = await sendResultsEmail({
    to: email,
    maxExposure: analysis.exposure.maxExposure,
    violationCount,
  });

  return NextResponse.json({ ok: true, sent });
}
