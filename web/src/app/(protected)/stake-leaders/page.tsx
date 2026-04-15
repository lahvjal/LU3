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

type LeaderInvitationStatus = "pending" | "active" | "revoked";

type RelationName = { name: string } | { name: string }[] | null;

type LeaderInvitationRow = {
  id: string;
  email: string;
  user_id: string | null;
  role: string;
  ward_id: string | null;
  status: LeaderInvitationStatus;
  invited_at: string;
  accepted_at: string | null;
  calling: RelationName;
  ward: RelationName;
};

type UserProfileRow = {
  user_id: string;
  user_email: string | null;
  display_name: string | null;
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

function normalizeLeaderStatus(value: string): LeaderInvitationStatus {
  if (value === "active" || value === "revoked") {
    return value;
  }

  return "pending";
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

  const [{ data: wardRows }, { data: callingRows }, { data: invitationRows }] =
    await Promise.all([
      supabase.from("wards").select("id, name").order("name"),
      supabase.from("leader_callings").select("id, name").order("name"),
      supabase
        .from("leader_invitations")
        .select(
          "id, email, user_id, role, ward_id, status, invited_at, accepted_at, calling:leader_callings(name), ward:wards(name)",
        )
        .order("invited_at", { ascending: false }),
    ]);

  const wards = (wardRows ?? []) as WardRow[];
  const callingCatalog = (callingRows ?? []) as LeaderCallingRow[];
  const invitations = (invitationRows ?? []) as LeaderInvitationRow[];

  const wardNameById = new Map<string, string>(wards.map((ward) => [ward.id, ward.name]));

  const invitedUserIds = [
    ...new Set(
      invitations
        .map((invitation) => invitation.user_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];

  const profileRows = invitedUserIds.length
    ? (
        (
          await supabase
            .from("user_profiles")
            .select("user_id, user_email, display_name")
            .in("user_id", invitedUserIds)
        ).data ?? []
      ) as UserProfileRow[]
    : [];

  const userProfileById = new Map<string, UserProfileRow>(
    profileRows.map((profile) => [profile.user_id, profile]),
  );

  const initialInvitations = invitations.map((invitation) => {
    const role = normalizeLeaderRole(invitation.role);
    const profile = invitation.user_id
      ? userProfileById.get(invitation.user_id) ?? null
      : null;
    const email = (invitation.email || profile?.user_email || "").trim().toLowerCase();
    const wardName =
      resolveRelationName(invitation.ward) ||
      (invitation.ward_id ? (wardNameById.get(invitation.ward_id) ?? "") : "");
    const callingName = resolveRelationName(invitation.calling) || "Leader";

    return {
      invitationId: invitation.id,
      email,
      displayName: profile?.display_name?.trim() || fallbackDisplayName(email),
      role,
      roleLabel: LEADER_ROLE_LABELS[role],
      wardId: invitation.ward_id,
      wardName,
      calling: callingName,
      status: normalizeLeaderStatus(invitation.status),
      invitedAt: invitation.invited_at,
      acceptedAt: invitation.accepted_at,
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
