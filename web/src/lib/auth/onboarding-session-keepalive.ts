"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Proactive refresh interval while onboarding is open (Supabase JWT default ~1h). */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export async function refreshAuthSession(): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn("[auth] session refresh failed:", error.message);
    return false;
  }
  return Boolean(data.session);
}

/**
 * Keeps the Supabase session fresh while the onboarding overlay is open so
 * long parent forms are less likely to hit 401 on Complete.
 */
export function useOnboardingSessionKeepAlive(active: boolean) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let cancelled = false;

    const refreshIfVisible = async () => {
      if (cancelled || document.visibilityState === "hidden") {
        return;
      }
      await refreshAuthSession();
    };

    void refreshIfVisible();

    const intervalId = window.setInterval(() => {
      void refreshIfVisible();
    }, REFRESH_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshIfVisible();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active]);
}
