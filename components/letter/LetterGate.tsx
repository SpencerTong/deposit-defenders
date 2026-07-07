"use client";

import { useState } from "react";
import Link from "next/link";
import type { DemandLetterContent } from "@/lib/letter/template";
import type { FlowAnswers } from "@/lib/flow/types";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution";
import { trackEvent } from "@/lib/events";

interface LetterGateProps {
  letter: DemandLetterContent;
  answers: FlowAnswers;
}

type SubmitStatus = "idle" | "submitting" | "sent" | "error";

export function LetterGate({ letter, answers }: LetterGateProps) {
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

  const unlocked = status === "sent";

  return (
    <div className="mt-10">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Your demand letter</h3>

      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="space-y-3 p-5 text-sm leading-relaxed text-gray-800">
          <p>{letter.date}</p>
          <p>
            {letter.tenantName}
            <br />
            {letter.tenantAddress}
          </p>
          <p>
            {letter.landlordName}
            <br />
            {letter.landlordAddress}
          </p>
          <p className="font-medium">{letter.subject}</p>
          <p>{letter.salutation}</p>

          {letter.paragraphs.map((paragraph, i) => (
            <p key={i} className={i === 0 ? "" : unlocked ? "" : "blur-sm select-none"}>
              {paragraph}
            </p>
          ))}

          <p className={unlocked ? "" : "blur-sm select-none"}>
            {letter.closing}
            <br />
            {letter.signatureName}
          </p>
        </div>

        {!unlocked && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-white/95 px-5 pb-5 pt-8">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-2 text-center">
              <p className="text-sm font-medium text-gray-900">
                Enter your email to unlock the rest and get your free letter as a PDF
              </p>
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
                className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : "Email me my free letter"}
              </button>
              {status === "error" && (
                <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
              )}
            </form>
          </div>
        )}
      </div>

      {unlocked && (
        <>
          <p className="mt-3 text-sm text-gray-500">
            Sent to {email}. Check your inbox for the PDF.
          </p>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
            <p className="mb-1 font-medium text-gray-900">Want to back up your letter?</p>
            <p className="mb-4 text-sm text-gray-600">
              The $49 Dispute Kit includes an evidence checklist, certified mail instructions, a
              deadline tracker, and a walkthrough for filing in Massachusetts small claims court if
              your landlord doesn&apos;t pay.
            </p>
            <Link
              href="/kit"
              className="inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              See the Dispute Kit
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
