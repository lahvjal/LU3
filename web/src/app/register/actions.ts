"use server";

export type RegisterActionResult =
  | { ok: true }
  | { ok: false; error: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addRegistrationListEntryAction(_input?: any): Promise<RegisterActionResult> {
  return { ok: false, error: "Registration has been moved. Please use the main app." };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendRegistrationInviteAction(_input?: any): Promise<RegisterActionResult> {
  return { ok: false, error: "Registration has been moved. Please use the main app." };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateRegistrationListEntryAction(_input?: any): Promise<RegisterActionResult> {
  return { ok: false, error: "Registration has been moved. Please use the main app." };
}
