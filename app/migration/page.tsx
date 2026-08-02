import type { Metadata } from "next";
import { MigrationBoard } from "../components/MigrationBoard";
import { getPublicMigrationData } from "../lib/server/public-data";

export const metadata: Metadata = { title: "迁盟管理" };

export const dynamic = "force-dynamic";

export default async function MigrationPage() {
  const migrationData = await getPublicMigrationData();
  return (
    <main className="inner-page migration-page">
      <header className="inner-header migration-header">
        <div><span className="eyebrow">MIGRATION COMMAND</span><h1>迁盟管理<em>四盟97人编成</em></h1><p>先释放位置，再补强兰亭；全程保持每盟不超过100人。</p></div>
        <a className="download-button" href="/api/public/export">下载实时迁盟表 ↓</a>
      </header>

      <section className="migration-kpis">
        <div><span>当前总人数</span><b>{migrationData.stats.total}</b><small>四盟合计</small></div>
        <div><span>正式编成</span><b>{migrationData.stats.assigned}</b><small>97 × 4</small></div>
        <div><span>需要迁盟</span><b>{migrationData.stats.moves}</b><small>47条执行项</small></div>
        <div><span>候补待确认</span><b>{migrationData.stats.reserves}</b><small>优先核实活跃度</small></div>
      </section>

      <section className="execution-notice">
        <span>执行原则</span>
        <p><b>01</b>先确认候补3人</p><i />
        <p><b>02</b>兰亭先迁出25人</p><i />
        <p><b>03</b>22名战斗成员入兰亭</p><i />
        <p><b>04</b>复核四盟各97人</p>
      </section>
      <MigrationBoard records={migrationData.records} />
    </main>
  );
}
