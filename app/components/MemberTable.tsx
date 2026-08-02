"use client";

import { useMemo, useState } from "react";
import type { Member } from "../lib/data";
import { formatNumber } from "../lib/data";

type SortKey = "战斗排名" | "总功勋" | "实力" | "六维和";

export function MemberTable({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("战斗排名");
  const [movesOnly, setMovesOnly] = useState(false);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return members
      .filter((member) => !movesOnly || member.迁盟动作 !== "留盟")
      .filter((member) => !keyword || member.成员名称.toLowerCase().includes(keyword))
      .sort((a, b) => sortKey === "战斗排名"
        ? a.战斗排名 - b.战斗排名
        : Number(b[sortKey] || 0) - Number(a[sortKey] || 0));
  }, [members, movesOnly, search, sortKey]);

  return (
    <section className="table-panel">
      <div className="table-toolbar">
        <div>
          <span className="eyebrow">成员编成</span>
          <h2>目标盟成员名单 <em>{filtered.length}</em></h2>
        </div>
        <div className="table-controls">
          <label className="search-box">
            <span>⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索成员名称" aria-label="搜索成员名称" />
          </label>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} aria-label="排序字段">
            <option value="战斗排名">按战斗排名</option>
            <option value="总功勋">按总功勋</option>
            <option value="实力">按实力</option>
            <option value="六维和">按六维和</option>
          </select>
          <button className={movesOnly ? "filter-button active" : "filter-button"} onClick={() => setMovesOnly((value) => !value)}>
            {movesOnly ? "显示迁入" : "仅看迁入"}
          </button>
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr>
            <th>排名</th><th>成员</th><th>当前 → 建议</th><th>总功勋</th><th>实力</th><th>战力</th><th>六维</th><th>评分</th><th>分配意见</th>
          </tr></thead>
          <tbody>
            {filtered.map((member) => (
              <tr key={`${member.当前盟}-${member.编号}-${member.成员名称}`}>
                <td className="rank-cell">#{member.战斗排名}</td>
                <td><b>{member.成员名称}</b><small>{member.火炉等级} · 阶级{member.阶级}</small></td>
                <td><span className={member.迁盟动作 === "留盟" ? "route-tag stay" : "route-tag move"}>{member.迁盟动作}</span></td>
                <td>{formatNumber(member.总功勋)}</td>
                <td>{formatNumber(member.实力)}</td>
                <td>{formatNumber(member.战力)}</td>
                <td>{formatNumber(member.六维和)}</td>
                <td><strong className="score">{member.战斗评分.toFixed(1)}</strong></td>
                <td className="reason-cell">{member.分配理由}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
