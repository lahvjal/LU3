import { NextResponse } from "next/server";
import {
  completeParentOnboardingInDb,
  type OnboardingProfileBody,
  type YoungManPayload,
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

    const body = (await request.json()) as {
      password?: string;
      skipPassword?: boolean;
      profile?: Partial<OnboardingProfileBody>;
      youngMen?: YoungManPayload[];
    };

    const profile: OnboardingProfileBody = {
      displayName:
        typeof body.profile?.displayName === "string" ? body.profile.displayName : "",
      avatarUrl:
        typeof body.profile?.avatarUrl === "string" ? body.profile.avatarUrl : "",
      phone: typeof body.profile?.phone === "string" ? body.profile.phone : null,
      wardId: typeof body.profile?.wardId === "string" ? body.profile.wardId : null,
      signatureName:
        typeof body.profile?.signatureName === "string"
          ? body.profile.signatureName
          : undefined,
      parentSignatureDate:
        typeof body.profile?.parentSignatureDate === "string"
          ? body.profile.parentSignatureDate
          : undefined,
    };

    const youngMen = Array.isArray(body.youngMen) ? body.youngMen : [];

    const result = await completeParentOnboardingInDb(
      supabase,
      user.id,
      user.email ?? undefined,
      {
        password: typeof body.password === "string" ? body.password : undefined,
        skipPassword: body.skipPassword === true,
        profile,
        youngMen,
      },
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/onboarding/complete-parent]", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
