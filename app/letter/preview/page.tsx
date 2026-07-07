import type { Metadata } from "next";
import { LetterPreviewClient } from "@/components/letter/LetterPreviewClient";

export const metadata: Metadata = {
  title: "Your deposit analysis",
  robots: { index: false, follow: false },
};

export default function LetterPreviewPage() {
  return <LetterPreviewClient />;
}
