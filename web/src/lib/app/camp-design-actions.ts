"use server";

import { getUserContext } from "@/lib/auth/user-context";
import type { AppRole } from "@/lib/auth/user-context";
import { generateMagicLink } from "@/lib/email/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { leaderInviteEmail } from "@/lib/email/templates";
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

type UnitInput = {
  name: string;
  leader: string;
  leader_email: string;
};

type WardInput = {
  name: string;
  leader: string;
  leader_email: string;
};

type CamperInput = {
  unitId: string;
  camperName: string;
};

type CompetitionInput = {
  name: string;
  rules: string;
  status: "upcoming" | "active" | "completed";
};

type AwardPointsInput = {
  competitionId: string;
  unitId: string;
  points: number;
  note: string;
  leader: string;
};

type RegistrationInput = {
  child: string;
  age: number;
  parent: string;
  parentEmail: string;
  phone: string;
  tshirt: string;
  wardId?: string | null;
  unit?: string;
  medical: string;
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
  role: LeadershipRole;
  wardId: string | null;
  calling: string;
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

function splitCamperName(camperName: string) {
  const tokens = camperName
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

  return {
    firstName,
    lastName,
  };
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

async function syncInviteStatusesAfterOnboardingCompletion(
  userId: string,
  userEmail: string,
  onboardingCompletedAt: string,
) {
  const normalizedEmail = normalizeEmail(userEmail);
  if (!normalizedEmail) {
    return;
  }

  const admin = createSupabaseAdminClient() as any;
  const adminClient = admin as unknown as SupabaseActionClient;

  const [leaderByEmailResult, leaderByUserResult, youthInviteResult] = await Promise.all([
    admin
      .from("leader_invitations")
      .select("id, role, ward_id, status, accepted_at, user_id")
      .ilike("email", normalizedEmail)
      .in("status", ["pending", "active"]),
    admin
      .from("leader_invitations")
      .select("id, role, ward_id, status, accepted_at, user_id")
      .eq("user_id", userId)
      .in("status", ["pending", "active"]),
    admin
      .from("registration_invites")
      .select("id, participant_id, status, accepted_at")
      .eq("target_type", "youth")
      .ilike("recipient_email", normalizedEmail)
      .in("status", ["sent", "accepted"]),
  ]);

  if (leaderByEmailResult.error) {
    throw new Error(leaderByEmailResult.error.message);
  }
  if (leaderByUserResult.error) {
    throw new Error(leaderByUserResult.error.message);
  }
  if (youthInviteResult.error) {
    throw new Error(youthInviteResult.error.message);
  }

  const leaderInvitations = new Map<string, LeaderInvitationClaimRow>();
  [...(leaderByEmailResult.data ?? []), ...(leaderByUserResult.data ?? [])].forEach((row) => {
    const casted = row as LeaderInvitationClaimRow;
    leaderInvitations.set(casted.id, casted);
  });

  for (const invitation of leaderInvitations.values()) {
    if (!isLeadershipRole(invitation.role)) {
      continue;
    }

    await ensureLeadershipUserRole(
      adminClient,
      userId,
      invitation.role,
      invitation.ward_id,
    );

    const nextAcceptedAt = invitation.accepted_at ?? onboardingCompletedAt;
    const needsUpdate =
      invitation.status !== "active" ||
      invitation.user_id !== userId ||
      invitation.accepted_at === null;

    if (!needsUpdate) {
      continue;
    }

    const { error: leaderUpdateError } = await admin
      .from("leader_invitations")
      .update({
        user_id: userId,
        status: "active",
        accepted_at: nextAcceptedAt,
      })
      .eq("id", invitation.id);

    if (leaderUpdateError) {
      throw new Error(leaderUpdateError.message);
    }
  }

  const youthInvites = (youthInviteResult.data ?? []) as RegistrationInviteClaimRow[];
  const participantIds = [
    ...new Set(youthInvites.map((invite) => invite.participant_id).filter(Boolean)),
  ];

  for (const invite of youthInvites) {
    await ensureYoungManUserRole(adminClient, userId, invite.participant_id);

    if (invite.status === "accepted" && invite.accepted_at) {
      continue;
    }

    const { error: registrationInviteUpdateError } = await admin
      .from("registration_invites")
      .update({
        status: "accepted",
        accepted_at: invite.accepted_at ?? onboardingCompletedAt,
      })
      .eq("id", invite.id);

    if (registrationInviteUpdateError) {
      throw new Error(registrationInviteUpdateError.message);
    }
  }

  if (participantIds.length > 0) {
    const { error: rosterUpdateError } = await admin
      .from("registration_roster")
      .update({
        status: "active",
      })
      .in("participant_id", participantIds)
      .eq("status", "pending");

    if (rosterUpdateError) {
      throw new Error(rosterUpdateError.message);
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

async function requireUnitManager() {
  const context = await getUserContext();
  if (!context.canManageUnits) {
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

  const { error } = await supabase
    .from("user_profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (error) {
    return fail(error.message);
  }

  if (shouldCompleteOnboarding && onboardingCompletedAt && context.user.email) {
    try {
      await syncInviteStatusesAfterOnboardingCompletion(
        context.user.id,
        context.user.email,
        onboardingCompletedAt,
      );
    } catch (syncError) {
      console.error("Failed to sync onboarding invite statuses:", syncError);
    }
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

export async function createUnitAction(input: UnitInput): Promise<ActionResult> {
  const context = await requireUnitManager();
  if (!context) {
    return fail("You do not have permission to create units.");
  }

  const name = input.name.trim();
  if (!name) {
    return fail("Unit name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: unit, error: unitError } = await supabase
    .from("camp_units")
    .upsert(
      {
        name,
        color: null,
        leader_name: input.leader.trim() || null,
        leader_email: input.leader_email.trim() || null,
        created_by: context.user.id,
      },
      { onConflict: "name" },
    )
    .select("id")
    .single();

  if (unitError || !unit?.id) {
    return fail(unitError?.message ?? "Unable to save unit.");
  }

  return success();
}

export async function deleteUnitAction(unitId: string): Promise<ActionResult> {
  const context = await requireUnitManager();
  if (!context) {
    return fail("You do not have permission to delete units.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: deletedUnits, error: unitDeleteError } = await supabase
    .from("camp_units")
    .delete()
    .eq("id", unitId)
    .select("id");
  if (unitDeleteError) {
    return fail(unitDeleteError.message);
  }

  if (!deletedUnits?.length) {
    return fail("Unit not found. Refresh and try again.");
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
  const { count, error: countError } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("ward_id", wardId);

  if (countError) {
    return fail(countError.message);
  }

  if ((count ?? 0) > 0) {
    return fail(
      "Cannot delete a ward that still has participants. Reassign or remove campers first.",
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

export async function addCamperAction(input: CamperInput): Promise<ActionResult> {
  const context = await requireUnitManager();
  if (!context) {
    return fail("You do not have permission to add campers.");
  }

  const parsedName = splitCamperName(input.camperName);
  if (!parsedName) {
    return fail("Please enter a camper's first and last name.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: unitRow, error: unitError } = await supabase
    .from("camp_units")
    .select("id")
    .eq("id", input.unitId)
    .maybeSingle();
  if (unitError || !unitRow?.id) {
    return fail(unitError?.message ?? "Selected unit could not be found.");
  }

  const { data: matches, error: matchError } = await supabase
    .from("participants")
    .select("id")
    .ilike("first_name", parsedName.firstName)
    .ilike("last_name", parsedName.lastName)
    .eq("active", true)
    .limit(5);

  if (matchError) {
    return fail(matchError.message);
  }

  if (!matches?.length) {
    return fail(
      "No existing camper matched that name. Add him to participants first, then assign him to a unit.",
    );
  }

  if (matches.length > 1) {
    return fail(
      "Multiple campers matched that name. Use a more specific name before assigning to a unit.",
    );
  }

  const { error } = await supabase.from("camp_unit_members").upsert(
    {
      unit_id: input.unitId,
      participant_id: matches[0].id,
      created_by: context.user.id,
    },
    {
      onConflict: "unit_id,participant_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function removeCamperAction(
  unitMemberId: string,
): Promise<ActionResult> {
  const context = await requireUnitManager();
  if (!context) {
    return fail("You do not have permission to remove campers.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: removedMembershipRows, error } = await supabase
    .from("camp_unit_members")
    .delete()
    .eq("id", unitMemberId)
    .select("id");

  if (error) {
    return fail(error.message);
  }

  if (!removedMembershipRows?.length) {
    const { error: participantDeleteError } = await supabase
      .from("participants")
      .delete()
      .eq("id", unitMemberId);
    if (participantDeleteError) {
      return fail(participantDeleteError.message);
    }
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
    !input.unitId ||
    !Number.isFinite(input.points) ||
    input.points === 0 ||
    Math.abs(input.points) > 100
  ) {
    return fail("Please provide valid points and targets.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("competition_points").insert({
    competition_id: input.competitionId,
    ward_id: null,
    unit_id: input.unitId,
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

export async function createRegistrationAction(
  input: RegistrationInput,
): Promise<ActionResult> {
  await getUserContext();

  const childName = splitChildName(input.child);
  if (
    !childName ||
    !input.parent.trim() ||
    !input.parentEmail.trim() ||
    !Number.isFinite(input.age)
  ) {
    return fail("Please provide complete registration details.");
  }

  const supabase = await createSupabaseServerClient();
  let wardId: string | null = null;
  let preferredUnitName: string | null =
    typeof input.unit === "string" && input.unit.trim()
      ? input.unit.trim()
      : null;

  if (typeof input.wardId === "string" && input.wardId.trim()) {
    const wardResult = await supabase
      .from("wards")
      .select("id, name")
      .eq("id", input.wardId.trim())
      .maybeSingle();
    if (!wardResult.error && wardResult.data?.id) {
      wardId = wardResult.data.id;
      preferredUnitName = wardResult.data.name;
    } else {
      return fail("Selected ward could not be found.");
    }
  } else if (typeof input.unit === "string" && input.unit.trim()) {
    const wardResult = await supabase
      .from("wards")
      .select("id, name")
      .eq("name", input.unit.trim())
      .limit(1)
      .maybeSingle();
    if (!wardResult.error && wardResult.data?.id) {
      wardId = wardResult.data.id;
      preferredUnitName = wardResult.data.name;
    }
  }

  const shirtSizeCode = DISPLAY_TO_SHIRT_CODE[input.tshirt.trim().toUpperCase()] ?? null;

  const { error } = await supabase.from("parent_registrations").insert({
    parent_name: input.parent.trim(),
    parent_email: input.parentEmail.trim(),
    parent_phone: input.phone.trim() || null,
    child_first_name: childName.firstName,
    child_last_name: childName.lastName,
    child_age: input.age,
    preferred_unit_name: preferredUnitName,
    ward_id: wardId,
    shirt_size_preference: input.tshirt.trim() || null,
    shirt_size_code: shirtSizeCode,
    medical_notes: input.medical.trim() || null,
    status: "pending",
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function updateRegistrationStatusAction(
  registrationId: string,
  status: "pending" | "approved" | "waitlisted" | "declined",
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageRegistrations) {
    return fail("You do not have permission to update registrations.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("parent_registrations")
    .update({
      status,
      reviewed_by: context.user.id,
    })
    .eq("id", registrationId);

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteRegistrationAction(
  registrationId: string,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageContent) {
    return fail("You do not have permission to delete registrations.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("parent_registrations")
    .delete()
    .eq("id", registrationId);

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
  if (WARD_SCOPED_LEADERSHIP_ROLES.has(input.role) && !wardId) {
    return fail("Please select a ward for ward-level callings.");
  }
  if (!WARD_SCOPED_LEADERSHIP_ROLES.has(input.role)) {
    wardId = null;
  }

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
    .select("user_id")
    .ilike("user_email", email)
    .limit(1)
    .maybeSingle();

  const invitedUserId = userProfile?.user_id ?? null;
  const invitationStatus = invitedUserId ? "active" : "pending";
  const acceptedAt = invitedUserId ? new Date().toISOString() : null;

  let existingInviteQuery = supabase
    .from("leader_invitations")
    .select("id")
    .eq("email", email)
    .eq("role", input.role);
  existingInviteQuery = wardId
    ? existingInviteQuery.eq("ward_id", wardId)
    : existingInviteQuery.is("ward_id", null);

  const { data: existingInvite } = await existingInviteQuery.limit(1).maybeSingle();

  const invitationPayload = {
    email,
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
        .from("leader_invitations")
        .update(invitationPayload)
        .eq("id", existingInvite.id)
    : await supabase.from("leader_invitations").insert(invitationPayload);

  if (inviteSaveError) {
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

  const magicLinkUrl = await generateMagicLink(email);
  if (magicLinkUrl) {
    const template = leaderInviteEmail(null, input.role, callingName, magicLinkUrl);
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }

  return success();
}

export async function updateLeaderInvitationStatusAction(
  invitationId: string,
  status: "pending" | "active" | "revoked",
): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("You do not have permission to update invitations.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: invitationRow, error: invitationError } = await supabase
    .from("leader_invitations")
    .select("id, email, user_id, role, ward_id, status")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError || !invitationRow?.id) {
    return fail(invitationError?.message ?? "Invitation not found.");
  }

  if (!isLeadershipRole(invitationRow.role)) {
    return fail("This invitation does not map to a valid leadership role.");
  }

  let targetUserId = invitationRow.user_id ?? null;

  if (status === "active" && !targetUserId) {
    const { data: matchedProfile } = await supabase
      .from("user_profiles")
      .select("user_id")
      .ilike("user_email", invitationRow.email)
      .limit(1)
      .maybeSingle();

    targetUserId = matchedProfile?.user_id ?? null;
    if (!targetUserId) {
      return fail(
        "This invitation is still pending because the user has not created an account yet.",
      );
    }
  }

  if (targetUserId && (status === "pending" || status === "revoked")) {
    try {
      await removeLeadershipUserRole(
        supabase,
        targetUserId,
        invitationRow.role,
        invitationRow.ward_id,
      );
    } catch (error) {
      return fail(
        error instanceof Error
          ? error.message
          : "Unable to remove the assigned role for this user.",
      );
    }
  }

  if (targetUserId && status === "active") {
    try {
      await ensureLeadershipUserRole(
        supabase,
        targetUserId,
        invitationRow.role,
        invitationRow.ward_id,
      );
    } catch (error) {
      return fail(
        error instanceof Error
          ? error.message
          : "Unable to assign the requested role to this user.",
      );
    }
  }

  const { error: updateError } = await supabase
    .from("leader_invitations")
    .update({
      status,
      user_id: targetUserId,
      accepted_at: status === "active" ? new Date().toISOString() : null,
      invited_by: context.user.id,
    })
    .eq("id", invitationId);

  if (updateError) {
    return fail(updateError.message);
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
    .from("leader_invitations")
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
    .from("leader_invitations")
    .delete()
    .eq("id", invitationId);
  if (deleteError) {
    return fail(deleteError.message);
  }

  return success();
}
