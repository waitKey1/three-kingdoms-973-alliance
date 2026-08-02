import { MemberManager } from "../../components/admin/MemberManager";
import { prisma } from "../../lib/server/prisma";
import { requireAdmin } from "../../lib/server/session";

export const metadata = { title: "成员管理" };
export default async function MembersPage() { const user = await requireAdmin(); const alliances = await prisma.alliance.findMany({ where: { deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }); return <main className="admin-page"><header className="admin-header"><div><span className="eyebrow">ROSTER CONTROL</span><h1>成员与迁盟</h1><p>六维、功勋、实力或战力修改后，全区评分与排名自动重算。</p></div></header><MemberManager alliances={alliances} regionAdmin={user.role === "REGION_ADMIN"} scopeAllianceId={user.allianceId ?? ""} /></main>; }
