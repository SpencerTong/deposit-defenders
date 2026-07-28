"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "sent" | "error";

export function SupportForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, company }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error("support request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        Message sent. We read every message and reply from a real inbox, usually within a
        day or two.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="support-email" className="mb-1 block text-sm font-medium text-gray-900">
          Your email
        </label>
        <input
          id="support-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-gray-900">
          Message
        </label>
        <textarea
          id="support-message"
          required
          rows={5}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="What's going on with your order or letter?"
        />
      </div>
      {/* Honeypot: hidden from real visitors via CSS, not the required/type attributes
          bots often skip. Left blank by humans; a filled value tells the API to drop it. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="support-company">Company</label>
        <input
          id="support-company"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong sending that. Please try again shortly.
        </p>
      )}
    </form>
  );
}
