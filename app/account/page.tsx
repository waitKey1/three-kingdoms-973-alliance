import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../components/LogoutButton";
import { getCurrentUser } from "../lib/server/session";
import { prisma } from "../lib/server/prisma";

export const metadata = { title: "个人中心" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const claim = await prisma.memberClaim.findFirst({ where: { userId: user.id }, include: { alliance: true, member: true }, orderBy: { createdAt: "desc" } });
  const maskedPhone = `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`;
  return <main className="inner-page account-page"><header className="inner-header"><div><span className="eyebrow">PERSONAL CENTER</span><h1>个人中心</h1><p>{maskedPhone} · {user.status === "ACTIVE" ? "账户已激活" : "等待角色认领"}</p></div><LogoutButton /></header>
    <section className="account-grid">
      <article><span>账户角色</span><b>{user.role === "REGION_ADMIN" ? "区管理" : user.role === "ALLIANCE_ADMIN" ? "盟管理" : "盟成员"}</b><small>{user.status === "PENDING" ? "待审核" : user.status === "DISABLED" ? "已停用" : "正常"}</small></article>
      <article><span>所属盟</span><b>{user.alliance?.name ?? "未绑定"}</b><small>{user.alliance?.roleLabel ?? "提交认领后由管理审核"}</small></article>
      <article><span>游戏角色</span><b>{user.member?.name ?? "未绑定"}</b><small>{user.member ? `全区战斗排名 #${user.member.battleRank}` : "一个账户最多绑定一个角色"}</small></article>
    </section>
    {user.status === "PENDING" && <section className="claim-status"><h2>角色认领</h2>{claim?.status === "PENDING" ? <p>已申请认领：{claim.alliance.name} · {claim.member.name}，等待盟管理审核。</p> : <p>{claim?.status === "REJECTED" ? `上次申请被驳回：${claim.rejectionReason ?? "未填写原因"}` : "尚未提交角色认领。"}</p>}<Link className="primary-action" href="/account/claim">{claim?.status === "PENDING" ? "查看 / 更换申请" : "提交认领"}</Link></section>}
    {user.status === "ACTIVE" && user.role !== "ALLIANCE_MEMBER" && <section className="claim-status"><h2>管理权限</h2><p>你可以进入管理后台处理权限范围内的名册、认领和审计记录。</p><Link className="primary-action" href="/admin">进入管理后台</Link></section>}
  </main>;
}
