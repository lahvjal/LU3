"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lu3camp.com";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Please enter a valid email address.")}`,
    );
  }

  const supabase = await createSupabaseServerClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/auth/callback`,
  });

  // Always show the same message — don't reveal whether the email exists.
  redirect(
    `/forgot-password?info=${encodeURIComponent(
      "If an account exists with that email, we sent a reset link. Check your inbox.",
    )}`,
  );
}
