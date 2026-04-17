"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LOGIN_EXPIRED = "/login?reason=magic_link_expired";

function readAuthRedirectParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : new URLSearchParams();
  const get = (key: string) => search.get(key) ?? hash.get(key);
  return {
    error: get("error"),
    error_code: get("error_code"),
    error_description: get("error_description"),
    code: search.get("code"),
    access_token: hash.get("access_token"),
    refresh_token: hash.get("refresh_token"),
  };
}

function safeDecodeParam(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

function isExpiredMagicLinkError(p: {
  error_code: string | null;
  error_description: string | null;
}): boolean {
  const code = (p.error_code || "").toLowerCase();
  if (code === "otp_expired" || code === "flow_state_expired") return true;
  const desc = safeDecodeParam(p.error_description || "");
  const d = desc.toLowerCase();
  if (d.includes("expired") && (d.includes("link") || d.includes("otp") || d.includes("email"))) {
    return true;
  }
  if (d.includes("expired") && d.includes("invalid")) return true;
  return false;
}

function isExpiredExchangeError(message: string | undefined): boolean {
  const m = (message || "").toLowerCase();
  return (
    m.includes("expired") ||
    m.includes("otp_expired") ||
    (m.includes("invalid") && (m.includes("code") || m.includes("token") || m.includes("link")))
  );
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.replace("/");
      }
    });

    const p = readAuthRedirectParams();

    if (p.error || p.error_code) {
      if (
        isExpiredMagicLinkError({
          error_code: p.error_code,
          error_description: p.error_description,
        })
      ) {
        router.replace(LOGIN_EXPIRED);
        return;
      }
      const desc = p.error_description
        ? safeDecodeParam(p.error_description)
        : p.error || "Sign-in could not be completed.";
      router.replace(`/login?error=${encodeURIComponent(desc)}`);
      return;
    }

    if (p.access_token && p.refresh_token) {
      void supabase.auth.setSession({
        access_token: p.access_token,
        refresh_token: p.refresh_token,
      });
      return;
    }

    if (p.code) {
      void supabase.auth.exchangeCodeForSession(p.code).then(({ error }) => {
        if (error) {
          if (isExpiredExchangeError(error.message)) {
            router.replace(LOGIN_EXPIRED);
            return;
          }
          router.replace(
            `/login?error=${encodeURIComponent(error.message)}`,
          );
          return;
        }
        router.replace("/");
      });
      return;
    }

    router.replace("/login");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1612",
        color: "#9a8e7f",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <p>Signing you in...</p>
    </div>
  );
}
