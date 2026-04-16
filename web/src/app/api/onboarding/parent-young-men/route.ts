import { NextResponse } from "next/server";
import {
  insertParentYoungMenInDb,
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

    const body = (await request.json()) as { youngMen?: YoungManPayload[] };
    const youngMen = Array.isArray(body.youngMen) ? body.youngMen : [];

    const result = await insertParentYoungMenInDb(supabase, user.id, youngMen);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/onboarding/parent-young-men]", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
