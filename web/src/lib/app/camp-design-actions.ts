"use server";

import { getUserContext } from "@/lib/auth/user-context";
import type { AppRole } from "@/lib/auth/user-context";
import { generateMagicLink } from "@/lib/email/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { leaderInviteEmail, parentInviteEmail } from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  completeOnboardingProfileInDb,
  insertParentYoungMenInDb,
} from "@/lib/app/onboarding-completion-api";
import {
  type CampDesignInitialData,
  getCampDesignInitialData,
} from "@/lib/app/camp-design-data";

type ActionResult =
  | { ok: true; data: CampDesignInitialData; profile?: ProfilePayload }
  | { ok: true; onboardingDone: true }
  | { ok: false; error: string };

type ProfilePayload = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
  phone: string | null;
  wardId: string | null;
};

type ActivityInput = {
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  desc: string;
};

type AgendaInput = {
  date: string;
  time: string;
  item: string;
  location: string;
};


type WardInput = {
  name: string;
  leader: string;
  leader_phone: string;
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

/** Roles that may be invited as camp staff (synced to `user_roles` for leader tools). */
export type CampStaffRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee";

type InviteLeaderInput = {
  email: string;
  fullName?: string;
  role: CampStaffRole;
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
  photoUrl?: string;
};

type ProfileUpdateInput = {
  displayName?: string;
  avatarUrl?: string;
  markOnboardingComplete?: boolean;
  phone?: string;
  wardId?: string | null;
  signatureName?: string;
};

type SupabaseActionClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const CAMP_STAFF_ROLES = new Set<CampStaffRole>([
  "stake_leader",
  "stake_camp_director",
  "ward_leader",
  "camp_committee",
]);

function fail(error: string): ActionResult {
  return { ok: false, error };
}

async function success(profile?: ProfilePayload): Promise<ActionResult> {
  try {
    const data = await getCampDesignInitialData();
    return { ok: true, data, profile };
  } catch (err) {
    console.error("[camp-design-actions] success() failed to load data:", err);
    return fail("Action succeeded but failed to refresh data. Please reload.");
  }
}

function toAgendaDate(dateStr: string) {
  const dateOnly = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }
  return dateOnly;
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

function toActivityTimestamp(dateStr: string, timeLabel: string) {
  const parsed = parseTimeLabel(timeLabel);
  if (!parsed) {
    return null;
  }

  const dateOnly = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }

  const value = new Date(`${dateOnly}T00:00:00Z`);
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
  userId: string,
  role: AppRole,
  wardIdForRow: string | null,
) {
  const admin = createSupabaseAdminClient() as any;

  let existingRoleQuery = admin
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

  const { error } = await admin.from("user_roles").insert({
    user_id: userId,
    role,
    ward_id: wardIdForRow,
    participant_id: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function removeUserRoleRow(
  userId: string,
  role: AppRole,
  wardIdForRow: string | null,
) {
  const admin = createSupabaseAdminClient() as any;

  let deleteQuery = admin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  deleteQuery = wardIdForRow
    ? deleteQuery.eq("ward_id", wardIdForRow)
    : deleteQuery.is("ward_id", null);

  const { error } = await deleteQuery;
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveCallingId(callingName: string) {
  const normalized = callingName.trim();
  if (!normalized) {
    return null;
  }

  const admin = createSupabaseAdminClient() as any;

  const { data: existingCalling } = await admin
    .from("leader_callings")
    .select("id, name")
    .ilike("name", normalized)
    .limit(1)
    .maybeSingle();

  if (existingCalling?.id) {
    return existingCalling.id;
  }

  const { data: insertedCalling, error: insertCallingError } = await admin
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
  const phone = phoneRaw.trim() || null;

  const hasWardIdInput = Object.prototype.hasOwnProperty.call(input, "wardId");
  const wardInputValue = hasWardIdInput ? input.wardId : context.wardId;

  let wardId =
    typeof wardInputValue === "string"
      ? (wardInputValue.trim() || null)
      : null;

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

  if (shouldCompleteOnboarding) {
    const r = await completeOnboardingProfileInDb(
      supabase,
      context.user.id,
      context.user.email?.toLowerCase() ?? undefined,
      {
        displayName,
        avatarUrl: avatarRaw,
        phone,
        wardId,
        signatureName: input.signatureName,
      },
    );
    if (!r.ok) {
      return fail(r.error);
    }
    return { ok: true as const, onboardingDone: true };
  }

  const onboardingCompletedAt = context.onboardingCompletedAt ?? null;

  const profilePayload: Record<string, string | number | null> = {
    user_id: context.user.id,
    user_email: context.user.email?.toLowerCase() ?? null,
    display_name: displayName,
    avatar_url: avatarUrl,
    phone,
    ward_id: wardId,
  };

  if (input.signatureName !== undefined) {
    profilePayload.terms_accepted_at = input.signatureName?.trim()
      ? (onboardingCompletedAt ?? new Date().toISOString())
      : null;
    profilePayload.signature_name = input.signatureName?.trim() || null;
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select("user_id, display_name, onboarding_completed_at");

  if (error) {
    return fail(error.message);
  }

  return success({
    email: context.user.email ?? "",
    displayName,
    avatarUrl,
    onboardingCompletedAt,
    phone,
    wardId,
  });
}

/**
 * Second step for parent onboarding only (mirrors leader flow: profile first,
 * then a separate small write). Keeps admin young_men insert out of
 * updateMyProfileAction so the onboarding completion payload matches leaders.
 */
export async function saveParentYoungMenAction(input: {
  youngMen: YoungManInput[];
}): Promise<ActionResult> {
  const context = await getUserContext();
  const supabase = await createSupabaseServerClient();
  const r = await insertParentYoungMenInDb(supabase, context.user.id, input.youngMen ?? []);
  if (!r.ok) {
    return fail(r.error);
  }
  return { ok: true, onboardingDone: true };
}

export async function createActivityAction(
  input: ActivityInput,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to add activities.");
  }

  const startsAt = toActivityTimestamp(input.date, input.time);
  if (!startsAt || !input.title.trim()) {
    return fail("Please provide a valid title, date, and time.");
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

export async function updateActivityAction(
  id: string,
  input: ActivityInput,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to edit activities.");
  }

  const startsAt = toActivityTimestamp(input.date, input.time);
  if (!startsAt || !input.title.trim()) {
    return fail("Please provide a valid title, date, and time.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("activities")
    .update({
      title: input.title.trim(),
      category: input.category.trim() || "General",
      starts_at: startsAt,
      location: input.location.trim() || null,
      description: input.desc.trim() || null,
    })
    .eq("id", id);

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

  const agendaDate = toAgendaDate(input.date);
  if (!agendaDate || !input.time.trim() || !input.item.trim()) {
    return fail("Please provide a valid date, time, and item name.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("daily_agenda_items").insert({
    agenda_date: agendaDate,
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

export async function updateAgendaItemAction(
  id: string,
  input: AgendaInput,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to edit agenda items.");
  }

  const agendaDate = toAgendaDate(input.date);
  if (!agendaDate || !input.time.trim() || !input.item.trim()) {
    return fail("Please provide a valid date, time, and item name.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("daily_agenda_items")
    .update({
      agenda_date: agendaDate,
      time_slot: input.time.trim(),
      title: input.item.trim(),
      location: input.location.trim() || null,
    })
    .eq("id", id);

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
        leader_phone: input.leader_phone.trim() || null,
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
    .from("user_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "parent")
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
      leader_phone: input.leader_phone.trim() || null,
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

export async function completeCompetitionAction(
  competitionId: string,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageContent && !context.canAwardCompetitionPoints) {
    return fail("You do not have permission to complete competitions.");
  }

  if (!competitionId) {
    return fail("Competition is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("competitions")
    .update({ status: "completed" })
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

  if (!input.competitionId || !input.wardId) {
    return fail("Competition and ward are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: competitionRow, error: competitionError } = await supabase
    .from("competitions")
    .select("id, status")
    .eq("id", input.competitionId)
    .maybeSingle();

  if (competitionError) {
    return fail(competitionError.message);
  }
  if (!competitionRow) {
    return fail("Competition not found.");
  }
  if (competitionRow.status === "completed") {
    return fail("This competition is completed. Points can no longer be awarded.");
  }

  if (
    typeof input.points !== "number" ||
    Number.isNaN(input.points) ||
    input.points === 0 ||
    Math.abs(input.points) > 100
  ) {
    return fail("Enter a non-zero point value between -100 and 100.");
  }

  const { error } = await supabase.from("competition_points").insert({
    competition_id: input.competitionId,
    ward_id: input.wardId,
    points: input.points,
    reason: input.note.trim() || null,
    awarded_by_name: input.leader.trim() || context.displayName,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deletePointAction(pointId: string): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canAwardCompetitionPoints) {
    return fail("You do not have permission to delete points.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("competition_points")
    .delete()
    .eq("id", pointId);
  if (error) {
    return fail(error.message);
  }

  return success();
}

export { addParentAction as addRegistrationAction };

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
    .from("user_profiles")
    .select("user_id, role")
    .ilike("user_email", email)
    .limit(1)
    .maybeSingle();

  if (existing?.user_id && existing.role === "parent") {
    return fail("A parent with this email already exists.");
  }

  const admin = createSupabaseAdminClient() as any;

  // Ensure auth user + user_profiles row exists
  const { userId: authUserId } = await generateMagicLink(email);

  if (!authUserId) {
    return fail("Unable to create account for this email.");
  }

  const displayName = `${parentName.firstName} ${parentName.lastName}`;

  const { error: updateError } = await admin
    .from("user_profiles")
    .update({
      role: "parent",
      display_name: displayName,
      invited_by: context.user.id,
    })
    .eq("user_id", authUserId);

  if (updateError) {
    return fail(updateError.message);
  }

  return success();
}

export async function sendParentInviteAction(
  parentUserId: string,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageRegistrations) {
    return fail("You do not have permission to send invites.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, user_email, display_name, role, onboarding_completed_at")
    .eq("user_id", parentUserId)
    .eq("role", "parent")
    .maybeSingle();

  if (!profile?.user_id) {
    return fail("Parent not found.");
  }

  if (profile.onboarding_completed_at) {
    return fail("This parent has already completed registration.");
  }

  if (!profile.user_email) {
    return fail("Parent has no email address on file.");
  }

  const { actionLink: parentLink } = await generateMagicLink(profile.user_email);
  if (parentLink) {
    const parentName = profile.display_name?.trim() || profile.user_email.split("@")[0] || "Parent";
    const template = parentInviteEmail(parentName, parentLink);
    await sendEmail({
      to: profile.user_email,
      subject: template.subject,
      html: template.html,
    });
  }

  const admin = createSupabaseAdminClient() as any;
  await admin
    .from("user_profiles")
    .update({
      invited_at: new Date().toISOString(),
      invited_by: context.user.id,
    })
    .eq("user_id", parentUserId);

  return success();
}

export async function deleteParentAction(
  parentUserId: string,
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context.canManageRegistrations) {
    return fail("You do not have permission to delete registrations.");
  }

  if (parentUserId === context.user.id) {
    return fail("You cannot delete your own account.");
  }

  const admin = createSupabaseAdminClient() as any;

  const { data: profile, error: fetchError } = await admin
    .from("user_profiles")
    .select("user_id, role")
    .eq("user_id", parentUserId)
    .maybeSingle();

  if (fetchError || !profile?.user_id) {
    return fail(fetchError?.message ?? "Parent not found.");
  }

  if (profile.role !== "parent") {
    return fail("This row is not a parent registration.");
  }

  const { error: authError } = await admin.auth.admin.deleteUser(parentUserId);
  if (authError) {
    return fail(authError.message);
  }

  return success();
}

export async function addContactAction(input: ContactInput): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to add contacts.");
  }

  const fullName = input.name.trim();
  if (!fullName) {
    return fail("Contact name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contacts").insert({
    full_name: fullName,
    role_title: input.role.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    is_emergency: input.emergency ?? false,
  });

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteContactAction(
  contactId: string,
): Promise<ActionResult> {
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

export async function saveDailyMessageAction(
  messageDate: string,
  messageContent: { title: string; scripture: string; message: string },
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to edit daily messages.");
  }

  if (!messageContent.message.trim()) {
    return fail("Message content is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("daily_messages").upsert(
    {
      message_date: messageDate,
      title: messageContent.title.trim() || null,
      scripture: messageContent.scripture.trim() || null,
      message: messageContent.message.trim(),
    },
    { onConflict: "message_date" },
  );

  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function deleteDailyMessageAction(
  messageDate: string,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to delete daily messages.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("daily_messages")
    .delete()
    .eq("message_date", messageDate);
  if (error) {
    return fail(error.message);
  }

  return success();
}

export async function saveCampRulesAction(
  content: string,
): Promise<ActionResult> {
  const context = await requireContentManager();
  if (!context) {
    return fail("You do not have permission to edit camp rules.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("camp_rules_documents")
    .select("id")
    .limit(1)
    .maybeSingle();

  const { error } = existing?.id
    ? await supabase
        .from("camp_rules_documents")
        .update({ content: content.trim() })
        .eq("id", existing.id)
    : await supabase.from("camp_rules_documents").insert({ content: content.trim() });

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

  if (!isCampStaffRole(input.role)) {
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
    callingId = await resolveCallingId(callingName);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to save calling.");
  }

  if (!callingId) {
    return fail("Unable to save calling.");
  }

  // Ensure auth user exists (creates user_profiles row via trigger)
  const { actionLink, userId: authUserId } = await generateMagicLink(email);

  if (!authUserId) {
    return fail("Unable to create account for this email.");
  }

  const fullName = input.fullName?.trim() || null;

  const admin = createSupabaseAdminClient() as any;

  // Check if this user already has this role assigned
  const { data: existingProfile } = await admin
    .from("user_profiles")
    .select("user_id, role, onboarding_completed_at")
    .eq("user_id", authUserId)
    .maybeSingle();

  const onboardingCompleted = Boolean(existingProfile?.onboarding_completed_at);

  const updatePayload: Record<string, string | null> = {
    role: input.role,
    calling_id: callingId,
    ward_id: wardId,
    invited_by: context.user.id,
    invited_at: new Date().toISOString(),
  };

  if (fullName) {
    updatePayload.display_name = fullName;
  }

  const { error: updateError } = await admin
    .from("user_profiles")
    .update(updatePayload)
    .eq("user_id", authUserId);

  if (updateError) {
    return fail(updateError.message);
  }

  // Sync user_roles
  try {
    await ensureUserRoleRow(
      authUserId,
      input.role,
      userRolesWardIdForRole(input.role, wardId),
    );
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Unable to assign the requested role to this user.",
    );
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
  leaderUserId: string,
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
    .from("user_profiles")
    .select("user_id, role, ward_id, calling_id")
    .eq("user_id", leaderUserId)
    .maybeSingle();

  if (fetchError || !existing) {
    return fail(fetchError?.message ?? "Leader not found.");
  }

  const updates: Record<string, unknown> = {};

  if (input.role && input.role !== existing.role) {
    if (!isCampStaffRole(input.role)) {
      return fail("Invalid leadership role.");
    }
    const prevRole = existing.role as AppRole | null;
    if (prevRole && (isCampStaffRole(prevRole) || prevRole === "young_men_captain")) {
      try {
        await removeUserRoleRow(
          leaderUserId,
          prevRole,
          userRolesWardIdForRole(prevRole, existing.ward_id),
        );
      } catch {}
    }
    updates.role = input.role;
  }

  if (Object.prototype.hasOwnProperty.call(input, "wardId")) {
    const newWardId = input.wardId?.trim() || null;
    if (newWardId !== existing.ward_id) {
      if (
        existing.role &&
        (isCampStaffRole(existing.role) || existing.role === "young_men_captain")
      ) {
        try {
          await removeUserRoleRow(
            leaderUserId,
            existing.role as AppRole,
            userRolesWardIdForRole(existing.role as AppRole, existing.ward_id),
          );
        } catch {}
      }
      updates.ward_id = newWardId;
    }
  }

  const finalRole = (updates.role as string) ?? existing.role;
  const finalWardId = Object.prototype.hasOwnProperty.call(updates, "ward_id")
    ? (updates.ward_id as string | null)
    : existing.ward_id;

  if (isCampStaffRole(finalRole)) {
    await ensureUserRoleRow(
      leaderUserId,
      finalRole,
      userRolesWardIdForRole(finalRole, finalWardId),
    );
  } else if (finalRole === "young_men_captain") {
    await ensureUserRoleRow(
      leaderUserId,
      "young_men_captain",
      userRolesWardIdForRole("young_men_captain", finalWardId),
    );
  }

  if (input.calling?.trim()) {
    try {
      const callingId = await resolveCallingId(input.calling);
      if (callingId) {
        updates.calling_id = callingId;
      }
    } catch {}
  }

  if (input.displayName?.trim()) {
    updates.display_name = input.displayName.trim();
  }

  if (Object.keys(updates).length > 0) {
    const admin = createSupabaseAdminClient() as any;
    const { error: updateError } = await admin
      .from("user_profiles")
      .update(updates)
      .eq("user_id", leaderUserId);
    if (updateError) {
      return fail(updateError.message);
    }
  }

  return success();
}

export async function deleteLeaderInvitationAction(
  leaderUserId: string,
): Promise<ActionResult> {
  const context = await requireStakeAdmin();
  if (!context) {
    return fail("You do not have permission to delete invitations.");
  }

  if (leaderUserId === context.user.id) {
    return fail("You cannot delete your own account.");
  }

  const admin = createSupabaseAdminClient() as any;
  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", leaderUserId)
    .maybeSingle();

  if (profileError || !profile?.user_id) {
    return fail(profileError?.message ?? "Leader not found.");
  }

  const { error: authError } = await admin.auth.admin.deleteUser(leaderUserId);
  if (authError) {
    return fail(authError.message);
  }

  return success();
}
