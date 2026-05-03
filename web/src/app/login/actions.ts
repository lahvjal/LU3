"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyYouthPasscode } from "@/lib/auth/youth-passcode";
import {
  createYouthSessionToken,
  YOUTH_SESSION_COOKIE,
  YOUTH_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/youth-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lu3camp.com";
const REDIRECT_TO = `${APP_URL}/auth/callback`;

function buildErrorRedirect(message: string) {
  return `/login?error=${encodeURIComponent(message)}`;
}

function buildInfoRedirect(message: string) {
  return `/login?info=${encodeURIComponent(message)}`;
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(buildErrorRedirect("Email and password are required."));
  }

  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(buildErrorRedirect(error.message));
  }
  cookieStore.delete(YOUTH_SESSION_COOKIE);

  redirect("/");
}

export async function signUpParentAccount(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("signup_email") ?? "").trim();
  const password = String(formData.get("signup_password") ?? "");

  if (!fullName || !email || !password) {
    redirect(buildErrorRedirect("Full name, email, and password are required."));
  }

  if (password.length < 8) {
    redirect(buildErrorRedirect("Password must be at least 8 characters."));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(buildErrorRedirect(error.message));
  }

  // If email confirmation is required, session will be null.
  if (!data.session) {
    redirect(
      buildInfoRedirect(
        "Account created. Check your email to confirm, then sign in.",
      ),
    );
  }

  redirect("/register?claimed=1");
}

export async function resendInviteLink(formData: FormData) {
  const email = String(formData.get("resend_email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirect(buildErrorRedirect("Enter a valid email to receive a new sign-in link."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: REDIRECT_TO,
      shouldCreateUser: false,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("rate limit")) {
      redirect(buildErrorRedirect("Too many attempts. Please wait a minute and try again."));
    }
    redirect(
      buildInfoRedirect(
        "If that email is on an invited account, we sent a fresh sign-in link.",
      ),
    );
  }

  redirect(
    buildInfoRedirect(
      "If that email is on an invited account, we sent a fresh sign-in link.",
    ),
  );
}

export async function signInWithYouthPasscode(formData: FormData) {
  const parentEmail = String(formData.get("parent_email") ?? "")
    .trim()
    .toLowerCase();
  const youngManId = String(formData.get("young_man_id") ?? "").trim();
  const passcode = String(formData.get("youth_passcode") ?? "").trim();

  if (!parentEmail || !parentEmail.includes("@")) {
    redirect(buildErrorRedirect("Enter a valid parent email."));
  }
  if (!youngManId) {
    redirect(buildErrorRedirect("Select a youth profile."));
  }
  if (!/^\d{4}$/.test(passcode)) {
    redirect(buildErrorRedirect("Youth passcode must be 4 digits."));
  }

  const admin = createSupabaseAdminClient();
  const { data: parentProfile } = await admin
    .from("user_profiles")
    .select("user_id")
    .ilike("user_email", parentEmail)
    .limit(1)
    .maybeSingle();

  if (!parentProfile?.user_id) {
    redirect(buildErrorRedirect("Invalid youth login details."));
  }

  const { data: youngMan } = await admin
    .from("young_men")
    .select("id, parent_id, youth_passcode_hash")
    .eq("id", youngManId)
    .eq("parent_id", parentProfile.user_id)
    .maybeSingle();

  if (!youngMan?.id) {
    redirect(buildErrorRedirect("Invalid youth login details."));
  }

  if (!verifyYouthPasscode(passcode, youngMan.youth_passcode_hash)) {
    redirect(buildErrorRedirect("Invalid youth login details."));
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: parentEmail,
    options: { redirectTo: REDIRECT_TO },
  });

  if (linkError || !linkData?.properties?.action_link) {
    redirect(
      buildErrorRedirect(
        "Unable to start youth session right now. Please try again.",
      ),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    YOUTH_SESSION_COOKIE,
    createYouthSessionToken({
      userId: parentProfile.user_id,
      youngManId: youngMan.id,
    }),
    YOUTH_SESSION_COOKIE_OPTIONS,
  );

  redirect(linkData.properties.action_link);
}
