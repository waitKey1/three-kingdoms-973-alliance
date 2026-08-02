import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { allianceInputSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { requireAdmin } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";
import { clearPublicCache } from "@/app/lib/server/redis";

export async function GET() {
  try {
    const user = await requireAdmin();
    const alliances = await prisma.alliance.findMany({
      where: user.role === "REGION_ADMIN" ? {} : { id: user.allianceId ?? "" },
      include: { _count: { select: { currentMembers: { where: { deletedAt: null } }, targetMembers: { where: { deletedAt: null, migrationStatus: { not: "RESERVE" } } }, users: { where: { deletedAt: null } } } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ alliances: jsonSafe(alliances) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (user.role !== "REGION_ADMIN") throw new ApiError(403, "只有区管理可以新增盟", "FORBIDDEN");
    const input = allianceInputSchema.parse(await request.json());
    if (input.targetCapacity > input.capacity) throw new ApiError(400, "建议容量不能超过最大容量");
    const alliance = await prisma.alliance.create({ data: input });
    await writeAudit({ actorId: user.id, action: "ALLIANCE_CREATED", entityType: "Alliance", entityId: alliance.id, allianceId: alliance.id, afterData: alliance, ipAddress: getRequestIp(request) });
    await clearPublicCache();
    return NextResponse.json({ alliance: jsonSafe(alliance) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
