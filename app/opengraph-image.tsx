import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
            fontSize: 28,
            textTransform: "uppercase",
            letterSpacing: 6,
            opacity: 0.7,
            marginBottom: 28,
          }}
        >
          Deposit Defenders
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.2 }}>
          Know what your Massachusetts landlord owes you
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85, marginTop: 32 }}>
          Free deposit analysis + demand letter
        </div>
      </div>
    ),
    { ...size }
  );
}
