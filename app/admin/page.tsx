import Link from "next/link";
import { prisma } from "../lib/server/prisma";
import { requireAdmin } from "../lib/server/session";

export const metadata = { title: "管理后台" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const memberWhere = user.role === "REGION_ADMIN" ? { deletedAt: null } : { deletedAt: null, currentAllianceId: user.allianceId ?? "" };
  const claimWhere = user.role === "REGION_ADMIN" ? { status: "PENDING" as const } : { status: "PENDING" as const, allianceId: user.allianceId ?? "" };
  const [members, migrations, pendingClaims, users, merit] = await Promise.all([
    prisma.allianceMember.count({ where: memberWhere }),
    prisma.allianceMember.count({ where: { ...memberWhere, migrationStatus: "MOVE" } }),
    prisma.memberClaim.count({ where: claimWhere }),
    prisma.user.count({ where: user.role === "REGION_ADMIN" ? { deletedAt: null } : { deletedAt: null, allianceId: user.allianceId } }),
    prisma.allianceMember.aggregate({ where: memberWhere, _sum: { totalMerit: true } }),
  ]);
  return <main className="admin-page"><header className="admin-header"><div><span className="eyebrow">COMMAND CONSOLE</span><h1>{user.role === "REGION_ADMIN" ? "973区管理总览" : `${user.alliance?.name}盟管理`}</h1><p>所有修改即时生效、写入审计，并同步刷新公开页和实时 Excel。</p></div><span className="role-badge">{user.role === "REGION_ADMIN" ? "区管理" : "盟管理"}</span></header>
    <section className="admin-kpis"><article><span>在册成员</span><b>{members}</b><small>当前权限范围</small></article><article><span>迁盟成员</span><b>{migrations}</b><small>待执行路径</small></article><article><span>待审核认领</span><b>{pendingClaims}</b><small>需要处理</small></article><article><span>账户数</span><b>{users}</b><small>含待审核</small></article><article><span>总功勋</span><b>{Number(merit._sum.totalMerit ?? 0n).toLocaleString("zh-CN")}</b><small>当前名册</small></article></section>
    <section className="admin-links"><Link href="/admin/members"><b>成员与迁盟</b><span>新增、编辑、软删除和跨盟建议 →</span></Link><Link href="/admin/claims"><b>角色认领审核</b><span>{pendingClaims} 条待处理申请 →</span></Link><Link href="/admin/users"><b>账户与权限</b><span>任命副管理、停用和注销会话 →</span></Link><Link href="/admin/audit"><b>审计日志</b><span>查看每一次后台修改 →</span></Link></section>
  </main>;
}
