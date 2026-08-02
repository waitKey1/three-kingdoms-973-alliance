import { NextResponse } from "next/server";
import { apiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { memberInputSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { assertAllianceScope, requireAdmin } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";
import { calculateSixTotal, recalculateAllScores } from "@/app/lib/server/score";
import { clearPublicCache } from "@/app/lib/server/redis";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin(); const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1); const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize")) || 25, 1), 100);
    const search = url.searchParams.get("search")?.trim(); const requestedAlliance = url.searchParams.get("allianceId");
    const allianceId = user.role === "REGION_ADMIN" ? requestedAlliance || undefined : user.allianceId ?? "";
    const where = { deletedAt: null, ...(allianceId ? { currentAllianceId: allianceId } : {}), ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}) };
    const [members, total] = await Promise.all([
      prisma.allianceMember.findMany({ where, include: { currentAlliance: true, targetAlliance: true, boundUser: { select: { id: true, displayName: true, phone: true } } }, orderBy: { battleRank: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.allianceMember.count({ where }),
    ]);
    return NextResponse.json({ members: jsonSafe(members), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin(); const input = memberInputSchema.parse(await request.json()); assertAllianceScope(user, input.currentAllianceId);
    const member = await prisma.allianceMember.create({ data: { ...input, sixDimensionTotal: calculateSixTotal(input) } });
    await recalculateAllScores(); await clearPublicCache();
    await writeAudit({ actorId: user.id, action: "MEMBER_CREATED", entityType: "AllianceMember", entityId: member.id, allianceId: input.currentAllianceId, afterData: member, ipAddress: getRequestIp(request) });
    return NextResponse.json({ member: jsonSafe(member) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
