import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { memberInputSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { assertAllianceScope, requireAdmin, revokeAllUserSessions } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";
import { calculateSixTotal, recalculateAllScores } from "@/app/lib/server/score";
import { clearPublicCache } from "@/app/lib/server/redis";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(); const { id } = await params;
    const before = await prisma.allianceMember.findUnique({ where: { id }, include: { boundUser: true } });
    if (!before) throw new ApiError(404, "成员不存在"); assertAllianceScope(user, before.currentAllianceId);
    const raw = await request.json();
    if (raw.restore === true) {
      const restored = await prisma.allianceMember.update({ where: { id }, data: { deletedAt: null } });
      await writeAudit({ actorId: user.id, action: "MEMBER_RESTORED", entityType: "AllianceMember", entityId: id, allianceId: before.currentAllianceId, beforeData: before, afterData: restored, ipAddress: getRequestIp(request) });
      await clearPublicCache(); return NextResponse.json({ member: jsonSafe(restored) });
    }
    const input = memberInputSchema.partial().parse(raw);
    const nextCurrent = input.currentAllianceId ?? before.currentAllianceId;
    if (user.role !== "REGION_ADMIN" && nextCurrent !== before.currentAllianceId) throw new ApiError(403, "盟管理不能跨盟调整实际归属", "FORBIDDEN");
    assertAllianceScope(user, nextCurrent);
    const dimensionData = { ...before, ...input } as unknown as Record<string, unknown>;
    const member = await prisma.allianceMember.update({ where: { id }, data: { ...input, sixDimensionTotal: calculateSixTotal(dimensionData) } });
    await recalculateAllScores(); await clearPublicCache();
    await writeAudit({ actorId: user.id, action: "MEMBER_UPDATED", entityType: "AllianceMember", entityId: id, allianceId: nextCurrent, beforeData: before, afterData: member, ipAddress: getRequestIp(request) });
    return NextResponse.json({ member: jsonSafe(member) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin(); const { id } = await params;
    const before = await prisma.allianceMember.findUnique({ where: { id }, include: { boundUser: true } });
    if (!before) throw new ApiError(404, "成员不存在"); assertAllianceScope(user, before.currentAllianceId);
    await prisma.$transaction(async (tx) => {
      await tx.allianceMember.update({ where: { id }, data: { deletedAt: new Date() } });
      if (before.boundUser) await tx.user.update({ where: { id: before.boundUser.id }, data: { status: "DISABLED" } });
    });
    if (before.boundUser) await revokeAllUserSessions(before.boundUser.id);
    await recalculateAllScores(); await clearPublicCache();
    await writeAudit({ actorId: user.id, action: "MEMBER_DELETED", entityType: "AllianceMember", entityId: id, allianceId: before.currentAllianceId, beforeData: before, afterData: { deletedAt: new Date().toISOString(), linkedUserDisabled: Boolean(before.boundUser) }, ipAddress: getRequestIp(request) });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
