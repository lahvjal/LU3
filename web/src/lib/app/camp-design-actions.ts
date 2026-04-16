"use server";

import { getUserContext } from "@/lib/auth/user-context";
import type { AppRole } from "@/lib/auth/user-context";
import { generateMagicLink } from "@/lib/email/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { leaderInviteEmail, parentInviteEmail } from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type CampDesignInitialData,
  getCampDesignInitialData,
} from "@/lib/app/camp-design-data";

type ActionResult =
  | { ok: true; data: CampDesignInitialData; profile?: ProfilePayload }
  | { ok: false; error: string };

type ProfilePayload = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
  phone: string | null;
  wardId: string | null;
  quorumId: string | null;
  medicalNotes: string | null;
  shirtSizeCode: string | null;
  age: number | null;
};

type ActivityInput = {
  title: string;
  category: string;
  day: number;
  time: string;
  location: string;
  desc: string;
};

type AgendaInput = {
  day: number;
  time: string;
  item: string;
  location: string;
};


type WardInput = {
  name: string;
  leader: string;
  leader_email: string;
  color: string;
};


type CompetitionInput = {
  name: string;
  rules: string;
  status: "upcoming" | "active" | "completed";
};

type AwardPointsInput = {
  competitionId: string;
  wardId: string;
  points: number;
  note: string;
  leader: string;
};

type AddParentInput = {
  parentName: string;
  parentEmail: string;
};

type ContactInput = {
  name: string;
  role: string;
  phone: string;
  email: string;
  emergency: boolean;
};

type LeadershipRole = Exclude<AppRole, "young_man">;

type InviteLeaderInput = {
  email: string;
  fullName: string;
  role: LeadershipRole;
  wardId: string | null;
  calling: string;
};

type YoungManInput = {
  firstName: string;
  lastName: string;
  age: string;
  shirtSizeCode: string;
  allergies: string;
  medicalNotes: string;
};

type ProfileUpdateInput = {
  displayName?: string;
  avatarUrl?: string;
  markOnboardingComplete?: boolean;
  phone?: string;
  wardId?: string | null;
  quorumId?: string | null;
  medicalNotes?: string;
  shirtSizeCode?: string | null;
  age?: number | null;
  youngMen?: YoungManInput[];
  signatureName?: string;
};

type SupabaseActionClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type LeaderInvitationClaimRow = {
  id: string;
  role: string;
  ward_id: string | null;
  status: "pending" | "active" | "revoked";
  accepted_at: string | null;
  user_id: string | null;
};

type RegistrationInviteClaimRow = {
  id: string;
  participant_id: string;
  status: "sent" | "accepted" | "revoked";
  accepted_at: string | null;
};

const CAMP_START_DATE = new Date("2026-06-15T00:00:00Z");

const DISPLAY_TO_SHIRT_CODE: Record<string, string> = {
  YS: "YS",
  YM: "YM",
  YL: "YL",
  S: "AS",
  M: "AM",
  L: "AL",
  XL: "AXL",
  "2XL": "A2XL",
  "3XL": "A3XL",
  AS: "AS",
  AM: "AM",
  AL: "AL",
  AXL: "AXL",
  A2XL: "A2XL",
  A3XL: "A3XL",
};

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

function fail(error: string): ActionResult {
  return { ok: false, error };
}

async function success(profile?: ProfilePayload): Promise<ActionResult> {
  const data = await getCampDesignInitialData();
  return { ok: true, data, profile };
}

function toAgendaDate(day: number) {
  const value = new Date(CAMP_START_DATE);
  value.setUTCDate(CAMP_START_DATE.getUTCDate() + day);
  return value.toISOString().slice(0, 10);
}

function parseTimeLabel(timeLabel: string) {
  const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 1 ||
    hours > 12 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const hour24 = meridian === "PM" ? (hours % 12) + 12 : hours % 12;
  return { hour24, minutes };
}

function toActivityTimestamp(day: number, timeLabel: string) {
  const parsed = parseTimeLabel(timeLabel);
  if (!parsed) {
    return null;
  }

  const value = new Date(CAMP_START_DATE);
  value.setUTCDate(CAMP_START_DATE.getUTCDate() + day);
  value.setUTCHours(parsed.hour24, parsed.minutes, 0, 0);
  return value.toISOString();
}

function splitChildName(childName: string) {
  const tokens = childName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const firstName = tokens[0];
  const lastName = tokens.slice(1).join(" ");
  if (!lastName) {
    return null;
  }

  return { firstName, lastName };
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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isLeadershipRole(value: string): value is LeadershipRole {
  return LEADERSHIP_ROLES.has(value as LeadershipRole);
}

async function ensureLeadershipUserRole(
  supabase: SupabaseActionClient,
  userId: string,
  role: LeadershipRole,
  wardId: string | null,
) {
  console.log("[onboarding] ensureLeadershipUserRole: userId=", userId, "role=", role, "wardId=", wardId);

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
    console.log("[onboarding] user_roles row already exists:", existingRole.id);
    return;
  }

  const insertPayload = {
    user_id: userId,
    role,
    ward_id: wardId,
    participant_id: null,
  };
  console.log("[onboarding] inserting into user_roles:", JSON.stringify(insertPayload));

  const { error } = await supabase.from("user_roles").insert(insertPayload);

  if (error) {
    console.error("[onboarding] user_roles insert FAILED:", error.message, error.code, error.details);
    throw new Error(error.message);
  }
  console.log("[onboarding] user_roles insert SUCCESS");
}

async function ensureYoungManUserRole(
  supabase: SupabaseActionClient,
  userId: string,
  participantId: string,
) {
  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "young_man")
    .eq("participant_id", participantId)
    .limit(1)
    .maybeSingle();

  if (existingRole?.id) {
    return;
  }

  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role: "young_man",
    ward_id: null,
    participant_id: participantId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncLeaderInvitationsForUser(
  userId: string,
  userEmail: string,
  onboardingCompletedAt: string,
  selectedWardId?: string | null,
) {
  const normalizedEmail = normalizeEmail(userEmail);
  if (!normalizedEmail) {
    console.log("[syncLeader] no normalized email, skipping");
    return;
  }

  console.log("[syncLeader] syncing for", normalizedEmail, "userId:", userId);

  const admin = createSupabaseAdminClient() as any;
  const adminClient = admin as unknown as SupabaseActionClient;

  const [leaderByEmailResult, leaderByUserResult] = await Promise.all([
    admin
      .from("leaders")
      .select("id, email, role, ward_id, status, accepted_at, user_id")
      .ilike("email", normalizedEmail),
    admin
      .from("leaders")
      .select("id, email, role, ward_id, status, accepted_at, user_id")
      .eq("user_id", userId),
  ]);

  console.log("[syncLeader] by email:", JSON.stringify(leaderByEmailResult.data));
  console.log("[syncLeader] by email error:", leaderByEmailResult.error?.message ?? "none");
  console.log("[syncLeader] by user_id:", JSON.stringify(leaderByUserResult.data));

  const leaderInvitations = new Map<string, LeaderInvitationClaimRow>();
  [...(leaderByEmailResult.data ?? []), ...(leaderByUserResult.data ?? [])].forEach((row) => {
    const casted = row as LeaderInvitationClaimRow;
    leaderInvitations.set(casted.id, casted);
  });

  console.log("[syncLeader] matched invitations:", leaderInvitations.size);

  for (const invitation of leaderInvitations.values()) {
    if (!isLeadershipRole(invitation.role)) {
      console.log("[syncLeader] skipping non-leadership role:", invitation.role);
      continue;
    }

    const nextAcceptedAt = invitation.accepted_at ?? onboardingCompletedAt;
    const needsLeaderUpdate =
      invitation.status !== "active" ||
      invitation.user_id !== userId ||
      invitation.accepted_at === null;

    console.log("[syncLeader] invitation", invitation.id, "role:", invitation.role, "needsUpdate:", needsLeaderUpdate, "status:", invitation.status, "existing user_id:", invitation.user_id);

    // Always update the leaders row first — this must not depend on user_roles succeeding
    if (needsLeaderUpdate) {
      const { error: updateError } = await admin
        .from("leaders")
        .update({
          user_id: userId,
          status: "active",
          accepted_at: nextAcceptedAt,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("[syncLeader] FAILED to update leaders.user_id for", invitation.id, ":", updateError.message, updateError.code);
      } else {
        console.log("[syncLeader] updated leaders.user_id for", invitation.id);
      }
    }

    if (!invitation.ward_id && selectedWardId) {
      const { error: wardError } = await admin
        .from("leaders")
        .update({ ward_id: selectedWardId })
        .eq("id", invitation.id);
      if (wardError) {
        console.error("[syncLeader] FAILED to update leaders.ward_id for", invitation.id, ":", wardError.message);
      }
    }

    // Assign user_roles separately — failures here should not block the leader link
    try {
      const roleWardId = WARD_SCOPED_LEADERSHIP_ROLES.has(invitation.role as LeadershipRole)
        ? invitation.ward_id
        : null;
      await ensureLeadershipUserRole(
        adminClient,
        userId,
        invitation.role,
        roleWardId,
      );
    } catch (err) {
      console.error(`[syncLeader] Failed to assign user_role for ${invitation.id}:`, err instanceof Error ? err.message : err);
    }
  }
}

async function removeLeadershipUserRole(
  supabase: SupabaseActionClient,
  userId: string,
  role: LeadershipRole,
  wardId: string | null,
) {
  let deleteQuery = supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  deleteQuery = wardId
    ? deleteQuery.eq("ward_id", wardId)
    : deleteQuery.is("ward_id", null);

  const { error } = await deleteQuery;
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveCallingId(
  supabase: SupabaseActionClient,
  callingName: string,
) {
  const normalized = callingName.trim();
  if (!normalized) {
    return null;
  }

  const { data: existingCalling } = await supabase
    .from("leader_callings")
    .select("id, name")
    .ilike("name", normalized)
    .limit(1)
    .maybeSingle();

  if (existingCalling?.id) {
    return existingCalling.id;
  }

  const { data: insertedCalling, error: insertCallingError } = await supabase
    .from("leader_callings")
    .insert({ name: normalized })
    .select("id")
    .single();

  if (insertCallingError || !insertedCalling?.id) {
    throw new Error(insertCallingError?.message ?? "Unable to save calling.");
  }

  return insertedCalling.id;
}

async function requireContentManager() {
  const context = await getUserContext();
  if (!context.canManageContent) {
    return null;
  }
  return context;
}

async function requireStakeAdmin() {
  const context = await getUserContext();
  if (!context.isStakeAdmin) {
    return null;
  }
  return context;
}


export async function refreshCampDesignDataAction(): Promise<ActionResult> {
  await getUserContext();
  return success();
}

export async function signOutCampAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function updateMyProfileAction(
  input: ProfileUpdateInput,
): Promise<ActionResult> {
  const context = await getUserContext();
  const shouldCompleteOnboarding = input.markOnboardingComplete === true;
  console.log("[onboarding] === updateMyProfileAction START ===");
  console.log("[onboarding] user.id:", context.user.id);
  console.log("[onboarding] user.email:", context.user.email);
  console.log("[onboarding] shouldCompleteOnboarding:", shouldCompleteOnboarding);
  console.log("[onboarding] existing onboardingCompletedAt:", context.onboardingCompletedAt);
  console.log("[onboarding] existing roles:", context.roles.length, JSON.stringify(context.roles));
  const displayName =
    (typeof input.displayName === "string" ? input.displayName : context.displayName).trim();
  if (!displayName) {
    return fail("Display name is required.");
  }

  const avatarRaw =
    typeof input.avatarUrl === "string"
      ? input.avatarUrl
      : (context.avatarUrl ?? "");
  const avatarUrl = normalizeAvatarUrl(avatarRaw);
  if (avatarRaw.trim() && !avatarUrl) {
    return fail("Avatar URL must start with http:// or https://.");
  }

  const phoneRaw =
    typeof input.phone === "string" ? input.phone : (context.phone ?? "");
  const medicalNotesRaw =
    typeof input.medicalNotes === "string"
      ? input.medicalNotes
      : (context.medicalNotes ?? "");
  const phone = phoneRaw.trim() || null;
  const medicalNotes = medicalNotesRaw.trim() || null;

  const hasWardIdInput = Object.prototype.hasOwnProperty.call(input, "wardId");
  const hasQuorumIdInput = Object.prototype.hasOwnProperty.call(input, "quorumId");
  const hasShirtSizeInput = Object.prototype.hasOwnProperty.call(input, "shirtSizeCode");
  const hasAgeInput = Object.prototype.hasOwnProperty.call(input, "age");

  const wardInputValue = hasWardIdInput ? input.wardId : context.wardId;
  const quorumInputValue = hasQuorumIdInput ? input.quorumId : context.quorumId;
  const shirtSizeInputValue = hasShirtSizeInput
    ? input.shirtSizeCode
    : context.shirtSizeCode;
  const ageInputValue = hasAgeInput ? input.age : context.age;

  let wardId =
    typeof wardInputValue === "string"
      ? (wardInputValue.trim() || null)
      : null;
  let quorumId =
    typeof quorumInputValue === "string"
      ? (quorumInputValue.trim() || null)
      : null;
  const shirtSizeCode =
    typeof shirtSizeInputValue === "string"
      ? (shirtSizeInputValue.trim() || null)
      : null;

  let age: number | null = null;
  if (ageInputValue === null || ageInputValue === undefined) {
    age = null;
  } else if (typeof ageInputValue === "number") {
    age = ageInputValue;
  } else {
    age = Number(ageInputValue);
  }

  if (age !== null && (!Number.isInteger(age) || age < 8 || age > 99)) {
    return fail("Age must be a whole number between 8 and 99.");
  }

  if (!context.isCamper) {
    quorumId = null;
  }

  const supabase = await createSupabaseServerClient();

  if (wardId) {
    const { data: wardRow } = await supabase
      .from("wards")
      .select("id")
      .eq("id", wardId)
      .maybeSingle();
    if (!wardRow) {
      return fail("Selected ward could not be found.");
    }
  }

  if (quorumId) {
    const { data: quorumRow } = await supabase
      .from("quorums")
      .select("id, ward_id")
      .eq("id", quorumId)
      .maybeSingle();
    if (!quorumRow) {
      return fail("Selected quorum could not be found.");
    }
    if (wardId && quorumRow.ward_id !== wardId) {
      return fail("Selected quorum must belong to the selected ward.");
    }
    wardId = wardId ?? quorumRow.ward_id;
  }

  if (shirtSizeCode) {
    const { data: shirtSizeRow } = await supabase
      .from("shirt_sizes")
      .select("code")
      .eq("code", shirtSizeCode)
      .maybeSingle();
    if (!shirtSizeRow) {
      return fail("Selected shirt size is invalid.");
    }
  }

  const onboardingCompletedAt = shouldCompleteOnboarding
    ? new Date().toISOString()
    : (context.onboardingCompletedAt ?? null);

  const profilePayload: Record<string, string | number | null> = {
    user_id: context.user.id,
    user_email: context.user.email?.toLowerCase() ?? null,
    display_name: displayName,
    avatar_url: avatarUrl,
    phone,
    ward_id: wardId,
    quorum_id: quorumId,
    medical_notes: medicalNotes,
    shirt_size_code: shirtSizeCode,
    age,
  };

  if (shouldCompleteOnboarding) {
    profilePayload.onboarding_completed_at = onboardingCompletedAt;
  }

  console.log("[onboarding] upserting user_profiles with:", JSON.stringify(profilePayload));

  const { error, data: upsertedRows } = await supabase
    .from("user_profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select("user_id, display_name, onboarding_completed_at");

  if (error) {
    console.error("[onboarding] user_profiles upsert FAILED:", error.message, error.code, error.details);
    return fail(error.message);
  }
  console.log("[onboarding] user_profiles upsert SUCCESS:", JSON.stringify(upsertedRows));

  console.log("[onboarding] checking sync conditions: email=", context.user.email, "onboardingCompletedAt=", onboardingCompletedAt);
  if (context.user.email && onboardingCompletedAt) {
    console.log("[onboarding] calling syncLeaderInvitationsForUser...");
    try {
      await syncLeaderInvitationsForUser(
        context.user.id,
        context.user.email,
        onboardingCompletedAt,
        wardId,
      );
      console.log("[onboarding] syncLeaderInvitationsForUser completed");
    } catch (syncError) {
      console.error("[onboarding] syncLeaderInvitationsForUser THREW:", syncError);
    }
  } else {
    console.log("[onboarding] SKIPPED syncLeaderInvitationsForUser — conditions not met");
  }

  if (shouldCompleteOnboarding && onboardingCompletedAt && context.user.email) {

    if (input.youngMen && input.youngMen.length > 0 && wardId) {
      try {
        const admin = createSupabaseAdminClient() as any;
        const normalizedEmail = context.user.email.toLowerCase().trim();

        const { data: parentRow } = await admin
          .from("parents")
          .select("id")
          .ilike("email", normalizedEmail)
          .limit(1)
          .maybeSingle();

        if (parentRow?.id) {
          await admin
            .from("parents")
            .update({
              user_id: context.user.id,
              first_name: displayName.split(/\s+/)[0] || displayName,
              last_name: displayName.split(/\s+/).slice(1).join(" ") || "",
              phone: input.phone?.trim() || null,
              ward_id: wardId,
              registration_status: "active",
              invite_status: "accepted",
              onboarding_completed_at: onboardingCompletedAt,
              terms_accepted_at: input.signatureName ? onboardingCompletedAt : null,
              signature_name: input.signatureName?.trim() || null,
            })
            .eq("id", parentRow.id);

          const youngMenPayload = input.youngMen
            .filter((ym) => ym.firstName?.trim() && ym.lastName?.trim())
            .map((ym) => ({
              parent_id: parentRow.id,
              first_name: ym.firstName.trim(),
              last_name: ym.lastName.trim(),
              age: Number(ym.age) || 12,
              shirt_size_code: ym.shirtSizeCode?.trim() || null,
              allergies: ym.allergies?.trim() || null,
              medical_notes: ym.medicalNotes?.trim() || null,
            }));

          if (youngMenPayload.length > 0) {
            await admin.from("young_men").insert(youngMenPayload);
          }
        }
      } catch (parentSyncError) {
        console.error("Failed to sync parent registration:", parentSyncError);
      }
    }
  }

  if (shouldCompleteOnboarding) {
    try {
      const adminVerify = createSupabaseAdminClient() as any;
      const { data: leaderRows } = await adminVerify
        .from("leaders")
        .select("id, email, user_id, role, ward_id, status")
        .eq("user_id", context.user.id);
      console.log("[onboarding] === FINAL leaders table state for this user ===");
      console.log(JSON.stringify(leaderRows, null, 2));

      const { data: roleRows } = await adminVerify
        .from("user_roles")
        .select("id, user_id, role, ward_id")
        .eq("user_id", context.user.id);
      console.log("[onboarding] === FINAL user_roles state for this user ===");
      console.log(JSON.stringify(roleRows, null, 2));
    } catch (verifyErr) {
      console.error("[onboarding] verification query failed:", verifyErr);
    }
    console.log("[onboarding] === updateMyProfileAction END ===");
  }

  return success({
    email: context.user.email ?? "",
    displayName,
    avatarUrl,
    onboardingCompletedAt,
    phone,
    wardId,
    quorumId,
    medicalNotes,
    shirtSizeCode,
    age,
  });
}

export async function createActivityAction(
  input: ActivityInput,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to add activities.");
  }

  const startsAt = toActivityTimestamp(input.day, input.time);
  if (!startsAt || !input.title.trim()) {
    return fail("Please provide a valid title and time.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("activities").insert({
    title: input.title.trim(),
    category: input.category.trim() || "General",
    starts_at: startsAt,
    location: input.location.trim() || null,
    description: input.desc.trim() || null,
    created_by: context.user.id,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteActivityAction(id: string): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to delete activities.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function createAgendaItemAction(
  input: AgendaInput,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to add agenda items.");
  }

  if (!input.time.trim() || !input.item.trim()) {
    return fail("Please provide both time and item name.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("daily_agenda_items").insert({
    agenda_date: toAgendaDate(input.day),
    time_slot: input.time.trim(),
    title: input.item.trim(),
    location: input.location.trim() || null,
    created_by: context.user.id,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteAgendaItemAction(id: string): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to delete agenda items.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("daily_agenda_items")
    .delete()
    .eq("id", id);
  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function createWardAction(input: WardInput): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("Only stake admins can create wards.");
  }

  const name = input.name.trim();
  if (!name) {
    return fail("Ward name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: ward, error: wardError } = await supabase
    .from("wards")
    .upsert(
      {
        name,
        leader_name: input.leader.trim() || null,
        leader_email: input.leader_email.trim() || null,
        theme_color: input.color.trim() || null,
      },
      { onConflict: "name" },
    )
    .select("id")
    .single();

  if (wardError || !ward?.id) {
    return fail(wardError?.message ?? "Unable to save ward.");
  }

  const { error: quorumError } = await supabase.from("quorums").upsert(
    [
      { ward_id: ward.id, quorum_type: "deacons", display_name: "Deacons" },
      { ward_id: ward.id, quorum_type: "teachers", display_name: "Teachers" },
      { ward_id: ward.id, quorum_type: "priests", display_name: "Priests" },
    ],
    { onConflict: "ward_id,quorum_type" },
  );

  if (quorumError) {
    return fail(quorumError.message);
  }

  return success();
}

export async function deleteWardAction(wardId: string): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("Only stake admins can delete wards.");
  }

  const supabase = await createSupabaseServerClient();
  const { count: parentCount, error: parentCountError } = await supabase
    .from("parents")
    .select("id", { count: "exact", head: true })
    .eq("ward_id", wardId);

  if (parentCountError) {
    return fail(parentCountError.message);
  }

  if ((parentCount ?? 0) > 0) {
    return fail(
      "Cannot delete a ward that still has registered parents. Reassign or remove them first.",
    );
  }

  const quorumDelete = await supabase.from("quorums").delete().eq("ward_id", wardId);
  if (quorumDelete.error) {
    return fail(quorumDelete.error.message);
  }

  const wardDelete = await supabase.from("wards").delete().eq("id", wardId);
  if (wardDelete.error) {
    return fail(wardDelete.error.message);
  }

  return success();
}

export async function updateWardAction(
  wardId: string,
  input: WardInput,
): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("Only stake admins can edit wards.");
  }

  const name = input.name.trim();
  if (!name) {
    return fail("Ward name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("wards")
    .update({
      name,
      leader_name: input.leader.trim() || null,
      leader_email: input.leader_email.trim() || null,
      theme_color: input.color.trim() || null,
    })
    .eq("id", wardId);

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function createCompetitionAction(
  input: CompetitionInput,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to create competitions.");
  }

  const name = input.name.trim();
  if (!name) {
    return fail("Competition name is required.");
  }

  const status =
    input.status === "active" || input.status === "completed"
      ? input.status
      : "upcoming";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("competitions").insert({
    name,
    rules: input.rules.trim() || null,
    status,
    created_by: context.user.id,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteCompetitionAction(
  competitionId: string,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to delete competitions.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", competitionId);

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function awardPointsAction(
  input: AwardPointsInput,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canAwardCompetitionPoints) {
    return fail("You do not have permission to award points.");
  }

  if (
    !input.competitionId ||
    !input.wardId ||
    !Number.isFinite(input.points) ||
    input.points === 0 ||
    Math.abs(input.points) > 100
  ) {
    return fail("Please provide valid points and targets.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("competition_points").insert({
    competition_id: input.competitionId,
    ward_id: input.wardId,
    unit_id: null,
    points: input.points,
    reason: input.note.trim() || null,
    awarded_by: context.user.id,
    awarded_by_name: input.leader.trim() || null,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function addParentAction(
  input: AddParentInput,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageRegistrations) {
    return fail("You do not have permission to add registrations.");
  }

  const parentName = splitChildName(input.parentName);
  if (!parentName) {
    return fail("Please enter the parent's first and last name.");
  }

  const email = normalizeEmail(input.parentEmail);
  if (!email || !email.includes("@")) {
    return fail("Please enter a valid email address.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("parents")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return fail("A parent with this email already exists.");
  }

  const { error } = await supabase.from("parents").insert({
    first_name: parentName.firstName,
    last_name: parentName.lastName,
    email,
    registration_status: "not_invited_yet",
    invite_status: "not_sent",
    invited_by: context.user.id,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function sendParentInviteAction(
  parentId: string,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageRegistrations) {
    return fail("You do not have permission to send invites.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: parent } = await supabase
    .from("parents")
    .select("id, first_name, last_name, email, registration_status")
    .eq("id", parentId)
    .maybeSingle();

  if (!parent?.id) {
    return fail("Parent not found.");
  }

  if (parent.registration_status === "active") {
    return fail("This parent has already completed registration.");
  }

  const { actionLink: parentLink } = await generateMagicLink(parent.email);
  if (parentLink) {
    const parentName = `${parent.first_name} ${parent.last_name}`.trim();
    const template = parentInviteEmail(parentName, parentLink);
    await sendEmail({
      to: parent.email,
      subject: template.subject,
      html: template.html,
    });
  }

  const { error } = await supabase
    .from("parents")
    .update({
      registration_status: "pending",
      invite_status: "sent",
      invited_at: new Date().toISOString(),
      invited_by: context.user.id,
    })
    .eq("id", parentId);

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteParentAction(
  parentId: string,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageRegistrations) {
    return fail("You do not have permission to delete registrations.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("parents")
    .delete()
    .eq("id", parentId);

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function addContactAction(input: ContactInput): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to add contacts.");
  }

  if (!input.name.trim()) {
    return fail("Contact name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contacts").insert({
    full_name: input.name.trim(),
    role_title: input.role.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    is_emergency: input.emergency,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteContactAction(contactId: string): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to delete contacts.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function inviteLeaderAction(
  input: InviteLeaderInput,
): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("You do not have permission to invite leaders.");
  }

  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    return fail("Please enter a valid email address.");
  }

  if (!isLeadershipRole(input.role)) {
    return fail("Please select a valid leadership role.");
  }

  let wardId = input.wardId?.trim() || null;

  const callingName = input.calling.trim();
  if (!callingName) {
    return fail("Please select or enter a calling.");
  }

  const supabase = await createSupabaseServerClient();

  if (wardId) {
    const { data: wardRow } = await supabase
      .from("wards")
      .select("id")
      .eq("id", wardId)
      .maybeSingle();
    if (!wardRow?.id) {
      return fail("Selected ward could not be found.");
    }
  }

  let callingId: string | null = null;
  try {
    callingId = await resolveCallingId(supabase, callingName);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to save calling.");
  }

  if (!callingId) {
    return fail("Unable to save calling.");
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("user_id, onboarding_completed_at")
    .ilike("user_email", email)
    .limit(1)
    .maybeSingle();

  const invitedUserId = userProfile?.user_id ?? null;
  const onboardingCompleted = Boolean(userProfile?.onboarding_completed_at);
  const invitationStatus = onboardingCompleted ? "active" : "pending";
  const acceptedAt = onboardingCompleted
    ? (userProfile!.onboarding_completed_at as string)
    : null;

  let existingInviteQuery = supabase
    .from("leaders")
    .select("id")
    .eq("email", email)
    .eq("role", input.role);
  existingInviteQuery = wardId
    ? existingInviteQuery.eq("ward_id", wardId)
    : existingInviteQuery.is("ward_id", null);

  const { data: existingInvite } = await existingInviteQuery.limit(1).maybeSingle();

  const fullName = input.fullName?.trim() || null;

  const invitationPayload = {
    email,
    full_name: fullName,
    user_id: invitedUserId,
    role: input.role,
    ward_id: wardId,
    calling_id: callingId,
    status: invitationStatus,
    invited_by: context.user.id,
    invited_at: new Date().toISOString(),
    accepted_at: acceptedAt,
  };

  const { error: inviteSaveError } = existingInvite?.id
    ? await supabase
        .from("leaders")
        .update(invitationPayload)
        .eq("id", existingInvite.id)
    : await supabase.from("leaders").insert(invitationPayload);

  if (inviteSaveError) {
    console.error("[inviteLeaderAction] save error:", inviteSaveError.message, inviteSaveError.code, inviteSaveError.details);
    return fail(inviteSaveError.message);
  }

  if (invitedUserId) {
    try {
      await ensureLeadershipUserRole(supabase, invitedUserId, input.role, wardId);
    } catch (error) {
      return fail(
        error instanceof Error
          ? error.message
          : "Unable to assign the requested role to this user.",
      );
    }
  }

  const { actionLink, userId: authUserId } = await generateMagicLink(email);

  // If we now have an auth user_id that wasn't available at insert time, link it
  if (authUserId && !invitedUserId) {
    const admin = createSupabaseAdminClient() as any;
    const { error: linkError } = await admin
      .from("leaders")
      .update({ user_id: authUserId })
      .eq("email", email)
      .is("user_id", null);

    if (linkError) {
      console.error("[inviteLeaderAction] failed to link auth user_id to leaders:", linkError.message);
    } else {
      console.log("[inviteLeaderAction] linked auth user_id", authUserId, "to leaders row for", email);
    }

    try {
      await ensureLeadershipUserRole(supabase, authUserId, input.role, wardId);
    } catch (roleErr) {
      console.error("[inviteLeaderAction] failed to assign role for newly linked user:", roleErr);
    }
  }

  if (actionLink) {
    const template = leaderInviteEmail(fullName, input.role, callingName, actionLink);
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }

  return success();
}

export async function updateLeaderAction(
  leaderId: string,
  input: {
    displayName?: string;
    role?: string;
    wardId?: string | null;
    calling?: string;
  },
): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("Only stake admins can edit leaders.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("leaders")
    .select("id, role, ward_id, user_id, calling_id")
    .eq("id", leaderId)
    .maybeSingle();

  if (fetchError || !existing) {
    return fail(fetchError?.message ?? "Leader not found.");
  }

  const updates: Record<string, unknown> = {};

  if (input.role && isLeadershipRole(input.role) && input.role !== existing.role) {
    if (existing.user_id && isLeadershipRole(existing.role)) {
      try {
        await removeLeadershipUserRole(supabase, existing.user_id, existing.role, existing.ward_id);
      } catch {}
    }
    updates.role = input.role;
  }

  if (Object.prototype.hasOwnProperty.call(input, "wardId")) {
    const newWardId = input.wardId?.trim() || null;
    if (newWardId !== existing.ward_id) {
      if (existing.user_id && isLeadershipRole(existing.role)) {
        try {
          await removeLeadershipUserRole(supabase, existing.user_id, existing.role, existing.ward_id);
        } catch {}
      }
      updates.ward_id = newWardId;
    }
  }

  const finalRole = (updates.role as string) ?? existing.role;
  const finalWardId = Object.prototype.hasOwnProperty.call(updates, "ward_id")
    ? (updates.ward_id as string | null)
    : existing.ward_id;

  if (existing.user_id && isLeadershipRole(finalRole)) {
    await ensureLeadershipUserRole(supabase, existing.user_id, finalRole, finalWardId);
  }

  if (input.calling?.trim()) {
    const callingName = input.calling.trim();
    const { data: callingRow } = await supabase
      .from("leader_callings")
      .upsert({ name: callingName }, { onConflict: "name" })
      .select("id")
      .single();
    if (callingRow?.id) {
      updates.calling_id = callingRow.id;
    }
  }

  if (input.displayName?.trim() && existing.user_id) {
    const admin = createSupabaseAdminClient() as any;
    await admin
      .from("user_profiles")
      .update({ display_name: input.displayName.trim() })
      .eq("user_id", existing.user_id);
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("leaders")
      .update(updates)
      .eq("id", leaderId);
    if (updateError) {
      return fail(updateError.message);
    }
  }

  return success();
}

export async function deleteLeaderInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("You do not have permission to delete invitations.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: invitationRow, error: invitationError } = await supabase
    .from("leaders")
    .select("id, role, ward_id, user_id")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError || !invitationRow?.id) {
    return fail(invitationError?.message ?? "Invitation not found.");
  }

  if (invitationRow.user_id && isLeadershipRole(invitationRow.role)) {
    try {
      await removeLeadershipUserRole(
        supabase,
        invitationRow.user_id,
        invitationRow.role,
        invitationRow.ward_id,
      );
    } catch (error) {
      return fail(
        error instanceof Error
          ? error.message
          : "Unable to remove assigned role from user.",
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("leaders")
    .delete()
    .eq("id", invitationId);
  if (deleteError) {
    return fail(deleteError.message);
  }

  return success();
}
