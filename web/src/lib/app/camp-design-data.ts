import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type WardRow = {
  id: string;
  name: string;
  theme_color: string | null;
  leader_name: string | null;
  leader_phone: string | null;
};

type WardMealNested = { name: string; theme_color?: string | null };

type WardMealRow = {
  id: string;
  ward_id: string;
  meal_date: string;
  meal_type: string;
  time_label: string;
  menu: string;
  ward: WardMealNested | WardMealNested[] | null;
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
  points: number;
  reason: string | null;
  awarded_at: string;
  awarded_by_name: string | null;
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
  role: string | null;
  calling_id: string | null;
  invited_by: string | null;
  invited_at: string | null;
  terms_accepted_at: string | null;
  signature_name: string | null;
  onboarding_completed_at: string | null;
  calling: { name: string } | { name: string }[] | null;
  ward: { name: string } | { name: string }[] | null;
};


type DesignWard = {
  id: string;
  name: string;
  color: string;
  leader: string;
  leader_phone: string;
  campers: Array<{ id: string; name: string; photo_url: string | null }>;
};

type DesignActivity = {
  id: string;
  title: string;
  category: string;
  date: string;
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
  wardId: string;
  points: number;
  note: string;
  leader: string;
  timestamp: string;
};

type DesignRegistrationYoungMan = {
  id: string;
  name: string;
  age: number;
  photoUrl: string | null;
  shirtSize: string;
  allergies: string;
  medical: string;
};

type DesignRegistration = {
  id: string;
  parentName: string;
  parentAvatarUrl: string | null;
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
  date: string;
  time: string;
  item: string;
  location: string;
};

export type DesignMeal = {
  id: string;
  wardId: string;
  wardName: string;
  /** Ward theme color for UI (e.g. dot next to name). */
  wardColor: string;
  mealDate: string;
  mealType: "breakfast" | "lunch" | "dinner";
  time: string;
  menu: string;
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
  avatar_url: string | null;
  calling: string;
  email: string;
  role: string;
  role_label: string;
  ward_id: string | null;
  ward_name: string;
  status: "pending" | "active";
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
  wards: DesignWard[];
  activities: DesignActivity[];
  competitions: DesignCompetition[];
  pointLog: DesignPoint[];
  registrations: DesignRegistration[];
  agenda: Record<string, DesignAgendaItem[]>;
  meals: DesignMeal[];
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
const FALLBACK_WARD_COLORS = [
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

const LEADERSHIP_ROLES = new Set([
  "stake_leader",
  "stake_camp_director",
  "ward_leader",
  "camp_committee",
  "young_men_captain",
]);

function toDateString(value: string) {
  return value.slice(0, 10);
}

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

function normalizeMealType(
  value: string,
): "breakfast" | "lunch" | "dinner" {
  if (value === "lunch" || value === "dinner") {
    return value;
  }
  return "breakfast";
}

function wardMealNested(
  value: WardMealRow["ward"],
): WardMealNested | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

/** Dot / accent color for a meal row: FK ward theme, then wards list, then stable fallback. */
function resolveMealWardColor(
  row: WardMealRow,
  wardFromMap: DesignWard | undefined,
  wardsOrdered: DesignWard[],
): string {
  const nested = wardMealNested(row.ward);
  const fromJoin = nested?.theme_color?.trim() ?? "";
  const fromMap = wardFromMap?.color?.trim() ?? "";
  const assigned = fromJoin || fromMap;
  if (assigned) {
    return assigned;
  }
  const idx = row.ward_id
    ? wardsOrdered.findIndex((w) => w.id === row.ward_id)
    : -1;
  const safe = idx >= 0 ? idx : 0;
  return FALLBACK_WARD_COLORS[safe % FALLBACK_WARD_COLORS.length];
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
    { data: quorumRows },
    { data: shirtSizeRows },
    { data: userProfileRows },
    { data: youngManRows },
  ] = await Promise.all([
    supabase
      .from("wards")
      .select("id, name, theme_color, leader_name, leader_phone")
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
      .from("user_profiles")
      .select(
        "user_id, user_email, display_name, avatar_url, phone, ward_id, role, calling_id, invited_by, invited_at, terms_accepted_at, signature_name, onboarding_completed_at, calling:leader_callings(name), ward:wards(name)",
      )
      .order("display_name"),
    supabase
      .from("young_men")
      .select(
        "id, parent_id, first_name, last_name, age, photo_url, shirt_size_code, allergies, medical_notes",
      )
      .order("created_at"),
  ]);

  const [
    { data: activityRows },
    { data: competitionRows },
    { data: pointRows },
    { data: agendaRows },
    { data: contactRows },
    { data: wardMealRows },
  ] = await Promise.all([
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
        "id, competition_id, ward_id, points, reason, awarded_at, awarded_by_name",
      )
      .order("awarded_at"),
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
      .from("ward_meals")
      .select("id, ward_id, meal_date, meal_type, time_label, menu, ward:wards(name, theme_color)")
      .order("meal_date")
      .order("time_label"),
  ]);

  const [
    { data: leaderCallingRows },
    { data: messageRows },
    { data: rulesRows },
    { data: photoRows },
    { data: docRows },
  ] = await Promise.all([
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
  ]);

  const wards = (wardRows ?? []) as WardRow[];
  const wardNameById = new Map<string, string>(
    wards.map((ward) => [ward.id, ward.name]),
  );
  const quorums = (quorumRows ?? []) as QuorumRow[];
  const shirtSizesRaw = (shirtSizeRows ?? []) as ShirtSizeRow[];
  const activitiesRaw = (activityRows ?? []) as ActivityRow[];
  const competitionsRaw = (competitionRows ?? []) as CompetitionRow[];
  const pointsRaw = (pointRows ?? []) as CompetitionPointRow[];
  const youngMenRaw = (youngManRows ?? []) as YoungManRow[];
  const agendaRaw = (agendaRows ?? []) as AgendaRow[];
  const contactsRaw = (contactRows ?? []) as ContactRow[];
  const leaderCallingsRaw = (leaderCallingRows ?? []) as LeaderCallingRow[];
  const messagesRaw = (messageRows ?? []) as DailyMessageRow[];
  const latestRules = ((rulesRows ?? [])[0] ?? null) as RulesRow | null;
  const photosRaw = (photoRows ?? []) as PhotoRow[];
  const docsRaw = (docRows ?? []) as DocumentationRow[];
  const allProfiles = (userProfileRows ?? []) as UserProfileRow[];

  const parentProfiles = allProfiles.filter((p) => p.role === "parent");
  const leaderProfiles = allProfiles.filter((p) => p.role && LEADERSHIP_ROLES.has(p.role));

  // Build parent ward map (parent user_id → ward_id) for camper assignment
  const parentWardMap = new Map<string, string>();
  parentProfiles.forEach((parent) => {
    if (parent.ward_id) {
      parentWardMap.set(parent.user_id, parent.ward_id);
    }
  });

  const wardsForDisplay: DesignWard[] = wards.map((ward) => ({
    id: ward.id,
    name: ward.name,
    color: ward.theme_color ?? "",
    leader: ward.leader_name ?? "",
    leader_phone: ward.leader_phone ?? "",
    campers: [],
  }));

  const wardById = new Map<string, DesignWard>();
  wardsForDisplay.forEach((ward) => {
    wardById.set(ward.id, ward);
  });

  youngMenRaw.forEach((ym) => {
    const wardId = parentWardMap.get(ym.parent_id);
    if (!wardId) return;
    const ward = wardById.get(wardId);
    if (!ward) return;
    ward.campers.push({
      id: ym.id,
      name: `${ym.first_name} ${ym.last_name}`,
      photo_url: ym.photo_url ?? null,
    });
  });


  const activities: DesignActivity[] = activitiesRaw.map((activity) => ({
    id: activity.id,
    title: activity.title,
    category: activity.category || "General",
    date: toDateString(activity.starts_at),
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
      if (!point.ward_id || !wardById.has(point.ward_id)) {
        return null;
      }

      return {
        id: point.id,
        compId: point.competition_id,
        wardId: point.ward_id,
        points: point.points,
        note: point.reason ?? "",
        leader: point.awarded_by_name ?? "Leader",
        timestamp: formatTimestamp(point.awarded_at),
      };
    })
    .filter((value): value is DesignPoint => value !== null);

  // Build young men lookup by parent user_id
  const youngMenByParent = new Map<string, YoungManRow[]>();
  youngMenRaw.forEach((ym) => {
    const list = youngMenByParent.get(ym.parent_id) ?? [];
    list.push(ym);
    youngMenByParent.set(ym.parent_id, list);
  });

  const registrations: DesignRegistration[] = parentProfiles.map((parent) => {
    const ymRows = youngMenByParent.get(parent.user_id) ?? [];
    const hasOnboarded = Boolean(parent.onboarding_completed_at);
    const hasInvite = Boolean(parent.invited_at);

    let registrationStatus: DesignRegistration["registrationStatus"];
    if (hasOnboarded) {
      registrationStatus = "active";
    } else if (hasInvite) {
      registrationStatus = "pending";
    } else {
      registrationStatus = "not_invited_yet";
    }

    let inviteStatus: DesignRegistration["inviteStatus"];
    if (hasOnboarded) {
      inviteStatus = "accepted";
    } else if (hasInvite) {
      inviteStatus = "sent";
    } else {
      inviteStatus = "not_sent";
    }

    return {
      id: parent.user_id,
      parentName:
        parent.display_name?.trim() ||
        parent.user_email?.split("@")[0] ||
        "Parent",
      parentAvatarUrl: parent.avatar_url ?? null,
      email: parent.user_email ?? "",
      phone: parent.phone ?? "",
      wardId: parent.ward_id,
      wardName: parent.ward_id ? (wardNameById.get(parent.ward_id) ?? "") : "",
      registrationStatus,
      inviteStatus,
      invitedAt: parent.invited_at,
      youngMen: ymRows.map((ym) => ({
        id: ym.id,
        name: `${ym.first_name} ${ym.last_name}`,
        age: ym.age,
        photoUrl: ym.photo_url ?? null,
        shirtSize: ym.shirt_size_code ? (SHIRT_CODE_TO_DISPLAY[ym.shirt_size_code] ?? ym.shirt_size_code) : "",
        allergies: ym.allergies ?? "",
        medical: ym.medical_notes ?? "",
      })),
    };
  });

  const agenda: Record<string, DesignAgendaItem[]> = {};
  agendaRaw.forEach((item) => {
    const dateKey = toDateString(item.agenda_date);
    if (!agenda[dateKey]) {
      agenda[dateKey] = [];
    }

    agenda[dateKey].push({
      id: item.id,
      date: dateKey,
      time: item.time_slot,
      item: item.title,
      location: item.location ?? "",
    });
  });

  const mealsRaw = (wardMealRows ?? []) as WardMealRow[];
  const meals: DesignMeal[] = mealsRaw.map((row) => {
    const wardName =
      resolveRelationName(row.ward) ||
      (row.ward_id ? (wardNameById.get(row.ward_id) ?? "") : "");
    const ward = row.ward_id ? wardById.get(row.ward_id) : undefined;
    return {
      id: row.id,
      wardId: row.ward_id,
      wardName,
      wardColor: resolveMealWardColor(row, ward, wardsForDisplay),
      mealDate: toDateString(row.meal_date),
      mealType: normalizeMealType(row.meal_type),
      time: row.time_label ?? "",
      menu: row.menu ?? "",
    };
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

  const userProfiles: DesignUserProfile[] = allProfiles.map((profile) => ({
    user_id: profile.user_id,
    email: profile.user_email ?? "",
    display_name:
      profile.display_name?.trim() ||
      profile.user_email?.split("@")[0] ||
      "User",
    avatar_url: profile.avatar_url ?? null,
  }));

  const leaders: DesignLeader[] = leaderProfiles
    .map((profile) => {
      const email = profile.user_email ?? "";
      const callingName = resolveRelationName(profile.calling);
      const wardName =
        resolveRelationName(profile.ward) ||
        (profile.ward_id ? wardNameById.get(profile.ward_id) ?? "" : "");

      return {
        id: profile.user_id,
        invitation_id: profile.user_id,
        name:
          profile.display_name?.trim() ||
          email.split("@")[0] ||
          "Pending User",
        avatar_url: profile.avatar_url ?? null,
        calling: callingName || "Leader",
        email,
        role: profile.role!,
        role_label: LEADER_ROLE_LABELS[profile.role!] ?? profile.role!,
        ward_id: profile.ward_id,
        ward_name: wardName,
        status: (profile.onboarding_completed_at ? "active" : "pending") as "pending" | "active",
        invite_sent_at: profile.invited_at ?? null,
        invite_accepted_at: profile.onboarding_completed_at ?? null,
      };
    })
    .sort((a, b) => {
      const statusOrder = { active: 0, pending: 1 };
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
        ...leaders
          .map((leader) => leader.calling)
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
    wards: wardsForDisplay,
    activities,
    competitions,
    pointLog,
    registrations,
    agenda,
    meals,
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
