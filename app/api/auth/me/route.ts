import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/server/session";
import { jsonSafe } from "@/app/lib/server/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: jsonSafe({
    id: user.id, phone: user.phone, displayName: user.displayName, role: user.role, status: user.status,
    alliance: user.alliance && { id: user.alliance.id, name: user.alliance.name, slug: user.alliance.slug },
    member: user.member && { id: user.member.id, name: user.member.name, battleRank: user.member.battleRank },
  }) });
}
