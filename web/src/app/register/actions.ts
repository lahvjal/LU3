"use server";

import { getUserContext } from "@/lib/auth/user-context";
import { sendEmail } from "@/lib/email/resend";
import { parentInviteEmail, youthInviteEmail } from "@/lib/email/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RegisterActionResult =
  | { ok: true }
  | { ok: false; error: string };

type AddRosterEntryInput = {
  childName: string;
  age: number;
  wardId: string;
};

type SendInviteInput = {
  rosterId: string;
  participantId: string;
  recipientEmail: string;
  isParentEmail: boolean;
};

type UpdateRosterEntryInput = {
  rosterId: string;
  participantId: string;
  childName: string;
  age: number;
  wardId: string;
  shirtSizeCode: string;
  parentName: string;
  parentPhone: string;
  youthEmail: string;
  contactRoute: "parent_email" | "youth_email";
};

function fail(error: string): RegisterActionResult {
  return { ok: false, error };
}

function splitChildName(value: string) {
  const tokens = value
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: "Unknown" };
  }

  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(" "),
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ageToBirthDate(age: number) {
  const today = new Date();
  const birthDate = new Date(
    Date.UTC(
      today.getUTCFullYear() - age,
      today.getUTCMonth(),
      today.getUTCDate(),
    ),
  );
  return birthDate.toISOString().slice(0, 10);
}

async function resolveDefaultQuorumId(wardId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quorums")
    .select("id")
    .eq("ward_id", wardId)
    .order("display_name")
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}

async function requireRegistrationManager() {
  const userContext = await getUserContext();
  if (!userContext.canManageRegistrations) {
    return null;
  }

  return userContext;
}

export async function addRegistrationListEntryAction(
  input: AddRosterEntryInput,
): Promise<RegisterActionResult> {
  const userContext = await requireRegistrationManager();
  if (!userContext) {
    return fail("You do not have permission to manage registration entries.");
  }

  if (!input.childName.trim() || !input.wardId.trim()) {
    return fail("Name and ward are required.");
  }

  if (!Number.isFinite(input.age) || input.age < 8 || input.age > 18) {
    return fail("Age must be between 8 and 18.");
  }

  const childName = splitChildName(input.childName);
  if (!childName) {
    return fail("Please provide a valid child name.");
  }

  const quorumId = await resolveDefaultQuorumId(input.wardId.trim());
  if (!quorumId) {
    return fail("The selected ward does not have a quorum configured.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({
      ward_id: input.wardId.trim(),
      quorum_id: quorumId,
      first_name: childName.firstName,
      last_name: childName.lastName,
      birth_date: ageToBirthDate(input.age),
      active: true,
    })
    .select("id")
    .single();

  if (participantError || !participant?.id) {
    return fail(participantError?.message ?? "Unable to create participant.");
  }

  const { error: rosterError } = await supabase.from("registration_roster").insert({
    participant_id: participant.id,
    status: "not_invited_yet",
    contact_route: "parent_email",
    added_by: userContext.user.id,
  });

  if (rosterError) {
    await supabase.from("participants").delete().eq("id", participant.id);
    return fail(rosterError.message);
  }

  return { ok: true };
}

export async function sendRegistrationInviteAction(
  input: SendInviteInput,
): Promise<RegisterActionResult> {
  const userContext = await requireRegistrationManager();
  if (!userContext) {
    return fail("You do not have permission to send registration invites.");
  }

  const rosterId = input.rosterId.trim();
  const participantId = input.participantId.trim();
  const recipientEmail = normalizeEmail(input.recipientEmail);

  if (!rosterId || !participantId || !recipientEmail) {
    return fail("Invite details are incomplete.");
  }

  if (!isValidEmail(recipientEmail)) {
    return fail("Please enter a valid email address.");
  }

  const targetType = input.isParentEmail ? "parent" : "youth";
  const contactRoute = input.isParentEmail ? "parent_email" : "youth_email";
  const supabase = await createSupabaseServerClient();

  let parentInvitationId: string | null = null;
  if (targetType === "parent") {
    const { data: pendingInvite } = await supabase
      .from("parent_invitations")
      .select("id")
      .eq("participant_id", participantId)
      .eq("status", "pending")
      .ilike("email", recipientEmail)
      .limit(1)
      .maybeSingle();

    if (pendingInvite?.id) {
      parentInvitationId = pendingInvite.id;
    } else {
      const { data: createdInvite, error: createParentInviteError } = await supabase
        .from("parent_invitations")
        .insert({
          email: recipientEmail,
          participant_id: participantId,
          invited_by: userContext.user.id,
        })
        .select("id")
        .single();

      if (createParentInviteError || !createdInvite?.id) {
        return fail(createParentInviteError?.message ?? "Unable to create parent invite.");
      }

      parentInvitationId = createdInvite.id;
    }
  }

  const { error: inviteError } = await supabase.from("registration_invites").insert({
    roster_id: rosterId,
    participant_id: participantId,
    target_type: targetType,
    recipient_email: recipientEmail,
    sent_by: userContext.user.id,
    parent_invitation_id: parentInvitationId,
  });

  if (inviteError) {
    if (inviteError.code === "23505") {
      return fail("An active invite for that email already exists.");
    }

    return fail(inviteError.message);
  }

  if (targetType === "youth") {
    const { error: youthEmailError } = await supabase
      .from("participants")
      .update({ email: recipientEmail })
      .eq("id", participantId);

    if (youthEmailError) {
      return fail(youthEmailError.message);
    }
  }

  const { error: rosterError } = await supabase
    .from("registration_roster")
    .update({
      status: "pending",
      contact_route: contactRoute,
    })
    .eq("id", rosterId);

  if (rosterError) {
    return fail(rosterError.message);
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("first_name, last_name")
    .eq("id", participantId)
    .maybeSingle();

  const camperName = participant
    ? `${participant.first_name} ${participant.last_name}`.trim()
    : "your camper";

  const template =
    targetType === "parent"
      ? parentInviteEmail(camperName)
      : youthInviteEmail(camperName);

  await sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
  });

  return { ok: true };
}

export async function updateRegistrationListEntryAction(
  input: UpdateRosterEntryInput,
): Promise<RegisterActionResult> {
  const userContext = await requireRegistrationManager();
  if (!userContext) {
    return fail("You do not have permission to edit registration entries.");
  }

  const rosterId = input.rosterId.trim();
  const participantId = input.participantId.trim();
  const wardId = input.wardId.trim();
  if (!rosterId || !participantId || !wardId) {
    return fail("Row update details are incomplete.");
  }

  if (!Number.isFinite(input.age) || input.age < 8 || input.age > 18) {
    return fail("Age must be between 8 and 18.");
  }

  const childName = splitChildName(input.childName);
  if (!childName) {
    return fail("Please provide a valid child name.");
  }

  const quorumId = await resolveDefaultQuorumId(wardId);
  if (!quorumId) {
    return fail("The selected ward does not have a quorum configured.");
  }

  const normalizedYouthEmail = normalizeEmail(input.youthEmail);
  if (normalizedYouthEmail && !isValidEmail(normalizedYouthEmail)) {
    return fail("Youth email is invalid.");
  }

  const supabase = await createSupabaseServerClient();
  const { error: participantError } = await supabase
    .from("participants")
    .update({
      first_name: childName.firstName,
      last_name: childName.lastName,
      ward_id: wardId,
      quorum_id: quorumId,
      birth_date: ageToBirthDate(input.age),
      shirt_size_code: input.shirtSizeCode.trim() || null,
      parent_guardian_name: input.parentName.trim() || null,
      parent_guardian_phone: input.parentPhone.trim() || null,
      email: normalizedYouthEmail || null,
    })
    .eq("id", participantId);

  if (participantError) {
    return fail(participantError.message);
  }

  const { error: rosterError } = await supabase
    .from("registration_roster")
    .update({
      contact_route: input.contactRoute,
    })
    .eq("id", rosterId);

  if (rosterError) {
    return fail(rosterError.message);
  }

  return { ok: true };
}
