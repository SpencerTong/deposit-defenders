"use client";

import { useState } from "react";
import type { LetterDetails } from "@/lib/db/kitOrders";

type Status = "idle" | "mailing" | "error" | "bad_address" | "already";

interface MailPanelProps {
  sessionId: string;
  details: LetterDetails;
  mailStatus: "unsent" | "sending" | "sent";
  mailTracking: string | null;
  onMailed: () => void;
}

export function MailPanel({ sessionId, details, mailStatus, mailTracking, onMailed }: MailPanelProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [tracking, setTracking] = useState<string | null>(mailTracking);

  const sent = mailStatus === "sent" || status === "already";

  async function handleMail() {
    setStatus("mailing");
    try {
      const res = await fetch("/api/kit/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.status === 409) {
        setStatus("already");
        onMailed();
        return;
      }
      const data = (await res.json()) as { ok: boolean; error?: string; tracking?: string | null };
      if (!data.ok && data.error === "address_unverified") {
        setStatus("bad_address");
        return;
      }
      if (!data.ok) throw new Error("mail failed");
      setTracking(data.tracking ?? null);
      setStatus("idle");
      onMailed();
    } catch {
      setStatus("error");
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
        <p className="mb-1 font-medium text-gray-900">Your letter is on its way</p>
        <p className="text-sm text-gray-600">
          We sent it to {details.landlordName} by USPS Certified Mail with return receipt.
          {(tracking ?? mailTracking) ? (
            <>
              {" "}
              Tracking number: <span className="font-mono">{tracking ?? mailTracking}</span>. Track
              it at usps.com and keep this number with your records.
            </>
          ) : (
            " Your tracking number will appear here once USPS accepts the letter."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="mb-2 font-medium text-gray-900">Mail it certified, on us</p>
      <p className="mb-3 text-sm text-gray-600">
        We print your final letter and send it to {details.landlordName} at{" "}
        {details.landlordAddress.line1}, {details.landlordAddress.city} by USPS Certified Mail
        with return receipt. You get the tracking number here. This happens only when you click
        the button, and it will never go out twice by accident. If something needs correcting
        after it is sent, contact us and we can reopen it.
      </p>
      <label className="mb-4 flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>
          I reviewed the letter preview and both addresses above and they are correct. I
          understand this is a self-help document prepared from my answers and sent at my
          direction, that Deposit Defenders is not a law firm, and that no outcome is
          guaranteed.
        </span>
      </label>
      <button
        type="button"
        disabled={!confirmed || status === "mailing"}
        onClick={handleMail}
        className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {status === "mailing" ? "Sending to the mail house…" : "Mail it certified for me"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">
          The mailing did not go through. Nothing was sent. Please try again in a moment.
        </p>
      )}
      {status === "bad_address" && (
        <p className="mt-2 text-sm text-red-600">
          The postal service could not verify one of the addresses as deliverable, so nothing
          was sent. Use &quot;Edit details&quot; in step 2 to double-check the street number,
          spelling, city, state, and ZIP, then try again.
        </p>
      )}
    </div>
  );
}
