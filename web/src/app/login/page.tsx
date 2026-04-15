import { signInWithPassword } from "./actions";

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
  accent: "#d4915e",
  accentLight: "#e6a872",
  red: "#c45a5a",
  redBg: "#351e1e",
  green: "#6b9e6b",
  greenBg: "#2a3528",
  radius: "10px",
  radiusSm: "6px",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Playfair Display', serif",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = resolvedSearchParams.error;
  const info = resolvedSearchParams.info;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const infoMessage = Array.isArray(info) ? info[0] : info;

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
        }}
      >
        <div style={{ padding: "32px 28px 0" }}>
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
              Young Men Camp
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
            Sign in to access your camp information.
          </p>
        </div>

        <div style={{ padding: "0 28px 32px" }}>
          {infoMessage && (
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
              {infoMessage}
            </div>
          )}

          {errorMessage && (
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
              {errorMessage}
            </div>
          )}

          <form action={signInWithPassword}>
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.textMuted,
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="leader@example.org"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.border}`,
                  background: T.bgInput,
                  color: T.text,
                  fontSize: "14px",
                  fontFamily: T.font,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.textMuted,
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.border}`,
                  background: T.bgInput,
                  color: T.text,
                  fontSize: "14px",
                  fontFamily: T.font,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
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
              Sign In
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
