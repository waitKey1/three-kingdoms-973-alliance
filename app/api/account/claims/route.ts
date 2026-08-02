import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { claimInputSchema } from "@/app/lib/server/schemas";
import { prisma } from "@/app/lib/server/prisma";
import { requireUser } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.status === "ACTIVE" || user.memberId) throw new ApiError(409, "账户已经绑定角色", "ALREADY_BOUND");
    const input = claimInputSchema.parse(await request.json());
    const member = await prisma.allianceMember.findFirst({ where: { id: input.memberId, currentAllianceId: input.allianceId, deletedAt: null }, include: { boundUser: true } });
    if (!member) throw new ApiError(404, "角色不属于所选盟或不存在", "MEMBER_NOT_FOUND");
    if (member.boundUser) throw new ApiError(409, "该角色已被其他账户绑定", "MEMBER_ALREADY_BOUND");
    await prisma.memberClaim.updateMany({ where: { userId: user.id, status: "PENDING" }, data: { status: "CANCELLED" } });
    const claim = await prisma.memberClaim.create({ data: { userId: user.id, allianceId: input.allianceId, memberId: input.memberId } });
    await writeAudit({ actorId: user.id, action: "CLAIM_SUBMITTED", entityType: "MemberClaim", entityId: claim.id, allianceId: input.allianceId, afterData: claim, ipAddress: getRequestIp(request) });
    return NextResponse.json({ claim: jsonSafe(claim) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
