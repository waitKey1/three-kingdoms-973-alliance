import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { allianceInputSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { assertAllianceScope, requireAdmin } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";
import { clearPublicCache } from "@/app/lib/server/redis";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(); const { id } = await params; assertAllianceScope(user, id);
    const before = await prisma.alliance.findUnique({ where: { id } });
    if (!before) throw new ApiError(404, "盟不存在");
    const input = allianceInputSchema.partial().parse(await request.json());
    if (user.role !== "REGION_ADMIN") {
      const disallowed = ["name", "slug", "capacity", "targetCapacity", "sortOrder"] as const;
      if (disallowed.some((key) => input[key] !== undefined)) throw new ApiError(403, "盟管理只能编辑本盟展示定位和颜色", "FORBIDDEN");
    }
    const capacity = input.capacity ?? before.capacity; const target = input.targetCapacity ?? before.targetCapacity;
    if (target > capacity) throw new ApiError(400, "建议容量不能超过最大容量");
    const alliance = await prisma.alliance.update({ where: { id }, data: input });
    await writeAudit({ actorId: user.id, action: "ALLIANCE_UPDATED", entityType: "Alliance", entityId: id, allianceId: id, beforeData: before, afterData: alliance, ipAddress: getRequestIp(request) });
    await clearPublicCache();
    return NextResponse.json({ alliance: jsonSafe(alliance) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(); if (user.role !== "REGION_ADMIN") throw new ApiError(403, "只有区管理可以停用盟", "FORBIDDEN");
    const { id } = await params; const before = await prisma.alliance.findUnique({ where: { id } });
    if (!before) throw new ApiError(404, "盟不存在");
    const alliance = await prisma.alliance.update({ where: { id }, data: { status: "INACTIVE", deletedAt: new Date() } });
    await writeAudit({ actorId: user.id, action: "ALLIANCE_DELETED", entityType: "Alliance", entityId: id, allianceId: id, beforeData: before, afterData: alliance, ipAddress: getRequestIp(request) });
    await clearPublicCache();
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
