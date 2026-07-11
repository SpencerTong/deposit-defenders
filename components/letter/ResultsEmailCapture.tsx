"use client";

import { useState } from "react";
import type { FlowAnswers } from "@/lib/flow/types";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution";
import { trackEvent } from "@/lib/events";

type SubmitStatus = "idle" | "submitting" | "sent" | "error";

export function ResultsEmailCapture({ answers }: { answers: FlowAnswers }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const src = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, src, answers }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
      trackEvent("submitted_email");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="font-medium text-gray-900">Results sent to {email}</p>
        <p className="mt-1 text-sm text-gray-600">
          Check your inbox for your analysis summary and next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
      <p className="mb-1 font-medium text-gray-900">Email me my results</p>
      <p className="mb-4 text-sm text-gray-600">
        Optional. Keep a copy of your analysis and next steps in your inbox.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="lead-email" className="sr-only">
          Email address
        </label>
        <input
          id="lead-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {status === "submitting" && (
            <svg
              className="h-4 w-4 animate-spin text-accent"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {status === "submitting" ? "Sending…" : "Email me my results"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
