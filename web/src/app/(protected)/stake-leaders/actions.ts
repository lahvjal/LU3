"use server";

import {
  deleteLeaderInvitationAction,
  inviteLeaderAction,
} from "@/lib/app/camp-design-actions";

type InviteLeaderPayload = Parameters<typeof inviteLeaderAction>[0];

export type StakeLeaderActionResult =
  | { ok: true }
  | { ok: false; error: string };

function toResult(
  value:
    | Awaited<ReturnType<typeof inviteLeaderAction>>
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

export async function removeLeaderInviteAction(
  invitationId: string,
): Promise<StakeLeaderActionResult> {
  const result = await deleteLeaderInvitationAction(invitationId);
  return toResult(result);
}
