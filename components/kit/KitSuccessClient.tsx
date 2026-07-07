"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConfirmState = "checking" | "paid" | "unconfirmed";

export function KitSuccessClient() {
  const [state, setState] = useState<ConfirmState>("checking");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setState("unconfirmed");
      return;
    }

    fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; paid?: boolean }) => {
        setState(data.ok && data.paid ? "paid" : "unconfirmed");
      })
      .catch(() => setState("unconfirmed"));
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16 text-center">
      {state === "checking" && <p className="text-gray-500">Confirming your payment…</p>}

      {state === "paid" && (
        <div className="rounded-2xl bg-accent px-6 py-8 text-white shadow-lg">
          <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Thank you</p>
          <h1 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">You&apos;re all set</h1>
          <p className="text-white/90">Your kit will arrive by email within 24 hours.</p>
        </div>
      )}

      {state === "unconfirmed" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
          <p className="mb-2 font-medium text-gray-900">We couldn&apos;t confirm your payment yet</p>
          <p className="text-sm">
            If you completed checkout, you&apos;re all set — your kit will arrive by email within 24
            hours. If you don&apos;t hear back, reply to any of our emails and we&apos;ll sort it out.
          </p>
        </div>
      )}

      <Link href="/" className="mt-8 text-sm text-accent underline">
        Back to Deposit Defenders
      </Link>
    </main>
  );
}
