import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type WardRow = {
  id: string;
  name: string;
  theme_color: string | null;
  leader_name: string | null;
  leader_email: string | null;
};

type CampUnitRow = {
  id: string;
  name: string;
  color: string | null;
  leader_name: string | null;
  leader_email: string | null;
};

type CampUnitMemberRow = {
  id: string;
  unit_id: string;
  participant_id: string;
};

type QuorumRow = {
  id: string;
  ward_id: string;
  display_name: string;
  quorum_type: string;
};

type ShirtSizeRow = {
  code: string;
  label: string;
  sort_order: number;
};

type ParticipantRow = {
  id: string;
  ward_id: string;
  first_name: string;
  last_name: string;
};

type ActivityRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starts_at: string;
  location: string | null;
};

type CompetitionRow = {
  id: string;
  name: string;
  rules: string | null;
  status: string;
};

type CompetitionPointRow = {
  id: string;
  competition_id: string;
  ward_id: string | null;
  unit_id: string | null;
  points: number;
  reason: string | null;
  awarded_at: string;
  awarded_by_name: string | null;
};

type ParentRow = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  ward_id: string | null;
  registration_status: "not_invited_yet" | "pending" | "active";
  invite_status: "not_sent" | "sent" | "accepted";
  terms_accepted_at: string | null;
  onboarding_completed_at: string | null;
  invited_at: string | null;
  created_at: string;
};

type YoungManRow = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  age: number;
  photo_url: string | null;
  shirt_size_code: string | null;
  allergies: string | null;
  medical_notes: string | null;
};

type AgendaRow = {
  id: string;
  agenda_date: string;
  time_slot: string;
  title: string;
  location: string | null;
};

type ContactRow = {
  id: string;
  full_name: string;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  is_emergency: boolean;
};

type LeaderCallingRow = {
  id: string;
  name: string;
};

type LeaderInvitationRow = {
  id: string;
  email: string;
  user_id: string | null;
  role: string;
  ward_id: string | null;
  status: "pending" | "active" | "revoked";
  invited_at: string;
  accepted_at: string | null;
  calling: { name: string } | { name: string }[] | null;
  ward: { name: string } | { name: string }[] | null;
};

type DailyMessageRow = {
  id: string;
  message_date: string;
  title: string | null;
  scripture: string | null;
  message: string;
};

type RulesRow = {
  content: string;
};

type PhotoRow = {
  id: string;
  image_url: string;
  caption: string | null;
  captured_on: string | null;
};

type DocumentationRow = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

type UserProfileRow = {
  user_id: string;
  user_email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  ward_id: string | null;
  quorum_id: string | null;
  medical_notes: string | null;
  shirt_size_code: string | null;
  age: number | null;
};

type DesignUnit = {
  id: string;
  name: string;
  color: string;
  leader: string;
  leader_email: string;
  campers: Array<{ id: string; name: string }>;
};

type DesignWard = {
  id: string;
  name: string;
  leader: string;
  leader_email: string;
  campers: Array<{ id: string; name: string }>;
};

type DesignActivity = {
  id: string;
  title: string;
  category: string;
  day: number;
  time: string;
  location: string;
  desc: string;
};

type DesignCompetition = {
  id: string;
  name: string;
  rules: string;
  status: "upcoming" | "active" | "completed";
};

type DesignPoint = {
  id: string;
  compId: string;
  unitId: string;
  points: number;
  note: string;
  leader: string;
  timestamp: string;
};

type DesignRegistrationYoungMan = {
  id: string;
  name: string;
  age: number;
  shirtSize: string;
  allergies: string;
  medical: string;
};

type DesignRegistration = {
  id: string;
  parentName: string;
  email: string;
  phone: string;
  wardId: string | null;
  wardName: string;
  registrationStatus: "not_invited_yet" | "pending" | "active";
  inviteStatus: "not_sent" | "sent" | "accepted";
  invitedAt: string | null;
  youngMen: DesignRegistrationYoungMan[];
};

type DesignAgendaItem = {
  id: string;
  time: string;
  item: string;
  location: string;
};

type DesignContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  emergency: boolean;
};

type DesignLeader = {
  id: string;
  name: string;
  calling: string;
  email: string;
  role: string;
  role_label: string;
  ward_id: string | null;
  ward_name: string;
  status: "pending" | "active" | "revoked";
  invitation_id: string | null;
  invite_sent_at: string | null;
  invite_accepted_at: string | null;
};

type DesignInspiration = {
  day: number;
  title: string;
  verse: string;
  ref: string;
};

type DesignPhoto = {
  id: string;
  image_url: string;
  caption: string;
  captured_on: string;
};

type DesignDoc = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

type DesignUserProfile = {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
};

type DesignProfileWardOption = {
  id: string;
  name: string;
};

type DesignProfileQuorumOption = {
  id: string;
  ward_id: string;
  name: string;
};

type DesignProfileShirtSizeOption = {
  code: string;
  label: string;
};

type DesignProfileOptions = {
  wards: DesignProfileWardOption[];
  quorums: DesignProfileQuorumOption[];
  shirtSizes: DesignProfileShirtSizeOption[];
};

export type CampDesignInitialData = {
  units: DesignUnit[];
  wards: DesignWard[];
  activities: DesignActivity[];
  competitions: DesignCompetition[];
  pointLog: DesignPoint[];
  registrations: DesignRegistration[];
  agenda: Record<number, DesignAgendaItem[]>;
  contacts: DesignContact[];
  leaders: DesignLeader[];
  inspiration: DesignInspiration[];
  rules: string[];
  photos: DesignPhoto[];
  docs: DesignDoc[];
  userProfiles: DesignUserProfile[];
  leaderCallingOptions: string[];
  profileOptions: DesignProfileOptions;
};

const CAMP_START_DATE = new Date("2026-06-15T00:00:00Z");
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FALLBACK_UNIT_COLORS = [
  "#6b9e6b",
  "#6b8eb0",
  "#d4915e",
  "#9a7eb8",
  "#c4a84e",
  "#6bb0a0",
  "#c46b5e",
];

const SHIRT_CODE_TO_DISPLAY: Record<string, string> = {
  YS: "YS",
  YM: "YM",
  YL: "YL",
  AS: "S",
  AM: "M",
  AL: "L",
  AXL: "XL",
  A2XL: "2XL",
  A3XL: "3XL",
};

const LEADER_ROLE_LABELS: Record<string, string> = {
  stake_leader: "Stake Leader",
  stake_camp_director: "Stake Camp Director",
  ward_leader: "Ward Leader",
  camp_committee: "Camp Committee",
  young_men_captain: "Young Men Captain",
};

function toDayIndex(value: string) {
  const dateOnly = value.slice(0, 10);
  const valueDate = new Date(`${dateOnly}T00:00:00Z`);
  return Math.max(
    0,
    Math.floor((valueDate.getTime() - CAMP_START_DATE.getTime()) / MS_PER_DAY),
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeCompetitionStatus(value: string): "upcoming" | "active" | "completed" {
  if (value === "active" || value === "completed") {
    return value;
  }
  return "upcoming";
}

function resolveWardName(
  ward: { name: string } | { name: string }[] | null,
): string {
  if (!ward) {
    return "";
  }

  if (Array.isArray(ward)) {
    return ward[0]?.name ?? "";
  }

  return ward.name;
}

function resolveRelationName(
  value: { name: string } | { name: string }[] | null,
): string {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value[0]?.name ?? "";
  }

  return value.name;
}

function normalizeLeaderStatus(value: string): "pending" | "active" | "revoked" {
  if (value === "active" || value === "revoked") {
    return value;
  }
  return "pending";
}

function parseRules(content: string | null) {
  if (!content) {
    return [];
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, ""));
}

export async function getCampDesignInitialData(): Promise<CampDesignInitialData> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: wardRows },
    { data: campUnitRows },
    { data: campUnitMemberRows },
    { data: quorumRows },
    { data: shirtSizeRows },
    { data: participantRows },
    { data: activityRows },
    { data: competitionRows },
    { data: pointRows },
    { data: parentRows },
    { data: youngManRows },
    { data: agendaRows },
    { data: contactRows },
    { data: leaderInvitationRows },
    { data: leaderCallingRows },
    { data: messageRows },
    { data: rulesRows },
    { data: photoRows },
    { data: docRows },
    { data: userProfileRows },
  ] = await Promise.all([
    supabase
      .from("wards")
      .select("id, name, theme_color, leader_name, leader_email")
      .order("created_at"),
    supabase
      .from("camp_units")
      .select("id, name, color, leader_name, leader_email")
      .order("created_at"),
    supabase
      .from("camp_unit_members")
      .select("id, unit_id, participant_id")
      .order("created_at"),
    supabase
      .from("quorums")
      .select("id, ward_id, display_name, quorum_type")
      .order("display_name"),
    supabase
      .from("shirt_sizes")
      .select("code, label, sort_order")
      .order("sort_order"),
    supabase
      .from("participants")
      .select("id, ward_id, first_name, last_name")
      .order("created_at"),
    supabase
      .from("activities")
      .select("id, title, description, category, starts_at, location")
      .order("starts_at"),
    supabase
      .from("competitions")
      .select("id, name, rules, status")
      .order("competition_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("competition_points")
      .select(
        "id, competition_id, ward_id, unit_id, points, reason, awarded_at, awarded_by_name",
      )
      .order("awarded_at"),
    supabase
      .from("parents")
      .select(
        "id, user_id, first_name, last_name, email, phone, ward_id, registration_status, invite_status, terms_accepted_at, onboarding_completed_at, invited_at, created_at",
      )
      .order("created_at"),
    supabase
      .from("young_men")
      .select(
        "id, parent_id, first_name, last_name, age, photo_url, shirt_size_code, allergies, medical_notes",
      )
      .order("created_at"),
    supabase
      .from("daily_agenda_items")
      .select("id, agenda_date, time_slot, title, location")
      .order("agenda_date")
      .order("time_slot"),
    supabase
      .from("contacts")
      .select("id, full_name, role_title, phone, email, is_emergency")
      .order("is_emergency", { ascending: false })
      .order("full_name"),
    supabase
      .from("leader_invitations")
      .select(
        "id, email, user_id, role, ward_id, status, invited_at, accepted_at, calling:leader_callings(name), ward:wards(name)",
      )
      .order("invited_at", { ascending: false }),
    supabase
      .from("leader_callings")
      .select("id, name")
      .order("name"),
    supabase
      .from("daily_messages")
      .select("id, message_date, title, scripture, message")
      .order("message_date"),
    supabase
      .from("camp_rules_documents")
      .select("content")
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("photos")
      .select("id, image_url, caption, captured_on")
      .order("created_at", { ascending: false }),
    supabase
      .from("documentation_pages")
      .select("id, title, content, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_profiles")
      .select(
        "user_id, user_email, display_name, avatar_url, phone, ward_id, quorum_id, medical_notes, shirt_size_code, age",
      )
      .order("display_name"),
  ]);

  const wards = (wardRows ?? []) as WardRow[];
  const campUnitsRaw = (campUnitRows ?? []) as CampUnitRow[];
  const campUnitMembersRaw = (campUnitMemberRows ?? []) as CampUnitMemberRow[];
  const wardNameById = new Map<string, string>(
    wards.map((ward) => [ward.id, ward.name]),
  );
  const quorums = (quorumRows ?? []) as QuorumRow[];
  const shirtSizesRaw = (shirtSizeRows ?? []) as ShirtSizeRow[];
  const participants = (participantRows ?? []) as ParticipantRow[];
  const activitiesRaw = (activityRows ?? []) as ActivityRow[];
  const competitionsRaw = (competitionRows ?? []) as CompetitionRow[];
  const pointsRaw = (pointRows ?? []) as CompetitionPointRow[];
  const parentsRaw = (parentRows ?? []) as ParentRow[];
  const youngMenRaw = (youngManRows ?? []) as YoungManRow[];
  const agendaRaw = (agendaRows ?? []) as AgendaRow[];
  const contactsRaw = (contactRows ?? []) as ContactRow[];
  const leaderInvitationsRaw = (leaderInvitationRows ?? []) as LeaderInvitationRow[];
  const leaderCallingsRaw = (leaderCallingRows ?? []) as LeaderCallingRow[];
  const messagesRaw = (messageRows ?? []) as DailyMessageRow[];
  const latestRules = ((rulesRows ?? [])[0] ?? null) as RulesRow | null;
  const photosRaw = (photoRows ?? []) as PhotoRow[];
  const docsRaw = (docRows ?? []) as DocumentationRow[];
  const userProfilesRaw = (userProfileRows ?? []) as UserProfileRow[];

  const wardsForDisplay: DesignWard[] = wards.map((ward) => ({
    id: ward.id,
    name: ward.name,
    leader: ward.leader_name ?? "",
    leader_email: ward.leader_email ?? "",
    campers: [],
  }));

  const wardById = new Map<string, DesignWard>();
  wardsForDisplay.forEach((ward) => {
    wardById.set(ward.id, ward);
  });

  participants.forEach((participant) => {
    const ward = wardById.get(participant.ward_id);
    if (!ward) {
      return;
    }

    ward.campers.push({
      id: participant.id,
      name: `${participant.first_name} ${participant.last_name}`,
    });
  });

  const units: DesignUnit[] = campUnitsRaw.map((unit, index) => ({
    id: unit.id,
    name: unit.name,
    color: unit.color ?? FALLBACK_UNIT_COLORS[index % FALLBACK_UNIT_COLORS.length],
    leader: unit.leader_name ?? "Leader TBD",
    leader_email: unit.leader_email ?? "",
    campers: [],
  }));

  const unitById = new Map<string, DesignUnit>();
  units.forEach((unit) => {
    unitById.set(unit.id, unit);
  });

  const participantById = new Map<string, ParticipantRow>();
  participants.forEach((participant) => {
    participantById.set(participant.id, participant);
  });

  campUnitMembersRaw.forEach((membership) => {
    const unit = unitById.get(membership.unit_id);
    const participant = participantById.get(membership.participant_id);
    if (!unit || !participant) {
      return;
    }

    unit.campers.push({
      id: membership.id,
      name: `${participant.first_name} ${participant.last_name}`,
    });
  });

  const activities: DesignActivity[] = activitiesRaw.map((activity) => ({
    id: activity.id,
    title: activity.title,
    category: activity.category || "General",
    day: toDayIndex(activity.starts_at),
    time: formatTime(activity.starts_at),
    location: activity.location ?? "",
    desc: activity.description ?? "",
  }));

  const competitions: DesignCompetition[] = competitionsRaw.map((competition) => ({
    id: competition.id,
    name: competition.name,
    rules: competition.rules ?? "",
    status: normalizeCompetitionStatus(competition.status),
  }));

  const pointLog: DesignPoint[] = pointsRaw
    .map((point) => {
      if (!point.unit_id || !unitById.has(point.unit_id)) {
        return null;
      }

      return {
        id: point.id,
        compId: point.competition_id,
        unitId: point.unit_id,
        points: point.points,
        note: point.reason ?? "",
        leader: point.awarded_by_name ?? "Leader",
        timestamp: formatTimestamp(point.awarded_at),
      };
    })
    .filter((value): value is DesignPoint => value !== null);

  const youngMenByParent = new Map<string, YoungManRow[]>();
  youngMenRaw.forEach((ym) => {
    const list = youngMenByParent.get(ym.parent_id) ?? [];
    list.push(ym);
    youngMenByParent.set(ym.parent_id, list);
  });

  const registrations: DesignRegistration[] = parentsRaw.map((parent) => {
    const ymRows = youngMenByParent.get(parent.id) ?? [];
    return {
      id: parent.id,
      parentName: `${parent.first_name} ${parent.last_name}`,
      email: parent.email,
      phone: parent.phone ?? "",
      wardId: parent.ward_id,
      wardName: parent.ward_id ? (wardNameById.get(parent.ward_id) ?? "") : "",
      registrationStatus: parent.registration_status,
      inviteStatus: parent.invite_status,
      invitedAt: parent.invited_at,
      youngMen: ymRows.map((ym) => ({
        id: ym.id,
        name: `${ym.first_name} ${ym.last_name}`,
        age: ym.age,
        shirtSize: ym.shirt_size_code ? (SHIRT_CODE_TO_DISPLAY[ym.shirt_size_code] ?? ym.shirt_size_code) : "",
        allergies: ym.allergies ?? "",
        medical: ym.medical_notes ?? "",
      })),
    };
  });

  const agenda: Record<number, DesignAgendaItem[]> = {};
  agendaRaw.forEach((item) => {
    const day = toDayIndex(item.agenda_date);
    if (!agenda[day]) {
      agenda[day] = [];
    }

    agenda[day].push({
      id: item.id,
      time: item.time_slot,
      item: item.title,
      location: item.location ?? "",
    });
  });

  const contacts: DesignContact[] = contactsRaw.map((contact) => ({
    id: contact.id,
    name: contact.full_name,
    role: contact.role_title ?? "",
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    emergency: contact.is_emergency,
  }));

  const inspiration: DesignInspiration[] = messagesRaw.map((message, index) => ({
    day: toDayIndex(message.message_date) || index,
    title: message.title ?? "Daily Message",
    verse: message.message,
    ref: message.scripture ?? "",
  }));

  const photos: DesignPhoto[] = photosRaw.map((photo) => ({
    id: photo.id,
    image_url: photo.image_url,
    caption: photo.caption ?? "",
    captured_on: photo.captured_on ?? "",
  }));

  const docs: DesignDoc[] = docsRaw.map((doc) => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    updated_at: doc.updated_at,
  }));

  const userProfiles: DesignUserProfile[] = userProfilesRaw.map((profile) => ({
    user_id: profile.user_id,
    email: profile.user_email ?? "",
    display_name:
      profile.display_name?.trim() ||
      profile.user_email?.split("@")[0] ||
      "User",
    avatar_url: profile.avatar_url ?? null,
  }));

  const userProfileById = new Map<string, UserProfileRow>();
  userProfilesRaw.forEach((profile) => {
    if (profile.user_id) {
      userProfileById.set(profile.user_id, profile);
    }
  });

  const leaders: DesignLeader[] = leaderInvitationsRaw
    .map((invitation) => {
      const profile = invitation.user_id
        ? userProfileById.get(invitation.user_id)
        : null;
      const email = invitation.email || profile?.user_email || "";
      const fallbackName = email.split("@")[0] || "Pending User";
      const callingName = resolveRelationName(invitation.calling);
      const wardName =
        resolveRelationName(invitation.ward) ||
        (invitation.ward_id ? wardNameById.get(invitation.ward_id) ?? "" : "");

      return {
        id: invitation.id,
        invitation_id: invitation.id,
        name: profile?.display_name?.trim() || fallbackName,
        calling: callingName || "Leader",
        email,
        role: invitation.role,
        role_label: LEADER_ROLE_LABELS[invitation.role] ?? invitation.role,
        ward_id: invitation.ward_id ?? null,
        ward_name: wardName,
        status: normalizeLeaderStatus(invitation.status),
        invite_sent_at: invitation.invited_at ?? null,
        invite_accepted_at: invitation.accepted_at ?? null,
      };
    })
    .sort((a, b) => {
      const statusOrder = { active: 0, pending: 1, revoked: 2 };
      const statusDelta = statusOrder[a.status] - statusOrder[b.status];
      if (statusDelta !== 0) {
        return statusDelta;
      }
      return a.name.localeCompare(b.name);
    });

  const leaderCallingOptions = Array.from(
    new Set(
      [
        ...leaderCallingsRaw.map((calling) => calling.name),
        ...leaderInvitationsRaw
          .map((invitation) => resolveRelationName(invitation.calling))
          .filter(Boolean),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const profileOptions: DesignProfileOptions = {
    wards: wards
      .map((ward) => ({
        id: ward.id,
        name: ward.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    quorums: quorums
      .map((quorum) => ({
        id: quorum.id,
        ward_id: quorum.ward_id,
        name: quorum.display_name || quorum.quorum_type,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    shirtSizes: shirtSizesRaw.map((size) => ({
      code: size.code,
      label: size.label,
    })),
  };

  return {
    units,
    wards: wardsForDisplay,
    activities,
    competitions,
    pointLog,
    registrations,
    agenda,
    contacts,
    leaders,
    inspiration,
    rules: parseRules(latestRules?.content ?? null),
    photos,
    docs,
    userProfiles,
    leaderCallingOptions,
    profileOptions,
  };
}
