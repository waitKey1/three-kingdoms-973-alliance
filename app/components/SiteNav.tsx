"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { allianceEntries } from "../lib/data";

export function SiteNav() {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "总览", mark: "九" },
    { href: "/migration", label: "迁盟管理", mark: "迁" },
  ];

  return (
    <aside className="site-nav">
      <Link href="/" className="brand" aria-label="返回973区管理首页">
        <span className="brand-seal">973</span>
        <span><b>冰河盟府</b><small>THREE KINGDOMS · 973</small></span>
      </Link>

      <nav aria-label="主导航">
        <p className="nav-kicker">指挥中枢</p>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
            <span>{item.mark}</span>{item.label}
          </Link>
        ))}
        <p className="nav-kicker nav-section">盟管理</p>
        {allianceEntries.map(([slug, alliance], index) => {
          const href = `/alliance/${slug}`;
          return (
            <Link key={slug} href={href} className={pathname === href ? "active" : ""}>
              <span>{index + 1}</span>{alliance}{index === 0 ? " · 战斗" : ""}
            </Link>
          );
        })}
      </nav>

      <div className="nav-status">
        <i />
        <span><b>数据已就绪</b><small>2026-08-02 · 391人</small></span>
      </div>
    </aside>
  );
}
