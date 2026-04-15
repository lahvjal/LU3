import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee"
  | "young_men_captain"
  | "young_man";

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
  quorum_id: string | null;
  medical_notes: string | null;
  shirt_size_code: string | null;
  age: number | null;
  onboarding_completed_at: string | null;
};

const roleLabelMap: Record<AppRole, string> = {
  stake_leader: "Stake Leader",
  stake_camp_director: "Stake Camp Director",
  ward_leader: "Unit Leader",
  camp_committee: "Camp Committee",
  young_men_captain: "Young Men Captain",
  young_man: "Camper",
};

export type UserContext = {
  user: User;
  displayName: string;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
  phone: string | null;
  wardId: string | null;
  quorumId: string | null;
  medicalNotes: string | null;
  shirtSizeCode: string | null;
  age: number | null;
  roles: UserRoleRow[];
  roleLabels: string[];
  wardIds: string[];
  managedWardIds: string[];
  isStakeAdmin: boolean;
  canManageContent: boolean;
  canManageUnits: boolean;
  canManageRegistrations: boolean;
  canAwardCompetitionPoints: boolean;
  isCamper: boolean;
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

  const roles = (roleRows ?? []) as UserRoleRow[];
  const roleSet = new Set<AppRole>(roles.map((role) => role.role));
  const wardIds = [...new Set(roles.map((role) => role.ward_id).filter(Boolean))] as string[];

  const isStakeAdmin =
    roleSet.has("stake_leader") || roleSet.has("stake_camp_director");
  const canManageContent = isStakeAdmin || roleSet.has("camp_committee");
  const canManageUnits = isStakeAdmin || roleSet.has("ward_leader");
  const canManageRegistrations =
    canManageContent ||
    roleSet.has("ward_leader") ||
    roleSet.has("young_men_captain");
  const isCamper = roleSet.has("young_man");

  let displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "User";
  let avatarUrl: string | null = null;
  let onboardingCompletedAt: string | null = null;
  let phone: string | null = null;
  let wardId: string | null = null;
  let quorumId: string | null = null;
  let medicalNotes: string | null = null;
  let shirtSizeCode: string | null = null;
  let age: number | null = null;

  const { data: profileRowRaw } = await supabase
    .from("user_profiles")
    .select(
      "display_name, avatar_url, onboarding_completed_at, phone, ward_id, quorum_id, medical_notes, shirt_size_code, age",
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
    quorumId = profileRow.quorum_id ?? null;
    medicalNotes = profileRow.medical_notes ?? null;
    shirtSizeCode = profileRow.shirt_size_code ?? null;
    age = profileRow.age ?? null;
  }

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

  return {
    user,
    displayName,
    avatarUrl,
    onboardingCompletedAt,
    phone,
    wardId,
    quorumId,
    medicalNotes,
    shirtSizeCode,
    age,
    roles,
    roleLabels: roles.map((role) => roleLabelMap[role.role] ?? role.role),
    wardIds,
    managedWardIds,
    isStakeAdmin,
    canManageContent,
    canManageUnits,
    canManageRegistrations,
    canAwardCompetitionPoints: isStakeAdmin || isCompetitionStaff,
    isCamper,
  };
}
