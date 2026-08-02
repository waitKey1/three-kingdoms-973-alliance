"use client";

import { useMemo, useState } from "react";
import type { Member } from "../lib/data";
import { formatNumber } from "../lib/data";

export function MigrationBoard({ records }: { records: Member[] }) {
  const [filter, setFilter] = useState<"迁盟" | "候补" | "全部">("迁盟");
  const [search, setSearch] = useState("");
  const members = useMemo(() => records.filter((member) => {
    const statusMatch = filter === "全部" || (filter === "候补" ? member.建议盟 === "候补" : member.建议盟 !== member.当前盟 && member.建议盟 !== "候补");
    return statusMatch && (!search.trim() || member.成员名称.toLowerCase().includes(search.trim().toLowerCase()));
  }), [filter, records, search]);
  const flows = useMemo(() => ({
    huachenToLanting: records.filter((member) => member.当前盟 === "花晨" && member.建议盟 === "兰亭").length,
    linglongToLanting: records.filter((member) => member.当前盟 === "玲珑" && member.建议盟 === "兰亭").length,
    yanyunToLanting: records.filter((member) => member.当前盟 === "燕云" && member.建议盟 === "兰亭").length,
    lantingOutgoing: records.filter((member) => member.当前盟 === "兰亭" && member.建议盟 !== "兰亭" && member.建议盟 !== "候补").length,
  }), [records]);

  return (
    <>
      <div className="migration-flows">
        <div><span>花晨</span><b>{flows.huachenToLanting}</b><i>→ 兰亭</i></div>
        <div><span>玲珑</span><b>{flows.linglongToLanting}</b><i>→ 兰亭</i></div>
        <div><span>燕云</span><b>{flows.yanyunToLanting}</b><i>→ 兰亭</i></div>
        <div className="flow-out"><span>兰亭迁出</span><b>{flows.lantingOutgoing}</b><i>平衡三盟</i></div>
      </div>

      <section className="table-panel">
        <div className="table-toolbar">
          <div><span className="eyebrow">执行名册</span><h2>迁盟与候补管理 <em>{members.length}</em></h2></div>
          <div className="table-controls">
            <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索成员" aria-label="搜索迁盟成员" /></label>
            {(["迁盟", "候补", "全部"] as const).map((item) => (
              <button key={item} className={filter === item ? "filter-button active" : "filter-button"} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table migration-table">
            <thead><tr><th>成员</th><th>迁盟路径</th><th>总功勋</th><th>实力</th><th>战力</th><th>六维</th><th>评分</th><th>执行意见</th></tr></thead>
            <tbody>{members.map((member) => (
              <tr key={`${member.当前盟}-${member.编号}-${member.成员名称}`}>
                <td><b>{member.成员名称}</b><small>战斗排名 #{member.战斗排名}</small></td>
                <td><span className={member.建议盟 === "候补" ? "route-tag reserve" : "route-tag move"}>{member.迁盟动作}</span></td>
                <td>{formatNumber(member.总功勋)}</td><td>{formatNumber(member.实力)}</td><td>{formatNumber(member.战力)}</td><td>{formatNumber(member.六维和)}</td>
                <td><strong className="score">{member.战斗评分.toFixed(1)}</strong></td><td className="reason-cell">{member.分配理由}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
