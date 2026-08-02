import { NextResponse } from "next/server";
import { apiError, jsonSafe } from "@/app/lib/server/http";
import { prisma } from "@/app/lib/server/prisma";
import { requireAdmin } from "@/app/lib/server/session";

function mask(phone: string) { return `${phone.slice(0, 3)}****${phone.slice(-4)}`; }

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(); const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1); const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize")) || 25, 1), 100);
    const where = actor.role === "REGION_ADMIN" ? { deletedAt: null } : {
      deletedAt: null,
      OR: [
        { allianceId: actor.allianceId },
        { claims: { some: { allianceId: actor.allianceId ?? "", status: "PENDING" as const } } },
      ],
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, include: { alliance: true, member: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.user.count({ where }),
    ]);
    const visible = users.map((user) => ({ ...user, phone: actor.role === "REGION_ADMIN" ? user.phone : mask(user.phone) }));
    return NextResponse.json({ users: jsonSafe(visible), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { return apiError(error); }
}
