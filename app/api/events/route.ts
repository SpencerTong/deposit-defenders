import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/db/events";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { name, src, properties, path } = (body ?? {}) as {
    name?: unknown;
    src?: unknown;
    properties?: unknown;
    path?: unknown;
  };

  if (typeof name !== "string" || name.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordEvent({
    name,
    src: typeof src === "string" ? src : null,
    path: typeof path === "string" ? path : null,
    properties:
      properties && typeof properties === "object"
        ? (properties as Record<string, unknown>)
        : {},
  });

  return NextResponse.json({ ok: true });
}
