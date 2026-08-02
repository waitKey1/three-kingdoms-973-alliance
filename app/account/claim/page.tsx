import { redirect } from "next/navigation";
import { ClaimForm } from "../../components/ClaimForm";
import { getCurrentUser } from "../../lib/server/session";
import { prisma } from "../../lib/server/prisma";

export const metadata = { title: "角色认领" };

export default async function ClaimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "ACTIVE") redirect("/account");
  const [alliances, members] = await Promise.all([
    prisma.alliance.findMany({ where: { deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
    prisma.allianceMember.findMany({ where: { deletedAt: null, boundUser: null }, select: { id: true, name: true, currentAllianceId: true, externalNo: true }, orderBy: [{ currentAllianceId: "asc" }, { name: "asc" }] }),
  ]);
  return <main className="auth-page"><section className="auth-card wide"><span className="eyebrow">MEMBER CLAIM</span><h1>认领游戏角色</h1><p>请选择角色当前实际所在盟。提交后，本盟管理或区管理会审核；同名角色可通过编号区分。</p><ClaimForm alliances={alliances} members={members.map((member) => ({ id: member.id, name: member.name, allianceId: member.currentAllianceId, externalNo: member.externalNo }))} /></section></main>;
}
