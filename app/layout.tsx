import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const DEFAULT_DESCRIPTION =
  "Answer a few questions about your Massachusetts security deposit and find out what the law says you may be owed.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Deposit Defenders: Massachusetts Security Deposit Help",
    template: "%s | Deposit Defenders",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    siteName: "Deposit Defenders",
    description: DEFAULT_DESCRIPTION,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#fafaf8] font-sans text-gray-900">
        {/* Deliberately minimal: a wordmark plus one link. A site asking $49 for a
            legal document needs visible identity, but the landing page's only job
            is starting the question flow, so this must not become an exit menu. */}
        <header className="border-b border-gray-200 bg-white/60">
          <nav className="mx-auto flex max-w-xl items-center justify-between px-6 py-3">
            <a href="/" className="font-serif text-lg font-bold text-gray-900">
              Deposit Defenders
            </a>
            <a href="/guide" className="text-sm font-medium text-accent hover:underline">
              Guides
            </a>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-600">
          This tool provides general legal information, not legal advice, and does not create an
          attorney-client relationship. For advice about your situation, consult a licensed
          Massachusetts attorney.{" "}
          {/* First in the list on purpose: reporters and attorneys who land on
              the homepage need a way to audit the numbers without first
              entering a stranger's data into the question flow. */}
          <a href="/guide/how-we-calculate-your-claim" className="underline">
            How we calculate claims
          </a>
          {" · "}
          <a href="/faq" className="underline">
            Common questions
          </a>
          {" · "}
          <a href="/terms" className="underline">
            Terms and disclaimer
          </a>
          {" · "}
          <a href="/support" className="underline">
            Contact us
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
