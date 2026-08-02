import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { userUpdateSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { assertAllianceScope, requireAdmin, revokeAllUserSessions } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";

async function protectLastAdmins(before: { id: string; role: string; status: string; allianceId: string | null }, next: { role?: string; status?: string; allianceId?: string | null }) {
  const losingActiveRole = (next.status === "DISABLED") || (next.role && next.role !== before.role) || (next.allianceId !== undefined && next.allianceId !== before.allianceId);
  if (!losingActiveRole || before.status !== "ACTIVE") return;
  if (before.role === "REGION_ADMIN") {
    const count = await prisma.user.count({ where: { role: "REGION_ADMIN", status: "ACTIVE", deletedAt: null } });
    if (count <= 1) throw new ApiError(409, "不能停用或降级最后一位区管理", "LAST_REGION_ADMIN");
  }
  if (before.role === "ALLIANCE_ADMIN" && before.allianceId) {
    const count = await prisma.user.count({ where: { role: "ALLIANCE_ADMIN", status: "ACTIVE", allianceId: before.allianceId, deletedAt: null } });
    if (count <= 1) throw new ApiError(409, "不能移除最后一位本盟管理", "LAST_ALLIANCE_ADMIN");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(); const { id } = await params;
    const before = await prisma.user.findUnique({ where: { id }, include: { member: true } });
    if (!before || before.deletedAt) throw new ApiError(404, "账户不存在");
    if (actor.role !== "REGION_ADMIN") {
      if (!before.allianceId) throw new ApiError(403, "不能管理未归盟账户", "FORBIDDEN");
      assertAllianceScope(actor, before.allianceId);
    }
    const input = userUpdateSchema.parse(await request.json());
    if (actor.role !== "REGION_ADMIN") {
      if (input.role === "REGION_ADMIN" || (input.allianceId !== undefined && input.allianceId !== actor.allianceId)) throw new ApiError(403, "盟管理不能任命区管理或跨盟调整账户", "FORBIDDEN");
      if (input.role === "ALLIANCE_ADMIN" && (!before.memberId || before.status !== "ACTIVE")) throw new ApiError(409, "只能将已绑定本盟的活跃成员任命为副管理");
      input.allianceId = actor.allianceId;
    }
    if (input.role === "REGION_ADMIN") input.allianceId = null;
    const effectiveAllianceId = input.allianceId === undefined ? before.allianceId : input.allianceId;
    if (input.role === "ALLIANCE_ADMIN") {
      if (!before.memberId || !before.member || !effectiveAllianceId || before.member.currentAllianceId !== effectiveAllianceId || before.status !== "ACTIVE") {
        throw new ApiError(409, "只能将已绑定本盟的活跃成员任命为盟管理");
      }
    }
    if (input.status === "ACTIVE" && !before.memberId && (input.role ?? before.role) !== "REGION_ADMIN") {
      throw new ApiError(409, "普通账户必须先通过角色认领才能激活");
    }
    await protectLastAdmins(before, input);
    const { revokeSessions, ...data } = input;
    const user = await prisma.user.update({ where: { id }, data });
    if (revokeSessions || input.role !== undefined || input.status !== undefined) await revokeAllUserSessions(id);
    await writeAudit({ actorId: actor.id, action: "USER_UPDATED", entityType: "User", entityId: id, allianceId: user.allianceId, beforeData: before, afterData: user, ipAddress: getRequestIp(request) });
    return NextResponse.json({ user: jsonSafe(user) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(); const { id } = await params;
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before || before.deletedAt) throw new ApiError(404, "账户不存在");
    if (actor.role !== "REGION_ADMIN") { if (!before.allianceId) throw new ApiError(403, "不能管理此账户"); assertAllianceScope(actor, before.allianceId); }
    await protectLastAdmins(before, { status: "DISABLED" });
    const user = await prisma.user.update({ where: { id }, data: { status: "DISABLED", deletedAt: new Date(), memberId: null } });
    await revokeAllUserSessions(id);
    await writeAudit({ actorId: actor.id, action: "USER_DELETED", entityType: "User", entityId: id, allianceId: before.allianceId, beforeData: before, afterData: user, ipAddress: getRequestIp(request) });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
