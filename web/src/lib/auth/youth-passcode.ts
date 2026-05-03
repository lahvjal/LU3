import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSCODE_REGEX = /^\d{4}$/;
const SCRYPT_KEY_LEN = 64;

export function isValidYouthPasscode(value: string) {
  return PASSCODE_REGEX.test(value.trim());
}

export function hashYouthPasscode(passcode: string) {
  const normalized = passcode.trim();
  if (!isValidYouthPasscode(normalized)) {
    throw new Error("Youth passcode must be exactly 4 digits.");
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalized, salt, SCRYPT_KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyYouthPasscode(passcode: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const normalized = passcode.trim();
  if (!isValidYouthPasscode(normalized)) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  const actual = Buffer.from(hashHex, "hex");
  const expected = scryptSync(normalized, salt, SCRYPT_KEY_LEN);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
