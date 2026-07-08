"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderState = "checking" | "fulfilled" | "paid" | "unconfirmed";

export function KitSuccessClient() {
  const [state, setState] = useState<OrderState>("checking");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
    if (!id) {
      setState("unconfirmed");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    // The webhook fulfills within seconds; poll briefly so the buyer usually
    // sees "fulfilled" (with the download link) rather than a waiting state.
    async function check() {
      try {
        const res = await fetch(`/api/kit/order?session_id=${encodeURIComponent(id!)}`);
        const data = (await res.json()) as { ok: boolean; status?: string };
        if (cancelled) return;
        if (data.ok && data.status === "fulfilled") {
          setState("fulfilled");
          return;
        }
        if (data.ok && (data.status === "paid" || data.status === "pending")) {
          setState("paid");
        } else {
          setState("unconfirmed");
          return;
        }
      } catch {
        if (!cancelled) setState("unconfirmed");
        return;
      }
      attempts += 1;
      if (attempts < 5) setTimeout(check, 2000);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16 text-center">
      {state === "checking" && <p className="text-gray-500">Confirming your payment…</p>}

      {state === "fulfilled" && (
        <div className="rounded-2xl bg-accent px-6 py-8 text-white shadow-lg">
          <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Thank you</p>
          <h1 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">
            Your kit is in your inbox
          </h1>
          <p className="mb-5 text-white/90">
            We&apos;ve emailed your demand letter and Dispute Kit. You can also download the kit
            right now:
          </p>
          <a
            href={`/api/kit/download?session_id=${encodeURIComponent(sessionId ?? "")}`}
            className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-100"
          >
            Download the Dispute Kit (PDF)
          </a>
        </div>
      )}

      {state === "paid" && (
        <div className="rounded-2xl bg-accent px-6 py-8 text-white shadow-lg">
          <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Thank you</p>
          <h1 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">You&apos;re all set</h1>
          <p className="text-white/90">
            Your kit is being prepared and will arrive by email in the next few minutes. Keep this
            page open, or check your inbox.
          </p>
        </div>
      )}

      {state === "unconfirmed" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
          <p className="mb-2 font-medium text-gray-900">We couldn&apos;t confirm your payment yet</p>
          <p className="text-sm">
            If you completed checkout, your kit will arrive by email shortly. If it hasn&apos;t
            arrived within an hour, reply to any of our emails and we&apos;ll sort it out.
          </p>
        </div>
      )}

      <Link href="/" className="mt-8 text-sm text-accent underline">
        Back to Deposit Defenders
      </Link>
    </main>
  );
}
