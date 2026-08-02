import { UserManager } from "../../components/admin/UserManager";
import { prisma } from "../../lib/server/prisma";
import { requireAdmin } from "../../lib/server/session";

export const metadata = { title: "账户权限" };
export default async function UsersPage() { const user = await requireAdmin(); const alliances = await prisma.alliance.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }); return <main className="admin-page"><header className="admin-header"><div><span className="eyebrow">ACCESS CONTROL</span><h1>账户与三级权限</h1><p>角色或状态变更会立即撤销该账户全部会话；系统保护最后一位区管理和本盟管理。</p></div></header><UserManager regionAdmin={user.role === "REGION_ADMIN"} alliances={alliances} /></main>; }
