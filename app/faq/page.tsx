import type { Metadata } from "next";
import { FAQ_ITEMS } from "@/lib/faq/content";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Common Questions",
  description:
    "Answers to common questions about Massachusetts security deposit demand letters, small claims court, filing fees, and deadlines.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className="mb-3 font-serif text-3xl font-bold text-gray-900">Common questions</h1>
      <p className="mb-8 text-gray-600">
        What Massachusetts renters most often ask about demand letters, small claims court, and
        getting a security deposit back. General information for every tenant; for your specific
        situation, consult a licensed Massachusetts attorney.
      </p>
      <FaqAccordion items={FAQ_ITEMS} />
    </main>
  );
}
