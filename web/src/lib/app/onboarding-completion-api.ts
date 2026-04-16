import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LeadershipRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee"
  | "young_men_captain";

const LEADERSHIP_ROLES = new Set<LeadershipRole>([
  "stake_leader",
  "stake_camp_director",
  "ward_leader",
  "camp_committee",
  "young_men_captain",
]);

const WARD_SCOPED_LEADERSHIP_ROLES = new Set<LeadershipRole>([
  "ward_leader",
  "young_men_captain",
]);

function isLeadershipRole(value: string): value is LeadershipRole {
  return LEADERSHIP_ROLES.has(value as LeadershipRole);
}

async function ensureLeadershipUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: LeadershipRole,
  wardId: string | null,
) {
  let existingRoleQuery = supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role);

  existingRoleQuery = wardId
    ? existingRoleQuery.eq("ward_id", wardId)
    : existingRoleQuery.is("ward_id", null);

  const { data: existingRole } = await existingRoleQuery.limit(1).maybeSingle();
  if (existingRole?.id) {
    return;
  }

  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role,
    ward_id: wardId,
    participant_id: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeAvatarUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

export type OnboardingProfileBody = {
  displayName: string;
  avatarUrl: string;
  phone: string | null;
  wardId: string | null;
  signatureName?: string;
};

export type YoungManPayload = {
  firstName: string;
  lastName: string;
  age: string;
  shirtSizeCode: string;
  allergies: string;
  medicalNotes: string;
};

/**
 * Shared by Route Handlers (onboarding) and updateMyProfileAction.
 * Does not import camp-design-data — safe for minimal API bundles.
 */
export async function completeOnboardingProfileInDb(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  input: OnboardingProfileBody,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const displayName = input.displayName.trim();
  if (!displayName) {
    return { ok: false, error: "Display name is required." };
  }

  const avatarRaw = input.avatarUrl ?? "";
  const avatarUrl = normalizeAvatarUrl(avatarRaw);
  if (avatarRaw.trim() && !avatarUrl) {
    return { ok: false, error: "Avatar URL must start with http:// or https://." };
  }

  const phone = (input.phone ?? "").trim() || null;
  let wardId =
    typeof input.wardId === "string" ? (input.wardId.trim() || null) : null;

  if (wardId) {
    const { data: wardRow } = await supabase
      .from("wards")
      .select("id")
      .eq("id", wardId)
      .maybeSingle();
    if (!wardRow) {
      return { ok: false, error: "Selected ward could not be found." };
    }
  }

  const onboardingCompletedAt = new Date().toISOString();

  const profilePayload: Record<string, string | number | null> = {
    user_id: userId,
    user_email: userEmail?.toLowerCase() ?? null,
    display_name: displayName,
    avatar_url: avatarUrl,
    phone,
    ward_id: wardId,
    onboarding_completed_at: onboardingCompletedAt,
  };

  if (input.signatureName !== undefined) {
    profilePayload.terms_accepted_at = input.signatureName?.trim()
      ? onboardingCompletedAt
      : null;
    profilePayload.signature_name = input.signatureName?.trim() || null;
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("role, ward_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileRow?.role && isLeadershipRole(profileRow.role)) {
    try {
      const roleWardId = WARD_SCOPED_LEADERSHIP_ROLES.has(profileRow.role)
        ? (profileRow.ward_id ?? null)
        : null;
      await ensureLeadershipUserRole(supabase, userId, profileRow.role, roleWardId);
    } catch (err) {
      console.error("[onboarding] failed to sync user_role:", err);
    }
  }

  return { ok: true };
}

export async function insertParentYoungMenInDb(
  supabase: SupabaseClient,
  userId: string,
  youngMen: YoungManPayload[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.role !== "parent") {
    return { ok: false, error: "Only parent accounts can register young men here." };
  }
  if (!profile.onboarding_completed_at) {
    return { ok: false, error: "Finish profile setup first, then try again." };
  }

  const rows = youngMen.filter(
    (ym) => ym.firstName?.trim() && ym.lastName?.trim(),
  );
  if (rows.length === 0) {
    return { ok: true };
  }

  const admin = createSupabaseAdminClient() as any;

  const { data: parentRow, error: parentLookupError } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (parentLookupError) {
    return {
      ok: false,
      error: `Could not verify your profile: ${parentLookupError.message}`,
    };
  }
  if (!parentRow?.user_id) {
    return {
      ok: false,
      error:
        "Your account profile is missing in the database. Try signing out and back in, or contact support.",
    };
  }

  const { data: sizeRows, error: sizeErr } = await admin
    .from("shirt_sizes")
    .select("code");
  if (sizeErr) {
    return {
      ok: false,
      error: `Could not validate shirt sizes: ${sizeErr.message}`,
    };
  }
  const validShirtCodes = new Set(
    (sizeRows ?? []).map((r: { code: string }) => r.code),
  );

  for (const ym of rows) {
    const code = ym.shirtSizeCode?.trim() ?? "";
    if (code && !validShirtCodes.has(code)) {
      return {
        ok: false,
        error: `Invalid shirt size "${code}" for ${ym.firstName.trim()} ${ym.lastName.trim()}. Please pick a size from the list.`,
      };
    }
  }

  const youngMenPayload = rows.map((ym) => {
    const raw = Number(ym.age);
    const age =
      Number.isFinite(raw) && raw > 0
        ? Math.min(18, Math.max(8, Math.round(raw)))
        : 12;
    const shirt = ym.shirtSizeCode?.trim() || null;
    return {
      parent_id: userId,
      first_name: ym.firstName.trim(),
      last_name: ym.lastName.trim(),
      age,
      shirt_size_code: shirt,
      allergies: ym.allergies?.trim() || null,
      medical_notes: ym.medicalNotes?.trim() || null,
    };
  });

  const { error: ymError } = await admin.from("young_men").insert(youngMenPayload);
  if (ymError) {
    return { ok: false, error: `Could not save young men: ${ymError.message}` };
  }

  return { ok: true };
}
