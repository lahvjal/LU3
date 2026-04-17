import { NextResponse } from "next/server";
import {
  completeOnboardingProfileInDb,
  type OnboardingProfileBody,
} from "@/lib/app/onboarding-completion-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<OnboardingProfileBody>;
    const input: OnboardingProfileBody = {
      displayName: typeof body.displayName === "string" ? body.displayName : "",
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : "",
      phone: typeof body.phone === "string" ? body.phone : null,
      wardId: typeof body.wardId === "string" ? body.wardId : null,
      signatureName:
        typeof body.signatureName === "string" ? body.signatureName : undefined,
      parentSignatureDate:
        typeof body.parentSignatureDate === "string"
          ? body.parentSignatureDate
          : undefined,
    };

    const result = await completeOnboardingProfileInDb(
      supabase,
      user.id,
      user.email ?? undefined,
      input,
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/onboarding/complete-profile]", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
