"use client";

import { useEffect, useState } from "react";

type Claim = { id: string; status: string; createdAt: string; user: { displayName: string | null; phone: string }; alliance: { name: string }; member: { name: string; externalNo: number | null; battleRank: number }; rejectionReason: string | null };

export function ClaimManager() {
  const [rows, setRows] = useState<Claim[]>([]); const [status, setStatus] = useState("PENDING"); const [message, setMessage] = useState("");
  async function load() { const response = await fetch(`/api/admin/claims?status=${status}`); const data = await response.json(); if (response.ok) setRows(data.claims); else setMessage(data.error); }
  useEffect(() => {
    void fetch(`/api/admin/claims?status=${status}`).then(async (response) => {
      const data = await response.json();
      if (response.ok) setRows(data.claims); else setMessage(data.error);
    });
  }, [status]);
  async function review(claim: Claim, action: "APPROVE" | "REJECT") { const rejectionReason = action === "REJECT" ? prompt("请输入驳回原因") : undefined; if (action === "REJECT" && !rejectionReason) return; if (action === "APPROVE" && !confirm(`确认将 ${claim.user.phone} 绑定为 ${claim.alliance.name} · ${claim.member.name}？`)) return; const response = await fetch(`/api/admin/claims/${claim.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, rejectionReason }) }); const data = await response.json(); if (!response.ok) return setMessage(data.error); setMessage(action === "APPROVE" ? "认领已通过，账户已激活并要求重新登录。" : "申请已驳回。"); await load(); }
  return <><div className="admin-toolbar"><div><h2>角色认领</h2><p>只显示权限范围内的申请。</p></div><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="PENDING">待审核</option><option value="APPROVED">已通过</option><option value="REJECTED">已驳回</option><option value="ALL">全部</option></select></div>{message && <p className="form-message">{message}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>申请账户</th><th>申请盟</th><th>角色</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map((claim) => <tr key={claim.id}><td><b>{claim.user.displayName ?? "新账户"}</b><small>{claim.user.phone}</small></td><td>{claim.alliance.name}</td><td><b>{claim.member.name}</b><small>编号 {claim.member.externalNo ?? "—"} · 排名 #{claim.member.battleRank}</small></td><td>{new Date(claim.createdAt).toLocaleString("zh-CN")}</td><td>{claim.status}</td><td>{claim.status === "PENDING" ? <><button onClick={() => review(claim, "APPROVE")}>通过</button><button className="danger" onClick={() => review(claim, "REJECT")}>驳回</button></> : claim.rejectionReason ?? "—"}</td></tr>)}</tbody></table></div></>;
}
