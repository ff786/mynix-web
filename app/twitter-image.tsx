import { ImageResponse } from "next/og";

/** Social preview (WhatsApp, Facebook, X, LinkedIn…) for every page. */
export const alt = "MYNIX — Professional Gemology Tools & Equipment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(circle at 75% 30%, #1c2e4a 0%, #050505 60%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: "0.45em" }}>MYNIX</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.3em", color: "#9fb0cf", marginBottom: 24 }}>
            GEMOLOGICAL TOOLS &amp; EQUIPMENT
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>
            UNLEASH YOUR PASSION
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            WITH PRECISION.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.6)" }}>
          Gem torches · Loupes · Refractometers · Scales · Lapidary — mynix.lk
        </div>
      </div>
    ),
    size,
  );
}
