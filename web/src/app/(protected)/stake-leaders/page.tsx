import { getUserContext } from "@/lib/auth/user-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StakeLeadersDesignPage from "./stake-leaders-design-page";

type WardRow = {
  id: string;
  name: string;
};

type LeaderCallingRow = {
  id: string;
  name: string;
};

type LeaderInvitationRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee"
  | "young_men_captain";

type RelationName = { name: string } | { name: string }[] | null;

type LeaderProfileRow = {
  user_id: string;
  user_email: string | null;
  display_name: string | null;
  role: string;
  ward_id: string | null;
  onboarding_completed_at: string | null;
  invited_at: string | null;
  calling: RelationName;
  ward: RelationName;
};

const LEADER_ROLE_LABELS: Record<LeaderInvitationRole, string> = {
  stake_leader: "Stake Leader",
  stake_camp_director: "Stake Camp Director",
  ward_leader: "Ward Leader",
  camp_committee: "Camp Committee",
  young_men_captain: "Young Men Captain",
};

const LEADER_ROLE_VALUES = new Set<LeaderInvitationRole>(
  Object.keys(LEADER_ROLE_LABELS) as LeaderInvitationRole[],
);

function resolveRelationName(value: RelationName): string {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value[0]?.name ?? "";
  }

  return value.name ?? "";
}

function normalizeLeaderRole(value: string): LeaderInvitationRole {
  if (LEADER_ROLE_VALUES.has(value as LeaderInvitationRole)) {
    return value as LeaderInvitationRole;
  }

  return "ward_leader";
}

function fallbackDisplayName(email: string): string {
  const base = email.split("@")[0]?.trim();
  return base || "Pending User";
}

export default async function StakeLeadersRoutePage() {
  const [userContext, supabase] = await Promise.all([
    getUserContext(),
    createSupabaseServerClient(),
  ]);

  const [{ data: wardRows }, { data: callingRows }, { data: leaderRows }] =
    await Promise.all([
      supabase.from("wards").select("id, name").order("name"),
      supabase.from("leader_callings").select("id, name").order("name"),
      supabase
        .from("user_profiles")
        .select(
          "user_id, user_email, display_name, role, ward_id, onboarding_completed_at, invited_at, calling:leader_callings(name), ward:wards(name)",
        )
        .not("role", "is", null)
        .not("role", "in", "(parent,young_man)")
        .order("invited_at", { ascending: false }),
    ]);

  const wards = (wardRows ?? []) as WardRow[];
  const callingCatalog = (callingRows ?? []) as LeaderCallingRow[];
  const leaderProfiles = (leaderRows ?? []) as LeaderProfileRow[];

  const wardNameById = new Map<string, string>(wards.map((ward) => [ward.id, ward.name]));

  const initialInvitations = leaderProfiles.map((profile) => {
    const role = normalizeLeaderRole(profile.role);
    const onboardingCompleted = Boolean(profile.onboarding_completed_at);
    const effectiveStatus: "active" | "pending" = onboardingCompleted ? "active" : "pending";
    const email = (profile.user_email || "").trim().toLowerCase();
    const wardName =
      resolveRelationName(profile.ward) ||
      (profile.ward_id ? (wardNameById.get(profile.ward_id) ?? "") : "");
    const callingName = resolveRelationName(profile.calling) || "Leader";

    return {
      invitationId: profile.user_id,
      email,
      displayName: profile.display_name?.trim() || fallbackDisplayName(email),
      role,
      roleLabel: LEADER_ROLE_LABELS[role],
      wardId: profile.ward_id,
      wardName,
      calling: callingName,
      status: effectiveStatus,
      invitedAt: profile.invited_at,
      acceptedAt:
        effectiveStatus === "active" ? (profile.onboarding_completed_at ?? null) : null,
      onboardingCompleted,
    };
  });

  const initialCallingOptions = Array.from(
    new Set(
      [...callingCatalog.map((calling) => calling.name), ...initialInvitations.map((row) => row.calling)]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return (
    <StakeLeadersDesignPage
      initialInvitations={initialInvitations}
      initialWards={wards}
      initialCallingOptions={initialCallingOptions}
      canManageLeaders={userContext.isStakeAdmin}
      initialProfile={{
        displayName: userContext.displayName,
        email: userContext.user.email ?? "",
        avatarUrl: userContext.avatarUrl,
      }}
    />
  );
}
