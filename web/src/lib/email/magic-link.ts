import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lu3camp.com";
const REDIRECT_TO = `${APP_URL}/auth/callback`;

/**
 * Generates a magic link for a given email. Creates the auth user if they
 * don't already exist (type: 'invite'), or generates a login link if they
 * do (type: 'magiclink').
 *
 * Returns the action link URL, or null on failure.
 */
export async function generateMagicLink(
  email: string,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: REDIRECT_TO },
  });

  if (error) {
    if (
      error.message?.includes("already been registered") ||
      error.message?.includes("already exists")
    ) {
      const { data: magicData, error: magicError } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: REDIRECT_TO },
        });

      if (magicError || !magicData?.properties?.action_link) {
        console.error("[magic-link] magiclink fallback failed:", magicError);
        return null;
      }

      return magicData.properties.action_link;
    }

    console.error("[magic-link] invite link failed:", error);
    return null;
  }

  if (!data?.properties?.action_link) {
    console.error("[magic-link] No action_link in response");
    return null;
  }

  return data.properties.action_link;
}
