import { NextResponse } from "next/server";
import { apiError, jsonSafe } from "@/app/lib/server/http";
import { prisma } from "@/app/lib/server/prisma";
import { requireAdmin } from "@/app/lib/server/session";

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(); const url = new URL(request.url); const page = Math.max(Number(url.searchParams.get("page")) || 1, 1); const pageSize = 50;
    const where = actor.role === "REGION_ADMIN" ? {} : { allianceId: actor.allianceId ?? "" };
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, include: { actor: { select: { displayName: true, phone: true } }, alliance: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auditLog.count({ where }),
    ]);
    return NextResponse.json({ logs: jsonSafe(logs), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) { return apiError(error); }
}
