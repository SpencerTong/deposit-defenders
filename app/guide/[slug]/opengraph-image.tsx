import { ImageResponse } from "next/og";
import { getGuideArticle } from "@/lib/guide/articles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image({ params }: { params: { slug: string } }) {
  const article = getGuideArticle(params.slug);
  const title = article?.title ?? "Deposit Defenders";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: 96,
          backgroundColor: "#1E4D3A",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 26,
            textTransform: "uppercase",
            letterSpacing: 6,
            opacity: 0.7,
            marginBottom: 28,
          }}
        >
          Deposit Defenders | MA Renter&apos;s Guide
        </div>
        <div style={{ display: "flex", fontSize: 54, fontWeight: 700, lineHeight: 1.25 }}>
          {title}
        </div>
      </div>
    ),
    { ...size }
  );
}
