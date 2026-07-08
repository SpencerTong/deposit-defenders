import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { guideArticles, getGuideArticle } from "@/lib/guide/articles";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return guideArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = getGuideArticle(params.slug);
  if (!article) return {};

  const url = `${SITE_URL}/guide/${article.slug}`;

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
    },
  };
}

export default function GuideArticlePage({ params }: { params: { slug: string } }) {
  const article = getGuideArticle(params.slug);
  if (!article) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    dateModified: article.updated,
    mainEntityOfPage: `${SITE_URL}/guide/${article.slug}`,
    author: { "@type": "Organization", name: "Deposit Defenders" },
  };

  const faqLd = article.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  const relatedArticles = (article.related ?? [])
    .map((slug) => getGuideArticle(slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <Link href="/guide" className="mb-2 inline-block text-sm text-accent underline">
        ← All guides
      </Link>
      <p className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">Guide</p>
      <h1 className="mb-4 font-serif text-3xl font-bold leading-tight text-gray-900">
        {article.title}
      </h1>
      <p className="mb-8 text-lg text-gray-600">{article.intro}</p>

      {article.sections.map((section, i) => (
        <section key={i} className="mb-8">
          {section.heading && (
            <h2 className="mb-3 text-xl font-semibold text-gray-900">{section.heading}</h2>
          )}
          {section.paragraphs.map((paragraph, j) => (
            <p key={j} className="mb-3 leading-relaxed text-gray-700">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="ml-5 list-disc space-y-2 text-gray-700">
              {section.list.map((item, k) => (
                <li key={k}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {article.faq && article.faq.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Frequently asked questions</h2>
          {article.faq.map((item, i) => (
            <details key={i} className="mb-2 rounded-lg border border-gray-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-gray-900">
                {item.question}
              </summary>
              <p className="mt-2 text-gray-700">{item.answer}</p>
            </details>
          ))}
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Keep reading</h2>
          <ul className="space-y-2">
            {relatedArticles.map((related) => (
              <li key={related.slug}>
                <Link href={`/guide/${related.slug}`} className="text-accent underline">
                  {related.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-8 rounded-2xl bg-accent px-6 py-8 text-center text-white shadow-lg">
        <h2 className="mb-2 font-serif text-2xl font-bold">{article.ctaHeading}</h2>
        <p className="mb-5 text-white/90">{article.ctaBody}</p>
        <Link
          href={article.ctaHref}
          className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-accent transition-colors hover:bg-gray-100"
        >
          {article.ctaLabel}
        </Link>
      </div>

      <p className="text-sm text-gray-500">
        This tool provides general legal information, not legal advice, and does not create an
        attorney-client relationship. For advice about your situation, consult a licensed
        Massachusetts attorney.
      </p>
    </main>
  );
}
