import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role, ward_id, participant_id")
    .order("role");

  const roles: UserRoleRow[] = (roleRows ?? []) as UserRoleRow[];
  const roleSet = new Set<AppRole>(roles.map((role) => role.role));
  const wardIds: string[] = [...new Set(roles.map((role) => role.ward_id).filter(Boolean))] as string[];

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

  const { data: profileRowRaw } = await supabase
    .from("user_profiles")
    .select(
      "display_name, avatar_url, onboarding_completed_at, phone, ward_id, role, calling_id, invited_by, invited_at, terms_accepted_at, signature_name",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const profileRow = profileRowRaw as UserProfileRow | null;

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
  }

  let isCompetitionStaff = false;
  if (user.email) {
    const { data: contactRows, error } = await supabase
      .from("contacts")
      .select("id")
      .eq("is_emergency", false)
      .ilike("email", user.email)
      .limit(1);

    if (!error && contactRows && contactRows.length > 0) {
      isCompetitionStaff = true;
    }
  }

  const isStakeAdmin =
    roleSet.has("stake_leader") || roleSet.has("stake_camp_director");
  const canManageContent = isStakeAdmin || roleSet.has("camp_committee");
  const canManageUnits = isStakeAdmin || roleSet.has("ward_leader");
  const canManageRegistrations =
    canManageContent ||
    roleSet.has("ward_leader") ||
    roleSet.has("young_men_captain");
  const isLeader = canManageRegistrations;
  const isCamper = roleSet.has("young_man");

  const managedWardIds = isStakeAdmin
    ? wardIds
    : ([
        ...new Set(
          roles
            .filter(
              (role) =>
                role.role === "ward_leader" || role.role === "young_men_captain",
            )
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
    roleLabels: roles.map((role) => roleLabelMap[role.role] ?? role.role),
    wardIds,
    managedWardIds,
    isLeader,
    isStakeAdmin,
    canManageContent,
    canManageUnits,
    canManageRegistrations,
    canAwardCompetitionPoints: isStakeAdmin || isCompetitionStaff,
    isCamper,
    inviteType,
  };
}
