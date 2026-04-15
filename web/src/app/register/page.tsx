import { getUserContext } from "@/lib/auth/user-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RegisterDesignPage from "./register-design-page";

type WardRow = {
  id: string;
  name: string;
};

type ShirtSizeRow = {
  code: string;
  label: string;
};

type RosterViewRow = {
  roster_id: string;
  participant_id: string;
  ward_id: string;
  ward_name: string;
  status:
    | "not_invited_yet"
    | "invited"
    | "pending"
    | "confirmed"
    | "declined"
    | "waitlist"
    | "cancelled";
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  youth_email: string | null;
  preferred_parent_email: string | null;
  parent_guardian_name: string | null;
  parent_guardian_phone: string | null;
  contact_route: "parent_email" | "youth_email";
  latest_invite_target: "youth" | "parent" | null;
  latest_invite_email: string | null;
  latest_invite_status: "sent" | "accepted" | "revoked" | null;
  latest_invite_sent_at: string | null;
};

type ParticipantProfileRow = {
  id: string;
  birth_date: string | null;
  shirt_size_code: string | null;
};

function birthDateToAge(value: string | null) {
  if (!value) {
    return null;
  }

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

export default async function RegisterPage() {
  const [userContext, supabase] = await Promise.all([
    getUserContext({ requireAuth: false }),
    createSupabaseServerClient(),
  ]);
  const canManageRegistrations = Boolean(userContext?.canManageRegistrations);

  const { data: wardRows } = await supabase.from("wards").select("id, name").order("name");
  const wards = (wardRows ?? []) as WardRow[];
  const { data: shirtSizeRows } = await supabase
    .from("shirt_sizes")
    .select("code, label")
    .order("sort_order");
  const shirtSizes = (shirtSizeRows ?? []) as ShirtSizeRow[];

  const rosterRows = canManageRegistrations
    ? (
        (
          await supabase
            .from("v_registration_roster")
            .select(
              "roster_id, participant_id, ward_id, ward_name, status, first_name, last_name, preferred_name, youth_email, preferred_parent_email, parent_guardian_name, parent_guardian_phone, contact_route, latest_invite_target, latest_invite_email, latest_invite_status, latest_invite_sent_at",
            )
            .order("ward_name")
            .order("last_name")
            .order("first_name")
        ).data ?? []
      ) as RosterViewRow[]
    : [];

  const participantIds = rosterRows.map((row) => row.participant_id);
  const participantRows = participantIds.length
    ? (
        (
          await supabase
            .from("participants")
            .select("id, birth_date, shirt_size_code")
            .in("id", participantIds)
        ).data ?? []
      ) as ParticipantProfileRow[]
    : [];

  const participantProfileById = new Map(
    participantRows.map((row) => [row.id, row]),
  );

  const initialRoster = rosterRows.map((row) => ({
    rosterId: row.roster_id,
    participantId: row.participant_id,
    wardId: row.ward_id,
    wardName: row.ward_name,
    status: row.status,
    fullName: `${row.preferred_name || row.first_name} ${row.last_name}`,
    age: birthDateToAge(
      participantProfileById.get(row.participant_id)?.birth_date ?? null,
    ),
    shirtSize: participantProfileById.get(row.participant_id)?.shirt_size_code ?? null,
    youthEmail: row.youth_email,
    preferredParentEmail: row.preferred_parent_email,
    parentName: row.parent_guardian_name,
    parentPhone: row.parent_guardian_phone,
    contactRoute: row.contact_route,
    latestInviteTarget: row.latest_invite_target,
    latestInviteEmail: row.latest_invite_email,
    latestInviteStatus: row.latest_invite_status,
    latestInviteSentAt: row.latest_invite_sent_at,
  }));

  return (
    <RegisterDesignPage
      initialRoster={initialRoster}
      initialWards={wards}
      initialShirtSizes={shirtSizes}
      canManageRegistrations={canManageRegistrations}
      canReorderColumns={Boolean(userContext?.isStakeAdmin)}
      initialProfile={{
        displayName: userContext?.displayName ?? "Guest",
        email: userContext?.user.email ?? "",
        avatarUrl: userContext?.avatarUrl ?? null,
      }}
    />
  );
}
