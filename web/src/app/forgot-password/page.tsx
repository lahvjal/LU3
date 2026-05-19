import { requestPasswordReset } from "./actions";

type SearchParamValue = string | string[] | undefined;
type SearchParams =
  | Record<string, SearchParamValue>
  | Promise<Record<string, SearchParamValue>>;

const T = {
  bg: "#1a1612",
  bgCard: "#231f1a",
  bgInput: "#2c2720",
  border: "#3a332b",
  text: "#e8e0d4",
  textMuted: "#9a8e7f",
  textDim: "#6b6054",
  accent: "#d4915e",
  red: "#c45a5a",
  redBg: "#351e1e",
  green: "#6b9e6b",
  greenBg: "#2a3528",
  radius: "10px",
  radiusSm: "6px",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Playfair Display', serif",
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: T.radiusSm,
  border: `1px solid ${T.border}`,
  background: T.bgInput,
  color: T.text,
  fontSize: "14px",
  fontFamily: T.font,
  outline: "none",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: T.textMuted,
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolved = searchParams ? await searchParams : {};
  const errorParam = Array.isArray(resolved.error)
    ? resolved.error[0]
    : resolved.error;
  const infoParam = Array.isArray(resolved.info)
    ? resolved.info[0]
    : resolved.info;

  const sent = Boolean(infoParam);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: T.font,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: T.bgCard,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          overflow: "hidden",
          padding: "32px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "22px" }}>⛺</span>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: "22px",
              fontWeight: 700,
              color: T.text,
              margin: 0,
            }}
          >
            Reset Password
          </h1>
        </div>
        <p
          style={{
            fontSize: "14px",
            color: T.textMuted,
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          {sent
            ? "Check your email for the reset link."
            : "Enter your email and we'll send you a link to set a new password."}
        </p>

        {errorParam && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: T.radiusSm,
              background: T.redBg,
              color: T.red,
              fontSize: "13px",
              marginBottom: "16px",
              border: `1px solid ${T.red}33`,
            }}
          >
            {errorParam}
          </div>
        )}

        {infoParam && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: T.radiusSm,
              background: T.greenBg,
              color: T.green,
              fontSize: "13px",
              marginBottom: "16px",
              border: `1px solid ${T.green}33`,
            }}
          >
            {infoParam}
          </div>
        )}

        {!sent && (
          <form action={requestPasswordReset}>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="email" style={labelStyle}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                borderRadius: T.radiusSm,
                border: "none",
                background: T.accent,
                color: "#1a1612",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: T.font,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <a
            href="/login"
            style={{
              fontSize: "13px",
              color: T.textMuted,
              textDecoration: "none",
            }}
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </main>
  );
}
