"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(buildErrorRedirect(error.message));
  }

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
