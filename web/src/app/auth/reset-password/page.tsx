"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace(
          "/login?error=" +
            encodeURIComponent(
              "Session expired. Please request a new password reset link.",
            ),
        );
        return;
      }
      setReady(true);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/"), 1800);
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "420px",
    background: T.bgCard,
    borderRadius: T.radius,
    border: `1px solid ${T.border}`,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    padding: "32px 28px",
  };

  const mainStyle = {
    minHeight: "100vh",
    background: T.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: T.font,
  };

  if (!ready) {
    return (
      <main style={mainStyle}>
        <p style={{ color: T.textMuted, fontSize: "14px" }}>Loading…</p>
      </main>
    );
  }

  if (done) {
    return (
      <main style={mainStyle}>
        <div style={cardStyle}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: T.radiusSm,
              background: T.greenBg,
              color: T.green,
              fontSize: "14px",
              border: `1px solid ${T.green}33`,
              textAlign: "center",
            }}
          >
            Password updated! Signing you in…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
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
            Set New Password
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
          Choose a new password for your account.
        </p>

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="password" style={labelStyle}>
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="confirm_password" style={labelStyle}>
              Confirm Password
            </label>
            <input
              id="confirm_password"
              type="password"
              required
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
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
              cursor: saving ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Set Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
