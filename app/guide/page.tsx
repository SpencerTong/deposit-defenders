import type { Metadata } from "next";
import Link from "next/link";
import { guideArticles } from "@/lib/guide/articles";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Massachusetts Security Deposit Guides — Deposit Defenders",
  description:
    "Plain-English guides to Massachusetts security deposit law: deadlines, deductions, interest, demand letters, and small claims court under M.G.L. c. 186 §15B.",
  alternates: { canonical: `${SITE_URL}/guide` },
};

export default function GuideIndexPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">Guides</p>
      <h1 className="mb-4 font-serif text-3xl font-bold leading-tight text-gray-900">
        Massachusetts security deposit guides
      </h1>
      <p className="mb-8 text-lg text-gray-600">
        What M.G.L. c. 186, §15B actually requires of your landlord — and what to do when those
        requirements aren&apos;t met.
      </p>

      <ul className="space-y-4">
        {guideArticles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/guide/${article.slug}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-accent"
            >
              <h2 className="mb-1 font-semibold text-gray-900">{article.title}</h2>
              <p className="text-sm text-gray-600">{article.metaDescription}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-4 mt-10 rounded-2xl bg-accent px-6 py-8 text-center text-white shadow-lg">
        <h2 className="mb-2 font-serif text-2xl font-bold">Check your own situation for free</h2>
        <p className="mb-5 text-white/90">
          Answer a few questions about your deposit and we&apos;ll tell you what the law says you
          may be owed.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-100"
        >
          Check my deposit — it&apos;s free
        </Link>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        This tool provides general legal information, not legal advice, and does not create an
        attorney-client relationship. For advice about your situation, consult a licensed
        Massachusetts attorney.
      </p>
    </main>
  );
}
