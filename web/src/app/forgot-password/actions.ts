"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateRecoveryLink } from "@/lib/email/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Please enter a valid email address.")}`,
    );
  }

  const admin = createSupabaseAdminClient() as any;

  // Look up the user so we can personalise the email and avoid generating
  // a link for an address that doesn't exist in our system.
  const { data: profile } = await admin
    .from("user_profiles")
    .select("user_id, display_name")
    .ilike("user_email", email)
    .maybeSingle();

  if (profile?.user_id) {
    const link = await generateRecoveryLink(email);
    if (link) {
      const name =
        profile.display_name?.trim() || email.split("@")[0] || "Friend";
      const template = passwordResetEmail(name, link);
      await sendEmail({ to: email, subject: template.subject, html: template.html });
    }
  }

  // Always show the same neutral message — don't reveal whether the email exists.
  redirect(
    `/forgot-password?info=${encodeURIComponent(
      "If an account exists with that email, we sent a reset link. Check your inbox.",
    )}`,
  );
}
