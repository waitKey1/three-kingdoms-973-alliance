import Link from "next/link";
import { ThreeHero } from "./components/ThreeHero";
import { formatCompact, getAllianceSlug } from "./lib/data";
import { getPublicMigrationData } from "./lib/server/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const migrationData = await getPublicMigrationData();
  const lanting = migrationData.alliances[0];
  const meritGrowth = ((lanting.targetMerit / lanting.currentMerit - 1) * 100).toFixed(1);
  const currentStrength = migrationData.records.filter((record) => record.当前盟 === "兰亭").reduce((sum, record) => sum + record.实力, 0) / 100;
  const strengthGrowth = ((lanting.averageStrength / currentStrength - 1) * 100).toFixed(1);
  const currentSixRecords = migrationData.records.filter((record) => record.当前盟 === "兰亭" && record.六维和 !== null);
  const currentSixAverage = currentSixRecords.reduce((sum, record) => sum + (record.六维和 ?? 0), 0) / currentSixRecords.length;
  const targetSixAverage = lanting.averageSix ?? 0;
  const sixGrowth = targetSixAverage > 0 && currentSixAverage > 0 ? ((targetSixAverage / currentSixAverage - 1) * 100).toFixed(1) : null;

  return (
    <main>
      <section className="hero">
        <ThreeHero />
        <div className="hero-grid" />
        <div className="hero-copy">
          <span className="hero-kicker"><i /> 三国冰河时代 · 973区</span>
          <h1>山河为局，<br /><em>盟心为刃。</em></h1>
          <p>四盟统筹、战力编成与迁盟执行的统一指挥台。<br />以实时名单为底，以战斗评分为尺。</p>
          <div className="hero-actions">
            <Link href="/migration" className="primary-action">查看迁盟方案 <span>→</span></Link>
            <a href="/api/public/export" className="secondary-action">下载实时表格</a>
          </div>
        </div>
        <div className="hero-signal"><span>01</span><b>一盟作战态势</b><strong>READY</strong></div>
        <div className="hero-stats">
          <div><span>四盟编成</span><b>{migrationData.stats.assigned}</b><small>97 × 4</small></div>
          <div><span>迁盟执行</span><b>{migrationData.stats.moves}</b><small>待迁人员</small></div>
          <div><span>六维覆盖</span><b>{migrationData.stats.sixMatched}</b><small>已匹配成员</small></div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading"><div><span className="eyebrow">ALLIANCE MATRIX</span><h2>四盟编成态势</h2></div><p>目标容量固定为97人，保留3个机动位置，避免临时满员。</p></div>
        <div className="alliance-grid">
          {migrationData.alliances.map((item) => (
            <Link href={`/alliance/${getAllianceSlug(item.alliance)}`} className="alliance-card" key={item.alliance} style={{ "--accent": item.color } as React.CSSProperties}>
              <div className="card-top"><span>0{item.order}</span><i /> <small>{item.role}</small></div>
              <h3>{item.alliance}</h3>
              <div className="capacity"><span><b>{item.targetCount}</b> / 100</span><small>目标容量</small></div>
              <div className="capacity-track"><i style={{ width: `${item.targetCount}%` }} /></div>
              <div className="card-metrics"><span>迁入 <b>+{item.incoming}</b></span><span>迁出 <b>-{item.outgoing}</b></span><span>均战 <b>{formatCompact(item.averagePower)}</b></span></div>
              <footer><span>进入盟管理</span><b>↗</b></footer>
            </Link>
          ))}
        </div>
      </section>

      <section className="command-grid">
        <div className="battle-card">
          <span className="eyebrow">BATTLE CORE</span><h2>兰亭一盟强化</h2>
          <div className="battle-ring"><div><b>97</b><span>战斗主盟</span></div></div>
          <div className="battle-gains">
            <div><span>总功勋</span><b>+{meritGrowth}%</b><small>{formatCompact(lanting.targetMerit)}</small></div>
            <div><span>平均实力</span><b>+{strengthGrowth}%</b><small>{formatCompact(lanting.averageStrength)}</small></div>
            <div><span>平均六维</span><b>{targetSixAverage > 0 ? targetSixAverage.toLocaleString("zh-CN") : "—"}</b><small>{sixGrowth === null ? "暂无完整数据" : `${Number(sixGrowth) >= 0 ? "+" : ""}${sixGrowth}%`}</small></div>
          </div>
        </div>
        <div className="orders-card">
          <div className="section-heading"><div><span className="eyebrow">EXECUTION ORDER</span><h2>迁盟军令</h2></div><Link href="/migration">完整清单 →</Link></div>
          <ol>
            <li><b>壹</b><span><strong>确认候补</strong><small>核实{migrationData.stats.reserves}个低活跃账号，未确认前不直接清退。</small></span></li>
            <li><b>贰</b><span><strong>先腾位置</strong><small>兰亭迁出{lanting.outgoing}人，与三盟反向迁移同步执行。</small></span></li>
            <li><b>叁</b><span><strong>补强主盟</strong><small>{lanting.incoming}人按战斗排名进入兰亭，任何时点不超过100人。</small></span></li>
            <li><b>肆</b><span><strong>最终复核</strong><small>核对同名、改名及四盟97人闭环。</small></span></li>
          </ol>
        </div>
      </section>
    </main>
  );
}
