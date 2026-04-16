"use client";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1612",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#231f1a",
          border: "1px solid #3a332b",
          borderRadius: "10px",
          padding: "32px",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#e8e0d4",
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "12px",
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            color: "#9a8e7f",
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "20px",
          }}
        >
          An unexpected error occurred. Please try again or reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 24px",
            borderRadius: "6px",
            border: "none",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            background: "#d4915e",
            color: "#1a1612",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
