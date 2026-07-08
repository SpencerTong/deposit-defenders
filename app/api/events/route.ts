import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/db/events";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { name, src } = (body ?? {}) as { name?: unknown; src?: unknown };

  if (typeof name !== "string" || name.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordEvent({
    eventName: name,
    src: typeof src === "string" ? src : null,
  });

  return NextResponse.json({ ok: true });
}
