/** Calendar date of camp week reference for age eligibility (matches onboarding copy). */
export const CAMP_AGE_REFERENCE_YMD = "2026-06-15";

export function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** Age in full years on the reference date (month/day inclusive). */
export function ageOnCampReference(dobYmd: string): number | null {
  const dob = parseYmd(dobYmd);
  const ref = parseYmd(CAMP_AGE_REFERENCE_YMD);
  if (!dob || !ref) return null;
  let age = ref.y - dob.y;
  if (ref.m < dob.m || (ref.m === dob.m && ref.d < dob.d)) {
    age -= 1;
  }
  return age;
}
