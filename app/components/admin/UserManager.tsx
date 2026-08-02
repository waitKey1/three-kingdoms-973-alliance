"use client";

import { useEffect, useState } from "react";

type Alliance = { id: string; name: string };
type User = { id: string; phone: string; displayName: string | null; role: "REGION_ADMIN" | "ALLIANCE_ADMIN" | "ALLIANCE_MEMBER"; status: "PENDING" | "ACTIVE" | "DISABLED"; allianceId: string | null; alliance: Alliance | null; member: { name: string } | null; lastLoginAt: string | null };

export function UserManager({ regionAdmin, alliances }: { regionAdmin: boolean; alliances: Alliance[] }) {
  const [rows, setRows] = useState<User[]>([]); const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/admin/users?pageSize=100"); const data = await response.json(); if (response.ok) setRows(data.users); else setMessage(data.error); }
  useEffect(() => {
    void fetch("/api/admin/users?pageSize=100").then(async (response) => {
      const data = await response.json();
      if (response.ok) setRows(data.users); else setMessage(data.error);
    });
  }, []);
  async function update(user: User, changes: Record<string, unknown>) { const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }); const data = await response.json(); if (!response.ok) return setMessage(data.error); setMessage("已保存；该账户原有登录会话已注销。 "); await load(); }
  return <>{message && <p className="form-message">{message}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>账户</th><th>角色绑定</th><th>所属盟</th><th>权限</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map((user) => <tr key={user.id}><td><b>{user.displayName ?? "未设置昵称"}</b><small>{user.phone}</small></td><td>{user.member?.name ?? "待认领"}</td><td>{user.alliance?.name ?? "—"}</td><td><select value={user.role} onChange={(e) => update(user, { role: e.target.value })}><option value="ALLIANCE_MEMBER">盟成员</option><option value="ALLIANCE_ADMIN">盟管理 / 副管理</option>{regionAdmin && <option value="REGION_ADMIN">区管理</option>}</select></td><td><select value={user.status} onChange={(e) => update(user, { status: e.target.value })}><option value="PENDING">待审核</option><option value="ACTIVE">正常</option><option value="DISABLED">停用</option></select></td><td>{regionAdmin && <select value={user.allianceId ?? ""} onChange={(e) => update(user, { allianceId: e.target.value || null })}><option value="">不绑定盟</option>{alliances.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>}<button onClick={() => update(user, { revokeSessions: true })}>注销会话</button></td></tr>)}</tbody></table></div></>;
}
