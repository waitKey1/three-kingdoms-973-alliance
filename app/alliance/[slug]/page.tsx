import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberTable } from "../../components/MemberTable";
import { ALLIANCE_SLUGS, allianceEntries, formatCompact, type AllianceSlug } from "../../lib/data";
import { getPublicMigrationData } from "../../lib/server/public-data";

export function generateStaticParams() {
  return allianceEntries.map(([slug]) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = ALLIANCE_SLUGS[slug as AllianceSlug];
  return { title: name ? `${name}盟管理` : "盟管理" };
}

export default async function AlliancePage({ params }: { params: Promise<{ slug: string }> }) {
  const migrationData = await getPublicMigrationData();
  const { slug } = await params;
  const alliance = ALLIANCE_SLUGS[slug as AllianceSlug];
  if (!alliance) notFound();
  const summary = migrationData.alliances.find((item) => item.alliance === alliance)!;
  const members = migrationData.records.filter((record) => record.建议盟 === alliance);
  const topMembers = [...members].sort((a, b) => a.战斗排名 - b.战斗排名).slice(0, 3);

  return (
    <main className="inner-page" style={{ "--accent": summary.color } as React.CSSProperties}>
      <header className="inner-header">
        <div><span className="eyebrow">ALLIANCE 0{summary.order}</span><h1>{alliance}<em>{summary.role}</em></h1><p>目标编成97人 · 当前{summary.currentCount}人 · 迁入{summary.incoming}人 · 迁出{summary.outgoing}人</p></div>
        <div className="header-actions"><Link href="/migration">查看迁盟路径</Link><a href="/api/public/export">下载实时表格</a></div>
      </header>

      <section className="metric-strip">
        <div><span>目标人数</span><b>{summary.targetCount}<small>/100</small></b><i style={{ width: `${summary.targetCount}%` }} /></div>
        <div><span>总功勋</span><b>{formatCompact(summary.targetMerit)}</b><small>{summary.targetMerit.toLocaleString("zh-CN")}</small></div>
        <div><span>平均实力</span><b>{formatCompact(summary.averageStrength)}</b><small>{summary.averageStrength.toLocaleString("zh-CN")}</small></div>
        <div><span>平均战力</span><b>{formatCompact(summary.averagePower)}</b><small>{summary.averagePower.toLocaleString("zh-CN")}</small></div>
        <div><span>平均六维</span><b>{summary.averageSix?.toLocaleString("zh-CN") ?? "—"}</b><small>仅统计有六维成员</small></div>
      </section>

      <section className="vanguard">
        <div className="section-heading"><div><span className="eyebrow">VANGUARD</span><h2>盟内战力先锋</h2></div><p>按全区战斗评分排名</p></div>
        <div className="vanguard-grid">{topMembers.map((member, index) => (
          <article key={member.编号}><span>0{index + 1}</span><div><b>{member.成员名称}</b><small>全区 #{member.战斗排名} · 六维 {member.六维和?.toLocaleString("zh-CN") ?? "—"}</small></div><strong>{member.战斗评分.toFixed(1)}</strong></article>
        ))}</div>
      </section>

      <MemberTable members={members} />
    </main>
  );
}
