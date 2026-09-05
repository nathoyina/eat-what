import { ImageResponse } from "next/og";

export const alt = "Eat What — random restaurant picker for Singapore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#15803d",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Singapore · makan picker
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 0.95,
              color: "#1c1917",
              letterSpacing: -3,
            }}
          >
            Eat What?
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 36,
              color: "#57534e",
              lineHeight: 1.3,
              maxWidth: 900,
            }}
          >
            Spin a wheel of real nearby restaurants, cafes and hawkers.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            color: "#16a34a",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          No signup · Live Google Maps places
        </div>
      </div>
    ),
    { ...size },
  );
}
