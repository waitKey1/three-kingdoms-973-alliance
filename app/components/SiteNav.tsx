"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { allianceEntries } from "../lib/data";

type Viewer = { displayName: string | null; role: "REGION_ADMIN" | "ALLIANCE_ADMIN" | "ALLIANCE_MEMBER"; status: "PENDING" | "ACTIVE" | "DISABLED" } | null;

export function SiteNav({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const publicItems = [
    { href: "/", label: "总览", mark: "九" },
    { href: "/migration", label: "迁盟管理", mark: "迁" },
  ];
  const adminItems = [
    { href: "/admin", label: "后台总览", mark: "总" },
    { href: "/admin/alliances", label: "盟管理", mark: "盟" },
    { href: "/admin/members", label: "成员管理", mark: "员" },
    { href: "/admin/users", label: "账户权限", mark: "权" },
    { href: "/admin/claims", label: "认领审核", mark: "审" },
    { href: "/admin/audit", label: "审计日志", mark: "记" },
  ];

  return (
    <aside className={`site-nav ${isAdmin ? "admin-nav" : ""}`}>
      <Link href={isAdmin ? "/admin" : "/"} className="brand" aria-label="返回973区管理首页">
        <span className="brand-seal" aria-hidden="true" />
        <span><b>{isAdmin ? "管理中枢" : "冰封三国"}</b><small>THREE KINGDOMS · 973</small></span>
      </Link>
      <nav aria-label="主导航">
        <p className="nav-kicker">{isAdmin ? "管理后台" : "指挥中枢"}</p>
        {(isAdmin ? adminItems : publicItems).map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}><span>{item.mark}</span>{item.label}</Link>
        ))}
        {!isAdmin && <p className="nav-kicker nav-section">盟管理</p>}
        {!isAdmin && allianceEntries.map(([slug, alliance], index) => {
          const href = `/alliance/${slug}`;
          return <Link key={slug} href={href} className={pathname === href ? "active" : ""}><span>{index + 1}</span>{alliance}{index === 0 ? " · 战斗" : ""}</Link>;
        })}
        {!isAdmin && <p className="nav-kicker nav-section">账户</p>}
        {!isAdmin && <Link href={viewer ? "/account" : "/login"} className={pathname.startsWith("/account") || pathname === "/login" ? "active" : ""}><span>户</span>{viewer ? "个人中心" : "登录 / 注册"}</Link>}
        {!isAdmin && viewer?.status === "ACTIVE" && viewer.role !== "ALLIANCE_MEMBER" && <Link href="/admin"><span>管</span>管理后台</Link>}
        {isAdmin && <Link href="/"><span>返</span>返回公开站</Link>}
      </nav>
      <div className="nav-status"><i /><span><b>{viewer ? (viewer.displayName ?? "已登录") : "数据已就绪"}</b><small>{viewer ? roleLabel(viewer) : "2026-08-02 · 391人"}</small></span></div>
    </aside>
  );
}

function roleLabel(viewer: NonNullable<Viewer>) {
  if (viewer.status === "PENDING") return "待认领审核";
  if (viewer.role === "REGION_ADMIN") return "区管理";
  if (viewer.role === "ALLIANCE_ADMIN") return "盟管理";
  return "盟成员";
}
