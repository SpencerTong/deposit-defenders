import type { FaqItem } from "@/lib/faq/content";

/**
 * Tap-to-expand FAQ built on native <details>: modern accordion behavior with
 * no client JavaScript, so it costs nothing on mobile.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-xl font-semibold text-accent transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.answer}</p>
          {item.linkHref && (
            <a
              href={item.linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-accent underline"
            >
              {item.linkLabel ?? item.linkHref}
            </a>
          )}
        </details>
      ))}
    </div>
  );
}
