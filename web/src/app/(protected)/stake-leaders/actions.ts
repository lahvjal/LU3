"use server";

import {
  deleteLeaderInvitationAction,
  inviteLeaderAction,
  updateLeaderInvitationStatusAction,
} from "@/lib/app/camp-design-actions";

type InviteLeaderPayload = Parameters<typeof inviteLeaderAction>[0];
type LeaderInvitationStatus = Parameters<typeof updateLeaderInvitationStatusAction>[1];

export type StakeLeaderActionResult =
  | { ok: true }
  | { ok: false; error: string };

function toResult(
  value:
    | Awaited<ReturnType<typeof inviteLeaderAction>>
    | Awaited<ReturnType<typeof updateLeaderInvitationStatusAction>>
    | Awaited<ReturnType<typeof deleteLeaderInvitationAction>>,
): StakeLeaderActionResult {
  if (!value.ok) {
    return { ok: false, error: value.error };
  }

  return { ok: true };
}

export async function sendLeaderInviteAction(
  input: InviteLeaderPayload,
): Promise<StakeLeaderActionResult> {
  const result = await inviteLeaderAction(input);
  return toResult(result);
}

export async function updateLeaderInviteStatusAction(
  invitationId: string,
  status: LeaderInvitationStatus,
): Promise<StakeLeaderActionResult> {
  const result = await updateLeaderInvitationStatusAction(invitationId, status);
  return toResult(result);
}

export async function removeLeaderInviteAction(
  invitationId: string,
): Promise<StakeLeaderActionResult> {
  const result = await deleteLeaderInvitationAction(invitationId);
  return toResult(result);
}
