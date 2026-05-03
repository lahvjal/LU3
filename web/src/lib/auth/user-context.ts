import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  YOUTH_SESSION_COOKIE,
  verifyYouthSessionToken,
} from "@/lib/auth/youth-session";

export type AppRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee"
  | "young_men_captain"
  | "young_man"
  | "parent";

export type UserRoleRow = {
  role: AppRole;
  ward_id: string | null;
  participant_id: string | null;
};

type UserProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  ward_id: string | null;
  role: AppRole | null;
  calling_id: string | null;
  invited_by: string | null;
  invited_at: string | null;
  terms_accepted_at: string | null;
  signature_name: string | null;
  onboarding_completed_at: string | null;
  parent_onboarding_snoozed_at: string | null;
};

const roleLabelMap: Record<AppRole, string> = {
  stake_leader: "Stake Leader",
  stake_camp_director: "Stake Camp Director",
  ward_leader: "Unit Leader",
  camp_committee: "Camp Committee",
  young_men_captain: "Young Men Captain",
  young_man: "Camper",
  parent: "Parent",
};

/**
 * Camp staff (`user_roles`) — only these grant leader UI and registration tools.
 * Parents, campers, and young men captains use `parent` / `young_man` / `young_men_captain` and never match here.
 */
const CAMP_STAFF_ROLE_SET = new Set<AppRole>([
  "stake_leader",
  "stake_camp_director",
  "camp_committee",
  "ward_leader",
]);

export type UserContext = {
  user: User;
  displayName: string;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
  phone: string | null;
  wardId: string | null;
  profileRole: AppRole | null;
  callingId: string | null;
  termsAcceptedAt: string | null;
  signatureName: string | null;
  roles: UserRoleRow[];
  roleLabels: string[];
  wardIds: string[];
  managedWardIds: string[];
  isLeader: boolean;
  isStakeAdmin: boolean;
  canManageContent: boolean;
  canManageUnits: boolean;
  canManageRegistrations: boolean;
  canAwardCompetitionPoints: boolean;
  isCamper: boolean;
  parentOnboardingSnoozedAt: string | null;
  actingAsYouth: boolean;
  actingYouthName: string | null;
  actingYouthId: string | null;
  inviteType: "leader" | "youth" | "parent" | null;
};

type GetUserContextOptions = {
  requireAuth?: boolean;
};

export async function getUserContext(
  options?: { requireAuth?: true },
): Promise<UserContext>;
export async function getUserContext(
  options: { requireAuth: false },
): Promise<UserContext | null>;
export async function getUserContext(
  options: GetUserContextOptions = {},
): Promise<UserContext | null> {
  const { requireAuth = true } = options;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (requireAuth) {
      redirect("/login");
    }

    return null;
  }

  const [{ data: roleRows }, { data: profileRowRaw }, { data: contactRows }] =
    await Promise.all([
      supabase
        .from("user_roles")
        .select("role, ward_id, participant_id")
        .eq("user_id", user.id)
        .order("role"),
      supabase
        .from("user_profiles")
        .select(
          "display_name, avatar_url, onboarding_completed_at, phone, ward_id, role, calling_id, invited_by, invited_at, terms_accepted_at, signature_name, parent_onboarding_snoozed_at",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      user.email
        ? supabase
            .from("contacts")
            .select("id")
            .eq("is_emergency", false)
            .ilike("email", user.email)
            .limit(1)
        : Promise.resolve({ data: null, error: null }),
    ]);

  const roles: UserRoleRow[] = (roleRows ?? []) as UserRoleRow[];
  const roleSet = new Set<AppRole>(roles.map((role) => role.role));
  const wardIds: string[] = [...new Set(roles.map((role) => role.ward_id).filter(Boolean))] as string[];
  const profileRow = profileRowRaw as UserProfileRow | null;
  const isCompetitionStaff = (contactRows?.length ?? 0) > 0;
  const cookieStore = await cookies();
  const youthSession = verifyYouthSessionToken(
    cookieStore.get(YOUTH_SESSION_COOKIE)?.value,
  );

  let displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "User";
  let avatarUrl: string | null = null;
  let onboardingCompletedAt: string | null = null;
  let phone: string | null = null;
  let wardId: string | null = null;
  let profileRole: AppRole | null = null;
  let callingId: string | null = null;
  let termsAcceptedAt: string | null = null;
  let signatureName: string | null = null;
  let parentOnboardingSnoozedAt: string | null = null;

  if (profileRow) {
    if (profileRow.display_name?.trim()) {
      displayName = profileRow.display_name.trim();
    }
    avatarUrl = profileRow.avatar_url ?? null;
    onboardingCompletedAt = profileRow.onboarding_completed_at ?? null;
    phone = profileRow.phone ?? null;
    wardId = profileRow.ward_id ?? null;
    profileRole = profileRow.role ?? null;
    callingId = profileRow.calling_id ?? null;
    termsAcceptedAt = profileRow.terms_accepted_at ?? null;
    signatureName = profileRow.signature_name ?? null;
    parentOnboardingSnoozedAt = profileRow.parent_onboarding_snoozed_at ?? null;
  }

  const isStakeAdmin =
    roleSet.has("stake_leader") || roleSet.has("stake_camp_director");
  const canManageContent = isStakeAdmin || roleSet.has("camp_committee");
  const canManageUnits = isStakeAdmin || roleSet.has("ward_leader");
  const canManageRegistrations = canManageContent || roleSet.has("ward_leader");
  const isLeader = roles.some((row) => CAMP_STAFF_ROLE_SET.has(row.role));
  const isCamper =
    roleSet.has("young_man") || roleSet.has("young_men_captain");
  let actingAsYouth = false;
  let actingYouthName: string | null = null;
  let actingYouthId: string | null = null;

  const managedWardIds = isStakeAdmin
    ? wardIds
    : ([
        ...new Set(
          roles
            .filter((role) => role.role === "ward_leader")
            .map((role) => role.ward_id)
            .filter(Boolean),
        ),
      ] as string[]);

  let inviteType: "leader" | "youth" | "parent" | null = null;
  if (!onboardingCompletedAt) {
    const { data: inviteResult } = await supabase.rpc("detect_user_invite_type");
    if (typeof inviteResult === "string") {
      inviteType = inviteResult as "leader" | "youth" | "parent";
    }
  }

  if (youthSession && youthSession.userId === user.id) {
    const { data: youthRow } = await supabase
      .from("young_men")
      .select("id, first_name, last_name, parent_id")
      .eq("id", youthSession.youngManId)
      .eq("parent_id", user.id)
      .maybeSingle();
    if (youthRow?.id) {
      actingAsYouth = true;
      actingYouthId = youthRow.id;
      actingYouthName =
        `${youthRow.first_name ?? ""} ${youthRow.last_name ?? ""}`.trim() || "Youth";
      displayName = actingYouthName;
      // Youth mode hard-blocks leadership capabilities even on leader accounts.
      inviteType = "youth";
    }
  }

  const effectiveIsStakeAdmin = actingAsYouth ? false : isStakeAdmin;
  const effectiveCanManageContent = actingAsYouth ? false : canManageContent;
  const effectiveCanManageUnits = actingAsYouth ? false : canManageUnits;
  const effectiveCanManageRegistrations = actingAsYouth
    ? false
    : canManageRegistrations;
  const effectiveIsLeader = actingAsYouth ? false : isLeader;
  const effectiveCanAwardCompetitionPoints = actingAsYouth ? false : isLeader;
  const effectiveIsCamper = actingAsYouth ? true : isCamper;
  const effectiveRoleLabels = actingAsYouth
    ? ["Youth Session"]
    : roles.map((role) => roleLabelMap[role.role] ?? role.role);

  return {
    user,
    displayName,
    avatarUrl,
    onboardingCompletedAt,
    phone,
    wardId,
    profileRole,
    callingId,
    termsAcceptedAt,
    signatureName,
    roles,
    roleLabels: effectiveRoleLabels,
    wardIds,
    managedWardIds,
    isLeader: effectiveIsLeader,
    isStakeAdmin: effectiveIsStakeAdmin,
    canManageContent: effectiveCanManageContent,
    canManageUnits: effectiveCanManageUnits,
    canManageRegistrations: effectiveCanManageRegistrations,
    canAwardCompetitionPoints: effectiveCanAwardCompetitionPoints,
    isCamper: effectiveIsCamper,
    parentOnboardingSnoozedAt,
    actingAsYouth,
    actingYouthName,
    actingYouthId,
    inviteType,
  };
}
