import type { Metadata } from "next";
import { BuyKitButton } from "@/components/kit/BuyKitButton";

export const metadata: Metadata = {
  title: "Dispute Kit | Deposit Defenders",
  description:
    "For $49 we write your Massachusetts security deposit demand letter, send it certified mail for you, and prepare your small claims paperwork.",
};

function Deliverable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-1 flex gap-2 font-medium text-gray-900">
        <span className="text-accent">&#10003;</span>
        {title}
      </p>
      <p className="pl-6 text-sm text-gray-700">{children}</p>
    </li>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
        {number}
      </span>
      <div className="text-sm text-gray-700">
        <p className="mb-1 font-medium text-gray-900">{title}</p>
        {children}
      </div>
    </li>
  );
}

export default function KitPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-10 rounded-2xl bg-accent px-6 py-8 text-center text-white shadow-lg">
        <p className="mb-2 text-sm uppercase tracking-wide text-white/70">
          Turn your analysis into action
        </p>
        <h1 className="mb-3 font-serif text-3xl font-bold sm:text-4xl">
          The Security Deposit Dispute Kit
        </h1>
        <p className="mb-6 text-white/90">
          For a one-time $49, we write your formal demand letter citing each violation the law
          check found, send it to your landlord by certified mail for you, and prepare your
          small claims paperwork in case they still do not pay.
        </p>
        <BuyKitButton
          className="w-full rounded-xl bg-white px-6 py-4 text-lg font-semibold text-accent shadow-md transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-lg sm:w-auto sm:px-10"
          trustClassName="mt-2 text-xs text-white/70"
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Everything is built from your answers
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Nothing generic. Your letter cites your violations, your deadlines are computed from
          your dates, and your court paperwork carries your names and amounts.
        </p>
        <ul className="space-y-2">
          <Deliverable title="Your formal demand letter, written and strengthened">
            Cites each violation with the exact statute. Where the law allows, it is upgraded to
            a Consumer Protection Act (Chapter 93A) demand, the version attorneys send. Delivered
            as a print-ready PDF and an editable Word document.
          </Deliverable>
          <Deliverable title="Sent by certified mail, for you">
            We mail it to your landlord by USPS Certified Mail with return receipt. You skip the
            post office and keep the tracking number and delivery confirmation as proof.
          </Deliverable>
          <Deliverable title="Your small claim form, pre-filled">
            A completed draft of the Massachusetts Statement of Small Claim with your parties,
            your claim amount, your claim description, and the current filing fee for a claim
            your size, ready to copy onto the court&apos;s official form.
          </Deliverable>
          <Deliverable title="Your evidence plan and deadline tracker">
            A personalized packet: what evidence to gather for your specific violations, your
            landlord&apos;s exact response deadline, and the full walkthrough for filing and
            winning in small claims court if the deadline passes.
          </Deliverable>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">How it works after you pay</h2>
        <ol className="space-y-3">
          <Step number={1} title="Your kit arrives instantly">
            The letter and packet land in your inbox, and your private letter workspace opens.
          </Step>
          <Step number={2} title="You review and personalize">
            Add your names and addresses, make any edits, and see the final letter exactly as
            your landlord will.
          </Step>
          <Step number={3} title="One click sends it certified">
            We print and mail it with return receipt. Your tracking number appears in your
            workspace the moment it ships.
          </Step>
        </ol>
      </section>

      <section className="mb-10 rounded-lg border-l-4 border-accent bg-gray-50 p-4">
        <p className="text-sm text-gray-800">
          For perspective: a single consult with a landlord-tenant attorney commonly starts
          around $150, and certified mail with return receipt alone runs about $10 at the post
          office. The kit is $49, once, with everything prepared for you.
        </p>
      </section>

      <div className="mb-6 text-center">
        <BuyKitButton />
        <p className="mt-4 text-sm text-gray-600">
          Still deciding?{" "}
          <a href="/faq" className="font-medium text-accent underline">
            Read the common questions
          </a>
        </p>
      </div>
    </main>
  );
}
