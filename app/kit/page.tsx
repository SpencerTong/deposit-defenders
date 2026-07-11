import type { Metadata } from "next";
import { BuyKitButton } from "@/components/kit/BuyKitButton";

export const metadata: Metadata = {
  title: "Dispute Kit | Deposit Defenders",
  description:
    "Everything you need to back up your Massachusetts security deposit demand letter and take it to small claims court if your landlord doesn't pay.",
};

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
      <span className="mt-0.5 text-accent">✓</span>
      <span>{children}</span>
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
          check found, send it to your landlord by certified mail for you, and give you the
          complete plan for small claims court if they still do not pay.
        </p>
        <BuyKitButton className="w-full rounded-lg bg-white px-6 py-4 text-lg font-semibold text-accent shadow-sm transition-colors hover:bg-gray-100 sm:w-auto sm:px-10" />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Evidence packet checklist</h2>
        <p className="mb-4 text-sm text-gray-600">
          A landlord who doesn&apos;t return a deposit properly can be hard to win against without
          organized evidence. The kit includes a checklist for gathering:
        </p>
        <ul className="space-y-2">
          <ChecklistItem>Move-in and move-out photos or video, dated if possible</ChecklistItem>
          <ChecklistItem>A copy of your lease and any statement of condition</ChecklistItem>
          <ChecklistItem>
            All written communication with your landlord about the deposit (texts, emails, letters)
          </ChecklistItem>
          <ChecklistItem>Receipts or records related to anything you&apos;re being blamed for</ChecklistItem>
          <ChecklistItem>Your demand letter and proof that it was sent and received</ChecklistItem>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">We send it certified mail, for you</h2>
        <p className="mb-4 text-sm text-gray-600">
          A demand letter carries the most weight when it arrives by certified mail: it creates
          dated proof your landlord received it, which is exactly the evidence a court wants to
          see. You skip the post office entirely. We handle the mailing and you keep the paper
          trail:
        </p>
        <ul className="space-y-2">
          <ChecklistItem>Your letter is sent to your landlord by USPS Certified Mail with tracking</ChecklistItem>
          <ChecklistItem>You get a dated copy of exactly what was sent, for your records</ChecklistItem>
          <ChecklistItem>You get the tracking number and delivery confirmation as proof of receipt</ChecklistItem>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Deadline tracker sheet</h2>
        <p className="text-sm text-gray-600">
          A simple sheet to track the dates that matter most: when you sent your demand letter,
          your landlord&apos;s 10-business-day response window, and the key statutory deadlines from
          your analysis, so nothing slips while you decide on next steps.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Massachusetts small claims filing walkthrough
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          If your landlord doesn&apos;t pay after your demand letter, small claims court is designed
          for cases like this, and no lawyer is required. The kit walks you through:
        </p>
        <ol className="space-y-3">
          <Step number={1} title="Confirm your claim fits small claims court">
            Massachusetts small claims court generally handles claims of $7,000 or less. Most
            security deposit disputes fall well within this limit.
          </Step>
          <Step number={2} title="Pick where to file">
            You can generally file in the District Court, Boston Municipal Court, or Housing Court
            location where you live or work, where your landlord lives or does business, or where
            the rental property is located.
          </Step>
          <Step number={3} title="Complete the Statement of Small Claim">
            Massachusetts courts use a &quot;Statement of Small Claim and Notice&quot; form, available
            by mail or through the court&apos;s online small-claims filing tool. The kit includes a
            filled-out example based on your answers.
          </Step>
          <Step number={4} title="Pay the filing fee">
            Filing fees are tiered by claim amount (roughly $40 to $150 as of this writing) and are set
            by the court, so double-check the current amount when you file.
          </Step>
          <Step number={5} title="Prepare for the hearing">
            Bring your evidence packet, your demand letter and proof of mailing, and a clear,
            written summary of what you&apos;re owed and why.
          </Step>
        </ol>
      </section>

      <div className="mb-10 text-center">
        <BuyKitButton />
      </div>

      <p className="text-sm text-gray-500">
        This tool provides general legal information, not legal advice, and does not create an
        attorney-client relationship. Court rules, fees, and dollar limits can change. For advice
        about your situation, consult a licensed Massachusetts attorney.
      </p>
    </main>
  );
}
