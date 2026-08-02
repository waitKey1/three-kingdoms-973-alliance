import { AllianceManager } from "../../components/admin/AllianceManager";
import { requireAdmin } from "../../lib/server/session";
import { prisma } from "../../lib/server/prisma";

export const metadata = { title: "盟管理" };
export default async function AlliancesPage() { const user = await requireAdmin(); const rows = await prisma.alliance.findMany({ where: user.role === "REGION_ADMIN" ? { deletedAt: null } : { id: user.allianceId ?? "", deletedAt: null }, include: { _count: { select: { currentMembers: { where: { deletedAt: null } }, targetMembers: { where: { deletedAt: null, migrationStatus: { not: "RESERVE" } } }, users: { where: { deletedAt: null } } } } }, orderBy: { sortOrder: "asc" } }); return <main className="admin-page"><header className="admin-header"><div><span className="eyebrow">ALLIANCE CONTROL</span><h1>盟管理</h1><p>{user.role === "REGION_ADMIN" ? "维护全区同盟、容量与展示顺序。" : "编辑本盟展示定位和主题颜色。"}</p></div></header><AllianceManager initial={rows.map((row) => ({ ...row, createdAt: undefined, updatedAt: undefined })) as never} regionAdmin={user.role === "REGION_ADMIN"} /></main>; }
