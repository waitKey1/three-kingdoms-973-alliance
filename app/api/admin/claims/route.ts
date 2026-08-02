import { NextResponse } from "next/server";
import { apiError, jsonSafe } from "@/app/lib/server/http";
import { prisma } from "@/app/lib/server/prisma";
import { requireAdmin } from "@/app/lib/server/session";

function mask(phone: string) { return `${phone.slice(0, 3)}****${phone.slice(-4)}`; }

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(); const status = new URL(request.url).searchParams.get("status") ?? "PENDING";
    const claims = await prisma.memberClaim.findMany({
      where: { ...(actor.role === "REGION_ADMIN" ? {} : { allianceId: actor.allianceId ?? "" }), ...(status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" }) },
      include: { user: true, alliance: true, member: true, reviewer: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 200,
    });
    const visible = claims.map((claim) => ({ ...claim, user: { ...claim.user, phone: actor.role === "REGION_ADMIN" ? claim.user.phone : mask(claim.user.phone) } }));
    return NextResponse.json({ claims: jsonSafe(visible) });
  } catch (error) { return apiError(error); }
}
