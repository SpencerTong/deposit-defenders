import type { Metadata } from "next";
import { BuyKitButton } from "@/components/kit/BuyKitButton";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Dispute Kit | ${SITE_NAME}`,
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

function ReceiptLine({
  label,
  detail,
  amount,
}: {
  label: string;
  detail: string;
  amount: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 line-through">{detail}</p>
      </div>
      <p className="whitespace-nowrap pt-0.5 text-xs text-gray-500">{amount}</p>
    </div>
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
        <h2 className="mb-1 text-lg font-semibold text-gray-900">What&apos;s actually in the $49</h2>
        <p className="mb-4 text-sm text-gray-600">
          Priced separately, here is what each piece is worth on its own.
        </p>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ReceiptLine
            label="Chapter 93A-strengthened demand letter"
            detail="the version a landlord-tenant attorney sends"
            amount="$150+ to start"
          />
          <ReceiptLine
            label="Certified mail, return receipt"
            detail="USPS counter price"
            amount="~$10"
          />
          <ReceiptLine
            label="Small claims form, pre-filled"
            detail="figuring out Massachusetts court paperwork yourself"
            amount="an evening, maybe more"
          />
          <div className="mt-1 flex items-baseline justify-between border-t-2 border-accent pt-3">
            <p className="text-sm font-semibold text-accent">Your price today</p>
            <p className="text-xl font-bold text-accent">$49</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          $150+ is commonly just the cost of an initial consult, if a landlord-tenant attorney
          does not already offer a free one. Having them draft and send a letter for you is
          typically billed separately on top of that, often by the hour.
        </p>
      </section>

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
