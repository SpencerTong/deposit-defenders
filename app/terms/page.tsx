import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Disclaimer",
  robots: { index: false, follow: true },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-gray-900">Terms and Disclaimer</h1>

      <Section title="Not a law firm, not legal advice">
        <p>
          Deposit Defenders is a self-help document preparation tool. It is not a law firm, it
          does not provide legal advice, and using it does not create an attorney-client
          relationship. The information and documents it produces are general legal information
          applied to the answers you provide. For advice about your specific situation, consult
          a licensed Massachusetts attorney.
        </p>
      </Section>

      <Section title="Your documents, your responsibility">
        <p>
          Every analysis, letter, and form this tool generates is prepared from the information
          you enter. The demand letter is your own statement, made in your name, and mailed only
          at your direction. You are responsible for reviewing each document and confirming that
          every fact in it is accurate and truthful before you use or send it.
        </p>
      </Section>

      <Section title="No guaranteed outcome">
        <p>
          Massachusetts law provides remedies that may apply to your situation, and a demand
          letter can encourage a resolution, but no result is guaranteed. Whether any remedy
          applies depends on the specific facts, and only a court can decide a disputed claim.
        </p>
      </Section>

      <Section title="Mailing service">
        <p>
          When you use the certified mailing option, we transmit your final letter to a mailing
          provider that prints and sends it by USPS Certified Mail with return receipt. We pass
          along the tracking information the carrier provides. Delivery itself is performed by
          USPS and is subject to its service terms.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Reply to any email you receive from us and we will sort it out.
        </p>
      </Section>
    </main>
  );
}
