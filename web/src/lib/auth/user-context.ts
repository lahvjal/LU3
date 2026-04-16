import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  if (onboardingCompletedAt && roles.length === 0 && user.email) {
    try {
      const admin = createSupabaseAdminClient() as any;
      const normalizedEmail = user.email.trim().toLowerCase();
      const { data: pendingInvites } = await admin
        .from("leaders")
        .select("id, role, ward_id")
        .ilike("email", normalizedEmail)
        .eq("status", "pending");

      if (pendingInvites && pendingInvites.length > 0) {
        for (const inv of pendingInvites as Array<{ id: string; role: string; ward_id: string | null }>) {
          const roleValue = inv.role as AppRole;
          if (roleValue === "young_man") continue;

          await admin.from("user_roles").upsert(
            {
              user_id: user.id,
              role: roleValue,
              ward_id: inv.ward_id ?? null,
              participant_id: null,
            },
            { onConflict: "user_id,role,ward_id" },
          );

          await admin
            .from("leaders")
            .update({
              user_id: user.id,
              status: "active",
              accepted_at: onboardingCompletedAt,
            })
            .eq("id", inv.id);
        }

        const { data: refreshedRoles } = await supabase
          .from("user_roles")
          .select("role, ward_id, participant_id")
          .order("role");

        if (refreshedRoles && refreshedRoles.length > 0) {
          roles.length = 0;
          roles.push(...(refreshedRoles as UserRoleRow[]));
          roleSet.clear();
          roles.forEach((r) => roleSet.add(r.role));
          wardIds.length = 0;
          wardIds.push(
            ...([...new Set(roles.map((r) => r.ward_id).filter(Boolean))] as string[]),
          );
        }
      }
    } catch (err) {
      console.error("Fallback leader sync failed:", err);
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
    quorumId,
    medicalNotes,
    shirtSizeCode,
    age,
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
