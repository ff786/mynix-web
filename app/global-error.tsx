"use client";

/** Last-resort error page (the whole layout failed), so it brings its own html/body. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#050505", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ letterSpacing: "0.4em", fontWeight: 600 }}>MYNIX</p>
          <h1 style={{ fontSize: 32, margin: "24px 0 12px" }}>Something went wrong.</h1>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "12px 24px", borderRadius: 999, border: 0, background: "#fff", color: "#1d1d1f", fontSize: 14, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
