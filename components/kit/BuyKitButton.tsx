"use client";

import { useState } from "react";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution";
import { FLOW_ANSWERS_STORAGE_KEY } from "@/lib/flow/storage";
import { trackEvent } from "@/lib/events";

type Status = "idle" | "submitting" | "needs_answers" | "error";

export function BuyKitButton({
  className,
  trustClassName,
}: {
  className?: string;
  trustClassName?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    trackEvent("clicked_kit");

    const rawAnswers = window.sessionStorage.getItem(FLOW_ANSWERS_STORAGE_KEY);
    if (!rawAnswers) {
      // The kit is personalized from the free flow's answers; route there first.
      setStatus("needs_answers");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 2500);
      return;
    }

    setStatus("submitting");
    const src = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src, answers: JSON.parse(rawAnswers) }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string };
      if (!data.ok || !data.url) throw new Error("checkout unavailable");
      window.location.href = data.url;
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "submitting"}
        className={
          className ??
          "w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-lg disabled:opacity-60 sm:w-auto sm:px-10"
        }
      >
        {status === "submitting" ? "Redirecting to checkout…" : "Get my letter written and sent for $49"}
      </button>
      <p className={trustClassName ?? "mt-2 text-xs text-gray-500"}>
        One-time payment. Secure checkout by Stripe. Instant delivery.
      </p>
      {status === "needs_answers" && (
        <p className="mt-2 text-sm text-gray-600">
          Your kit is personalized from the free deposit check, so answer those questions first.
          Taking you there now…
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">
          Checkout isn&apos;t available right now. Please try again shortly.
        </p>
      )}
    </div>
  );
}
