import type { Metadata } from "next";
import { KitSuccessClient } from "@/components/kit/KitSuccessClient";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default function KitSuccessPage() {
  return <KitSuccessClient />;
}
