import type { Metadata } from "next";
import { SupportForm } from "@/components/support/SupportForm";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch about your order, your letter, or a question before you buy.",
  alternates: { canonical: `${SITE_URL}/support` },
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-3 font-serif text-3xl font-bold text-gray-900">Contact us</h1>
      <p className="mb-8 text-gray-600">
        Question about your order, your letter, or something before you buy? Send a message
        below and we will reply to the email you provide.
      </p>
      <SupportForm />
    </main>
  );
}
