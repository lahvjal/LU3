import "server-only";

import { createHmac } from "node:crypto";

export const YOUTH_SESSION_COOKIE = "lu3_youth_session";
const YOUTH_SESSION_TTL_SECONDS = 60 * 60 * 12;

type YouthSessionPayload = {
  userId: string;
  youngManId: string;
  exp: number;
};

function getYouthSessionSecret() {
  const secret =
    process.env.YOUTH_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!secret) {
    throw new Error(
      "Missing session secret. Set YOUTH_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return secret;
}

function base64url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getYouthSessionSecret())
    .update(value)
    .digest("base64url");
}

export function createYouthSessionToken(input: {
  userId: string;
  youngManId: string;
}) {
  const payload: YouthSessionPayload = {
    userId: input.userId,
    youngManId: input.youngManId,
    exp: Math.floor(Date.now() / 1000) + YOUTH_SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyYouthSessionToken(token: string | null | undefined) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (sign(encodedPayload) !== signature) return null;
  try {
    const payload = JSON.parse(decodeBase64url(encodedPayload)) as YouthSessionPayload;
    if (!payload?.userId || !payload?.youngManId || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const YOUTH_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: YOUTH_SESSION_TTL_SECONDS,
};
