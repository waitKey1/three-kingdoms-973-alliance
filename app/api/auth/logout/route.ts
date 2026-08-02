import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiError } from "@/app/lib/server/http";
import { clearSessionCookie, revokeSession, SESSION_COOKIE } from "@/app/lib/server/session";

export async function POST() {
  try {
    const jar = await cookies();
    await revokeSession(jar.get(SESSION_COOKIE)?.value);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
