import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/user-context";
import {
  ageOnCampReference,
  CAMP_AGE_REFERENCE_YMD,
  parseYmd,
} from "@/lib/camp-age";

type CampStaffRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee";

const CAMP_STAFF_ROLES = new Set<CampStaffRole>([
  "stake_leader",
  "stake_camp_director",
  "ward_leader",
  "camp_committee",
]);

function isCampStaffRole(value: string): value is CampStaffRole {
  return CAMP_STAFF_ROLES.has(value as CampStaffRole);
}

function userRolesWardIdForRole(
  role: AppRole,
  wardIdFromProfile: string | null,
): string | null {
  if (role === "ward_leader" || role === "young_men_captain") {
    return wardIdFromProfile;
  }
  return null;
}

async function ensureUserRoleRow(
  supabase: SupabaseClient,
  userId: string,
  role: AppRole,
  wardIdForRow: string | null,
) {
  let existingRoleQuery = supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role);

  existingRoleQuery = wardIdForRow
    ? existingRoleQuery.eq("ward_id", wardIdForRow)
    : existingRoleQuery.is("ward_id", null);

  const { data: existingRole } = await existingRoleQuery.limit(1).maybeSingle();
  if (existingRole?.id) {
    return;
  }

  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role,
    ward_id: wardIdForRow,
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
  /** YYYY-MM-DD — date line next to parent/guardian signature on the release form */
  parentSignatureDate?: string;
};

export type YoungManPayload = {
  firstName: string;
  lastName: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  shirtSizeCode: string;
  /** Public https URL from profile-avatars bucket after client upload */
  photoUrl?: string;
  specialDietRequired: boolean;
  specialDietExplanation: string;
  hasAllergies: boolean;
  allergiesDetail: string;
  medications: string;
  selfAdministerMedication: boolean;
  chronicIllness: boolean;
  chronicIllnessExplanation: string;
  surgerySeriousIllnessPastYear: boolean;
  surgerySeriousIllnessExplanation: string;
  activityLimitsRestrictions: string;
  otherAccommodations: string;
  participantSignatureName: string;
  /** YYYY-MM-DD */
  participantSignatureDate: string;
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
    const sig = input.signatureName.trim();
    if (sig) {
      const dateRaw = input.parentSignatureDate?.trim() ?? "";
      if (!parseYmd(dateRaw)) {
        return {
          ok: false,
          error: "Parent signature date is required and must be YYYY-MM-DD.",
        };
      }
      profilePayload.terms_accepted_at = onboardingCompletedAt;
      profilePayload.signature_name = sig;
      profilePayload.parent_signature_date = dateRaw;
    } else {
      profilePayload.terms_accepted_at = null;
      profilePayload.signature_name = null;
      profilePayload.parent_signature_date = null;
    }
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

  if (profileRow?.role && isCampStaffRole(profileRow.role)) {
    try {
      await ensureUserRoleRow(
        supabase,
        userId,
        profileRow.role,
        userRolesWardIdForRole(profileRow.role as AppRole, profileRow.ward_id),
      );
    } catch (err) {
      console.error("[onboarding] failed to sync user_role:", err);
    }
  } else if (profileRow?.role === "young_men_captain") {
    try {
      await ensureUserRoleRow(
        supabase,
        userId,
        "young_men_captain",
        userRolesWardIdForRole("young_men_captain", profileRow.ward_id),
      );
    } catch (err) {
      console.error("[onboarding] failed to sync young_men_captain user_role:", err);
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

  // Use the signed-in user's client (not the service role). RLS allows parents
  // to insert young_men when parent_id = auth.uid(); avoids requiring
  // SUPABASE_SERVICE_ROLE_KEY on the app host (missing key was causing 500s).
  const { data: parentRow, error: parentLookupError } = await supabase
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

  const { data: sizeRows, error: sizeErr } = await supabase
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

  const signedAt = new Date().toISOString();

  const youngMenPayload: Array<Record<string, unknown>> = [];

  for (const ym of rows) {
    const nameRef = `${ym.firstName.trim()} ${ym.lastName.trim()}`;
    const code = ym.shirtSizeCode?.trim() ?? "";
    if (code && !validShirtCodes.has(code)) {
      return {
        ok: false,
        error: `Invalid shirt size "${code}" for ${nameRef}. Please pick a size from the list.`,
      };
    }
    const photoRaw = ym.photoUrl ?? "";
    const photoNorm = normalizeAvatarUrl(photoRaw);
    if (photoRaw.trim() && !photoNorm) {
      return {
        ok: false,
        error: `Photo for ${nameRef} must be a valid http:// or https:// URL.`,
      };
    }
    if (!photoNorm) {
      return {
        ok: false,
        error: `Add a profile photo for ${nameRef}.`,
      };
    }

    const dob = ym.dateOfBirth?.trim() ?? "";
    if (!parseYmd(dob)) {
      return {
        ok: false,
        error: `Enter a valid date of birth (YYYY-MM-DD) for ${nameRef}.`,
      };
    }
    const age = ageOnCampReference(dob);
    if (age === null || age < 8 || age > 18) {
      return {
        ok: false,
        error: `${nameRef} must be between 8 and 18 years old as of camp week (${CAMP_AGE_REFERENCE_YMD}).`,
      };
    }

    if (ym.specialDietRequired && !ym.specialDietExplanation?.trim()) {
      return {
        ok: false,
        error: `Describe dietary restrictions for ${nameRef}, or mark “No” for special diet.`,
      };
    }
    if (ym.hasAllergies && !ym.allergiesDetail?.trim()) {
      return {
        ok: false,
        error: `List allergies for ${nameRef}, or mark “No” for allergies.`,
      };
    }
    if (ym.chronicIllness && !ym.chronicIllnessExplanation?.trim()) {
      return {
        ok: false,
        error: `Explain the chronic or recurring illness for ${nameRef}, or mark “No”.`,
      };
    }
    if (ym.surgerySeriousIllnessPastYear && !ym.surgerySeriousIllnessExplanation?.trim()) {
      return {
        ok: false,
        error: `Explain the surgery or serious illness for ${nameRef}, or mark “No”.`,
      };
    }
    if (typeof ym.selfAdministerMedication !== "boolean") {
      return {
        ok: false,
        error: `Indicate whether ${nameRef} can self-administer medication.`,
      };
    }

    const psn = ym.participantSignatureName?.trim() ?? "";
    if (psn.length < 2) {
      return {
        ok: false,
        error: `Each young man needs a typed participant signature (full name) — missing for ${nameRef}.`,
      };
    }
    const psd = ym.participantSignatureDate?.trim() ?? "";
    if (!parseYmd(psd)) {
      return {
        ok: false,
        error: `Enter a valid participant signature date for ${nameRef}.`,
      };
    }

    const shirt = ym.shirtSizeCode?.trim() || null;

    youngMenPayload.push({
      parent_id: userId,
      first_name: ym.firstName.trim(),
      last_name: ym.lastName.trim(),
      age,
      date_of_birth: dob,
      photo_url: photoNorm,
      shirt_size_code: shirt,
      special_diet_required: ym.specialDietRequired,
      special_diet_explanation: ym.specialDietExplanation?.trim() || null,
      has_allergies: ym.hasAllergies,
      allergies_detail: ym.allergiesDetail?.trim() || null,
      medications: ym.medications?.trim() || null,
      self_administer_medication: ym.selfAdministerMedication,
      chronic_illness: ym.chronicIllness,
      chronic_illness_explanation: ym.chronicIllnessExplanation?.trim() || null,
      surgery_serious_illness_past_year: ym.surgerySeriousIllnessPastYear,
      surgery_serious_illness_explanation:
        ym.surgerySeriousIllnessExplanation?.trim() || null,
      activity_limits_restrictions: ym.activityLimitsRestrictions?.trim() || null,
      other_accommodations: ym.otherAccommodations?.trim() || null,
      participant_signature_name: psn,
      participant_signature_date: psd,
      participant_signed_at: signedAt,
    });
  }

  const { error: ymError } = await supabase.from("young_men").insert(youngMenPayload);
  if (ymError) {
    return { ok: false, error: `Could not save young men: ${ymError.message}` };
  }

  return { ok: true };
}
