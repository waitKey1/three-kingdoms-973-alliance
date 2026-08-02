import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { claimReviewSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { assertAllianceScope, requireAdmin, revokeAllUserSessions } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(); const { id } = await params; const input = claimReviewSchema.parse(await request.json());
    const claim = await prisma.memberClaim.findUnique({ where: { id }, include: { user: true, member: { include: { boundUser: true } } } });
    if (!claim) throw new ApiError(404, "认领申请不存在"); if (claim.status !== "PENDING") throw new ApiError(409, "该申请已经处理");
    assertAllianceScope(actor, claim.allianceId);
    if (input.action === "REJECT") {
      if (!input.rejectionReason) throw new ApiError(400, "驳回时必须填写原因");
      const reviewed = await prisma.memberClaim.update({ where: { id }, data: { status: "REJECTED", reviewerId: actor.id, reviewedAt: new Date(), rejectionReason: input.rejectionReason } });
      await writeAudit({ actorId: actor.id, action: "CLAIM_REJECTED", entityType: "MemberClaim", entityId: id, allianceId: claim.allianceId, beforeData: claim, afterData: reviewed, ipAddress: getRequestIp(request) });
      return NextResponse.json({ claim: jsonSafe(reviewed) });
    }
    if (claim.member.boundUser || claim.user.memberId) throw new ApiError(409, "角色或账户已经完成其他绑定");
    if (claim.member.currentAllianceId !== claim.allianceId) throw new ApiError(409, "角色当前盟已发生变化，请重新申请");
    const reviewed = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: claim.userId }, data: { allianceId: claim.allianceId, memberId: claim.memberId, status: "ACTIVE" } });
      const row = await tx.memberClaim.update({ where: { id }, data: { status: "APPROVED", reviewerId: actor.id, reviewedAt: new Date(), rejectionReason: null } });
      await tx.memberClaim.updateMany({ where: { userId: claim.userId, id: { not: id }, status: "PENDING" }, data: { status: "CANCELLED" } });
      return row;
    });
    await revokeAllUserSessions(claim.userId);
    await writeAudit({ actorId: actor.id, action: "CLAIM_APPROVED", entityType: "MemberClaim", entityId: id, allianceId: claim.allianceId, beforeData: claim, afterData: reviewed, ipAddress: getRequestIp(request) });
    return NextResponse.json({ claim: jsonSafe(reviewed) });
  } catch (error) { return apiError(error); }
}
