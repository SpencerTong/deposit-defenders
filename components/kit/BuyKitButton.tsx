"use client";

import { useState } from "react";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution";
import { trackEvent } from "@/lib/events";

type Status = "idle" | "submitting" | "error";

export function BuyKitButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    setStatus("submitting");
    trackEvent("clicked_kit");

    const src = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src }),
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
          "w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:px-10"
        }
      >
        {status === "submitting" ? "Redirecting to checkout…" : "Get the Dispute Kit — $49"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">
          Checkout isn&apos;t available right now. Please try again shortly.
        </p>
      )}
    </div>
  );
}
