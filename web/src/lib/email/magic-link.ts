import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lu3camp.com";
const REDIRECT_TO = `${APP_URL}/auth/callback`;
const CONFIRM_PATH = `${APP_URL}/auth/confirm`;

export type MagicLinkResult = {
  actionLink: string | null;
  userId: string | null;
};

function buildConfirmLinkFromProperties(
  properties: {
    action_link?: string | null;
    hashed_token?: string | null;
    verification_type?: string | null;
  } | null | undefined,
) {
  const tokenHash = properties?.hashed_token?.trim() || "";
  const verificationType = properties?.verification_type?.trim() || "";
  if (tokenHash && verificationType) {
    const search = new URLSearchParams({
      token_hash: tokenHash,
      type: verificationType,
    });
    return `${CONFIRM_PATH}?${search.toString()}`;
  }
  return properties?.action_link ?? null;
}

/**
 * Generates a magic link for a given email. Creates the auth user silently
 * if they don't exist yet (no Supabase auto-email), then generates a
 * magiclink OTP for sign-in.
 *
 * Returns the action link URL and the auth user ID (if available).
 */
export async function generateMagicLink(
  email: string,
): Promise<MagicLinkResult> {
  const admin = createSupabaseAdminClient() as any;

  // Create the user if they don't exist yet. email_confirm: true skips
  // Supabase's built-in confirmation email entirely — we send our own.
  // Silently swallow "already exists" errors for existing users.
  let createdUserId: string | null = null;
  const { data: createData } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createData?.user?.id) {
    createdUserId = createData.user.id;
  }

  // Generate a magiclink for both new and existing users. This does not
  // send any email — it just returns the link for us to embed in our email.
  const { data: magicData, error: magicError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: REDIRECT_TO },
    });

  if (magicError || !magicData?.properties?.action_link) {
    console.error("[magic-link] generateLink failed:", magicError);
    return {
      actionLink: null,
      userId: createdUserId ?? magicData?.user?.id ?? null,
    };
  }

  const confirmLink = buildConfirmLinkFromProperties(magicData.properties);
  return {
    actionLink: confirmLink,
    userId: createdUserId ?? magicData.user?.id ?? null,
  };
}
