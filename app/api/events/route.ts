import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/db/events";

const MAX_PROPERTY_KEYS = 12;
const MAX_PROPERTIES_BYTES = 1024;
const MAX_STRING_VALUE_LENGTH = 200;

/**
 * This endpoint is public and unauthenticated, so `properties` is attacker
 * controlled: anyone can POST anything to it. We therefore accept only a flat
 * object of small scalars, drop everything else, and bound the total size.
 * Without this, a jsonb column on a public write endpoint is an invitation to
 * fill the database.
 */
function sanitizeProperties(input: unknown): Record<string, unknown> | null {
  if (input == null || typeof input !== "object" || Array.isArray(input)) return null;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(clean).length >= MAX_PROPERTY_KEYS) break;
    if (key.length > 64) continue;
    // Scalars only: nested structures are what make payload size unbounded.
    if (typeof value === "number" && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === "boolean") clean[key] = value;
    else if (typeof value === "string") clean[key] = value.slice(0, MAX_STRING_VALUE_LENGTH);
  }

  if (Object.keys(clean).length === 0) return null;
  if (JSON.stringify(clean).length > MAX_PROPERTIES_BYTES) return null;
  return clean;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { name, src, properties } = (body ?? {}) as {
    name?: unknown;
    src?: unknown;
    properties?: unknown;
  };

  if (typeof name !== "string" || name.length === 0 || name.length > 64) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordEvent({
    eventName: name,
    src: typeof src === "string" ? src.slice(0, 64) : null,
    properties: sanitizeProperties(properties),
  });

  return NextResponse.json({ ok: true });
}
