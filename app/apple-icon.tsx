import { ImageResponse } from "next/og";

/** Home-screen icon (iOS): the MYNIX wordmark on black. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#ffffff",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "0.22em",
          paddingLeft: "0.22em",
        }}
      >
        MYNIX
      </div>
    ),
    size,
  );
}
