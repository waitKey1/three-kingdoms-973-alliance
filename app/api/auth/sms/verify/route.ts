import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiError, ApiError, getRequestIp, jsonSafe } from "@/app/lib/server/http";
import { smsVerifySchema } from "@/app/lib/server/schemas";
import { validateBootstrapToken, verifySmsCode } from "@/app/lib/server/sms";
import { prisma } from "@/app/lib/server/prisma";
import { createSession } from "@/app/lib/server/session";
import { writeAudit } from "@/app/lib/server/audit";

export async function POST(request: Request) {
  try {
    const input = smsVerifySchema.parse(await request.json());
    if (input.purpose === "SETUP") await validateBootstrapToken(input.bootstrapToken);
    await verifySmsCode(input.phone, input.code, input.purpose);

    let created = false;
    let user;
    if (input.purpose === "SETUP") {
      user = await prisma.$transaction(async (tx) => {
        const count = await tx.user.count();
        const setting = await tx.systemSetting.findUnique({ where: { key: "bootstrap" } });
        const value = setting?.value as { completed?: boolean } | null;
        if (count !== 0 || value?.completed === true) throw new ApiError(410, "初始化入口已永久关闭", "SETUP_CLOSED");
        const first = await tx.user.create({ data: {
          phone: input.phone, displayName: "首位区管理", role: "REGION_ADMIN", status: "ACTIVE", lastLoginAt: new Date(),
        } });
        await tx.systemSetting.upsert({
          where: { key: "bootstrap" }, create: { key: "bootstrap", value: { completed: true, completedAt: new Date().toISOString() } },
          update: { value: { completed: true, completedAt: new Date().toISOString() } },
        });
        return first;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      created = true;
    } else {
      const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
      if (existing?.status === "DISABLED" || existing?.deletedAt) throw new ApiError(403, "账户已停用，请联系区管理", "ACCOUNT_DISABLED");
      if (existing) user = await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
      else {
        user = await prisma.user.create({ data: { phone: input.phone, status: "PENDING", role: "ALLIANCE_MEMBER", lastLoginAt: new Date() } });
        created = true;
      }
    }
    await createSession(user.id);
    await writeAudit({ actorId: user.id, action: created ? "ACCOUNT_CREATED" : "LOGIN", entityType: "User", entityId: user.id, afterData: { role: user.role, status: user.status }, ipAddress: getRequestIp(request) });
    return NextResponse.json({ user: jsonSafe({ id: user.id, displayName: user.displayName, role: user.role, status: user.status }), redirectTo: user.role === "REGION_ADMIN" ? "/admin" : "/account" });
  } catch (error) {
    return apiError(error);
  }
}
