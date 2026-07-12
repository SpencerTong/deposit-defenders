"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LetterDetails, MailStatus } from "@/lib/db/kitOrders";
import type { DemandLetterContent } from "@/lib/letter/template";
import { FAQ_ITEMS } from "@/lib/faq/content";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { LetterDetailsForm } from "./LetterDetailsForm";
import { MailPanel } from "./MailPanel";

type OrderState = "checking" | "workspace" | "paid" | "unconfirmed";

interface OrderInfo {
  status: string;
  letterDetails: LetterDetails | null;
  mailStatus: MailStatus;
  mailTracking: string | null;
}

function StepHeading({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold text-gray-900">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
        {number}
      </span>
      {title}
    </h2>
  );
}

function DownloadLink({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <a
      href={href}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-accent"
    >
      <span className="font-medium text-accent">{label}</span>
      <span className="text-xs text-gray-500">{note}</span>
    </a>
  );
}

export function KitSuccessClient() {
  const [state, setState] = useState<OrderState>("checking");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [letter, setLetter] = useState<DemandLetterContent | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);

  const refreshOrder = useCallback(async (id: string): Promise<OrderInfo | null> => {
    try {
      const res = await fetch(`/api/kit/order?session_id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as ({ ok: true } & OrderInfo) | { ok: false };
      if (!data.ok) return null;
      const info: OrderInfo = {
        status: data.status,
        letterDetails: data.letterDetails,
        mailStatus: data.mailStatus ?? "unsent",
        mailTracking: data.mailTracking,
      };
      setOrder(info);
      return info;
    } catch {
      return null;
    }
  }, []);

  const refreshLetter = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/kit/letter-preview?session_id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as { ok: boolean; letter?: DemandLetterContent };
      if (data.ok && data.letter) setLetter(data.letter);
    } catch {
      // Preview is best-effort; downloads still work.
    }
  }, []);

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

    // The workspace opens on payment; the email is a courtesy copy, never the
    // gate. "paid" comes from the webhook or from the order route's direct
    // Stripe fallback, so an email or webhook outage cannot lock a buyer out.
    async function check() {
      const info = await refreshOrder(id!);
      if (cancelled) return;
      if (info && (info.status === "fulfilled" || info.status === "paid")) {
        setState("workspace");
        void refreshLetter(id!);
        return;
      }
      if (info && info.status === "pending") {
        setState("paid");
      } else if (!info) {
        setState("unconfirmed");
        return;
      }
      attempts += 1;
      if (attempts < 10) setTimeout(check, 2000);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [refreshOrder, refreshLetter]);

  if (state !== "workspace") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16 text-center">
        {state === "checking" && <p className="text-gray-500">Confirming your payment…</p>}

        {state === "paid" && (
          <div className="rounded-2xl bg-accent px-6 py-8 text-white shadow-lg">
            <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Thank you</p>
            <h1 className="mb-3 font-serif text-2xl font-bold sm:text-3xl">You&apos;re all set</h1>
            <p className="text-white/90">
              Confirming your payment. This page becomes your letter workspace in a few seconds;
              if it doesn&apos;t, refresh the page. Your kit also arrives by email.
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

  const details = order?.letterDetails ?? null;
  const showForm = !details || editingDetails;
  const sid = sessionId ?? "";
  const q = `session_id=${encodeURIComponent(sid)}`;

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-8 rounded-2xl bg-accent px-6 py-6 text-white shadow-lg">
        <p className="mb-1 text-sm uppercase tracking-wide text-white/70">Your kit workspace</p>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">Finish and send your letter</h1>
        <p className="mt-2 text-sm text-white/90">
          Three steps: fill in the details, review the letter, and have us mail it certified.
          Bookmark this page; it stays available.
        </p>
      </div>

      {order?.status === "paid" && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Payment confirmed. Your email copy of the kit is on its way; everything is also
          available right here.
        </div>
      )}

      <section className="mb-10">
        <StepHeading number={1} title="Letter details" />
        {showForm ? (
          <LetterDetailsForm
            sessionId={sid}
            initial={details}
            onSaved={() => {
              setEditingDetails(false);
              void refreshOrder(sid);
              void refreshLetter(sid);
            }}
          />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              <span className="font-medium text-gray-900">{details.tenantName}</span> to{" "}
              <span className="font-medium text-gray-900">{details.landlordName}</span>,{" "}
              {details.landlordAddress.line1}, {details.landlordAddress.city},{" "}
              {details.landlordAddress.state} {details.landlordAddress.zip}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {details.ownerOccupied
                ? "Security deposit law letter (your landlord lives in the building)."
                : "Combined letter under the security deposit law and Chapter 93A."}
            </p>
            <button
              type="button"
              onClick={() => setEditingDetails(true)}
              className="mt-2 text-sm font-medium text-accent hover:underline"
            >
              Edit details
            </button>
          </div>
        )}
      </section>

      <section className="mb-10">
        <StepHeading number={2} title="Review your letter" />
        <p className="mb-3 text-xs text-gray-500">
          This letter is a self-help document prepared from your answers. Review every fact
          carefully before sending; you are responsible for its accuracy. It states your claims
          in your name.
        </p>
        {letter ? (
          <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-800">
            <p>{letter.date}</p>
            <p className="whitespace-pre-line">
              {letter.tenantName}
              {"\n"}
              {letter.tenantAddress}
            </p>
            <p className="whitespace-pre-line">
              {letter.landlordName}
              {"\n"}
              {letter.landlordAddress}
            </p>
            <p className="font-medium">{letter.subject}</p>
            <p>{letter.salutation}</p>
            {letter.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            <p>
              {letter.closing}
              <br />
              {letter.signatureName}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading your letter…</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DownloadLink
            href={`/api/kit/letter-pdf?${q}`}
            label="Demand letter (PDF)"
            note="Ready to print and sign"
          />
          <DownloadLink
            href={`/api/kit/letter-docx?${q}`}
            label="Demand letter (Word)"
            note="Editable .docx for your own changes"
          />
          <DownloadLink
            href={`/api/kit/download?${q}`}
            label="Dispute Kit (PDF)"
            note="Evidence checklist, timeline, small claims walkthrough"
          />
          <DownloadLink
            href={`/api/kit/court-form?${q}`}
            label="Small claim form (draft PDF)"
            note="Your entries for the court's official form"
          />
        </div>
      </section>

      <section className="mb-10">
        <StepHeading number={3} title="Send it certified" />
        {details && order ? (
          <MailPanel
            sessionId={sid}
            details={details}
            mailStatus={order.mailStatus}
            mailTracking={order.mailTracking}
            onMailed={() => void refreshOrder(sid)}
          />
        ) : (
          <p className="text-sm text-gray-500">Save your letter details first (step 1).</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Common questions</h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      <Link href="/" className="inline-block text-sm text-accent underline">
        Back to Deposit Defenders
      </Link>
    </main>
  );
}
