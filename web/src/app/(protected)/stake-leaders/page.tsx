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
  onboarding_completed_at: string | null;
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
  const invitationEmails = [
    ...new Set(
      invitations
        .map((invitation) => invitation.email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  const [profileRowsByUserId, profileRowsByEmail] = await Promise.all([
    invitedUserIds.length
      ? (
          (
            await supabase
              .from("user_profiles")
              .select("user_id, user_email, display_name, onboarding_completed_at")
              .in("user_id", invitedUserIds)
          ).data ?? []
        ) as UserProfileRow[]
      : [],
    invitationEmails.length
      ? (
          (
            await supabase
              .from("user_profiles")
              .select("user_id, user_email, display_name, onboarding_completed_at")
              .in("user_email", invitationEmails)
          ).data ?? []
        ) as UserProfileRow[]
      : [],
  ]);
  const profileRows = [...profileRowsByUserId, ...profileRowsByEmail];

  const userProfileById = new Map<string, UserProfileRow>(
    profileRows.map((profile) => [profile.user_id, profile]),
  );
  const userProfileByEmail = new Map<string, UserProfileRow>(
    profileRows
      .filter((profile): profile is UserProfileRow & { user_email: string } => Boolean(profile.user_email))
      .map((profile) => [profile.user_email.trim().toLowerCase(), profile]),
  );

  const initialInvitations = invitations.map((invitation) => {
    const role = normalizeLeaderRole(invitation.role);
    const storedStatus = normalizeLeaderStatus(invitation.status);
    const profileById = invitation.user_id
      ? userProfileById.get(invitation.user_id) ?? null
      : null;
    const inviteEmail = (invitation.email || profileById?.user_email || "").trim().toLowerCase();
    const profileByEmail = userProfileByEmail.get(inviteEmail) ?? null;
    const profile = profileById ?? profileByEmail;
    const onboardingCompleted = Boolean(profile?.onboarding_completed_at);
    const effectiveStatus =
      onboardingCompleted && storedStatus === "pending" ? "active" : storedStatus;
    const email = inviteEmail;
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
      status: effectiveStatus,
      invitedAt: invitation.invited_at,
      acceptedAt:
        invitation.accepted_at ??
        (effectiveStatus === "active" ? (profile?.onboarding_completed_at ?? null) : null),
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
