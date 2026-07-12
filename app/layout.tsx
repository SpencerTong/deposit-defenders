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
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-600">
          This tool provides general legal information, not legal advice, and does not create an
          attorney-client relationship. For advice about your situation, consult a licensed
          Massachusetts attorney.{" "}
          <a href="/terms" className="underline">
            Terms and disclaimer
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
