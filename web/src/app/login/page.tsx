import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  resendInviteLink,
  signInWithPassword,
  signInWithYouthPasscode,
} from "./actions";

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
  accentLight: "#e6a872",
  red: "#c45a5a",
  redBg: "#351e1e",
  yellow: "#c4a84e",
  yellowBg: "#35301e",
  green: "#6b9e6b",
  greenBg: "#2a3528",
  radius: "10px",
  radiusSm: "6px",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Playfair Display', serif",
};

type YouthLoginOption = {
  id: string;
  label: string;
};

async function getYouthOptionsByParentEmail(
  email: string | null,
): Promise<YouthLoginOption[]> {
  type ParentProfileLookup = { user_id: string };

  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return [];
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: parentProfile } = (await admin
      .from("user_profiles")
      .select("user_id")
      .ilike("user_email", normalized)
      .limit(1)
      .maybeSingle()) as { data: ParentProfileLookup | null };

    if (!parentProfile?.user_id) {
      return [];
    }

    const { data: youngMenRows } = await admin
      .from("young_men")
      .select("id, first_name, last_name, youth_passcode_hash")
      .eq("parent_id", parentProfile.user_id)
      .order("first_name");

    const rows = (youngMenRows ??
      []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      youth_passcode_hash: string | null;
    }>;

    return rows
      .filter((row) => row.id && row.youth_passcode_hash)
      .map((row) => ({
        id: row.id as string,
        label:
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Young man",
      }));
  } catch {
    return [];
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = resolvedSearchParams.error;
  const info = resolvedSearchParams.info;
  const reason = resolvedSearchParams.reason;
  const youthEmailParam = resolvedSearchParams.youth_email;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const infoMessage = Array.isArray(info) ? info[0] : info;
  const reasonVal = Array.isArray(reason) ? reason[0] : reason;
  const youthEmail = Array.isArray(youthEmailParam)
    ? youthEmailParam[0]
    : youthEmailParam;
  const youthOptions = await getYouthOptionsByParentEmail(youthEmail ?? null);
  const magicLinkExpired = reasonVal === "magic_link_expired";

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
          {magicLinkExpired && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: T.radiusSm,
                background: T.yellowBg,
                color: T.yellow,
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: 1.55,
                border: `1px solid ${T.yellow}44`,
              }}
            >
              <strong style={{ display: "block", marginBottom: "6px", color: T.text }}>
                This sign-in link has expired
              </strong>
              Request a fresh link below and use the new email.
            </div>
          )}

          {magicLinkExpired && (
            <form action={resendInviteLink} style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label
                  htmlFor="resend_email"
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
                  Resend Link To Email
                </label>
                <input
                  id="resend_email"
                  name="resend_email"
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
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text,
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: T.font,
                  cursor: "pointer",
                }}
              >
                Send New Sign-In Link
              </button>
            </form>
          )}

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

          <div
            style={{
              margin: "22px 0 14px",
              borderTop: `1px solid ${T.border}`,
              paddingTop: "16px",
            }}
          >
            <p style={{ color: T.textMuted, fontSize: "12px", margin: "0 0 10px" }}>
              Youth sign-in (4-digit passcode)
            </p>

            <form method="GET" style={{ marginBottom: "10px" }}>
              <label
                htmlFor="youth_email"
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
                Parent Email
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="youth_email"
                  name="youth_email"
                  type="email"
                  required
                  defaultValue={youthEmail ?? ""}
                  placeholder="parent@example.org"
                  style={{
                    flex: 1,
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
                <button
                  type="submit"
                  style={{
                    padding: "10px 12px",
                    borderRadius: T.radiusSm,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Find
                </button>
              </div>
            </form>

            {youthOptions.length > 0 ? (
              <form action={signInWithYouthPasscode}>
                <input type="hidden" name="parent_email" value={youthEmail ?? ""} />
                <div style={{ marginBottom: "10px" }}>
                  <label
                    htmlFor="young_man_id"
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
                    Youth Name
                  </label>
                  <select
                    id="young_man_id"
                    name="young_man_id"
                    required
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
                  >
                    <option value="">Select youth</option>
                    {youthOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label
                    htmlFor="youth_passcode"
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
                    4-Digit Passcode
                  </label>
                  <input
                    id="youth_passcode"
                    name="youth_passcode"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    placeholder="••••"
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
                    padding: "10px 14px",
                    borderRadius: T.radiusSm,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.text,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sign In as Youth
                </button>
              </form>
            ) : youthEmail ? (
              <p style={{ color: T.textDim, fontSize: "12px", margin: 0 }}>
                No youth profiles with passcodes found for that email.
              </p>
            ) : (
              <p style={{ color: T.textDim, fontSize: "12px", margin: 0 }}>
                Enter parent email, then choose youth and passcode.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
