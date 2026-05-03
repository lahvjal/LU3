"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LOGIN_EXPIRED = "/login?reason=magic_link_expired";

const T = {
  bg: "#1a1612",
  bgCard: "#231f1a",
  bgInput: "#2c2720",
  border: "#3a332b",
  text: "#e8e0d4",
  textMuted: "#9a8e7f",
  accent: "#d4915e",
  red: "#c45a5a",
  redBg: "#351e1e",
  radius: "10px",
  radiusSm: "6px",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Playfair Display', serif",
};

function isAllowedOtpType(value: string): value is EmailOtpType {
  return (
    value === "signup" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "invite" ||
    value === "email" ||
    value === "email_change"
  );
}

function looksExpired(message: string | undefined) {
  const msg = (message || "").toLowerCase();
  return msg.includes("expired") || msg.includes("otp_expired");
}

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    const tokenHash = searchParams.get("token_hash")?.trim() || "";
    const rawType = searchParams.get("type")?.trim() || "";
    if (!tokenHash || !isAllowedOtpType(rawType)) {
      return null;
    }
    return { tokenHash, type: rawType };
  }, [searchParams]);

  const continueSignIn = async () => {
    if (!payload || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: payload.type,
        token_hash: payload.tokenHash,
      });
      if (verifyError) {
        if (looksExpired(verifyError.message)) {
          router.replace(LOGIN_EXPIRED);
          return;
        }
        setError(verifyError.message || "Unable to verify sign-in link.");
        return;
      }
      router.replace("/");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
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
            Confirm Sign-In
          </h1>
        </div>
        <p style={{ fontSize: "14px", color: T.textMuted, margin: "0 0 18px", lineHeight: 1.5 }}>
          Click below to complete sign-in. This extra step helps prevent email scanners from consuming your link.
        </p>

        {!payload ? (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: T.radiusSm,
              background: T.redBg,
              color: T.red,
              fontSize: "13px",
              border: `1px solid ${T.red}33`,
            }}
          >
            This sign-in link is invalid. Request a new link from login.
          </div>
        ) : (
          <button
            type="button"
            onClick={continueSignIn}
            disabled={submitting}
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
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              letterSpacing: "0.02em",
            }}
          >
            {submitting ? "Verifying..." : "Continue to Camp"}
          </button>
        )}

        {error ? (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: T.radiusSm,
              background: T.redBg,
              color: T.red,
              fontSize: "13px",
              border: `1px solid ${T.red}33`,
            }}
          >
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: T.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: T.font,
            color: T.textMuted,
          }}
        >
          Loading sign-in confirmation...
        </main>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
