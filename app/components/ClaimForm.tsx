"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Alliance = { id: string; name: string };
type Member = { id: string; name: string; allianceId: string; externalNo: number | null };

export function ClaimForm({ alliances, members }: { alliances: Alliance[]; members: Member[] }) {
  const router = useRouter();
  const [allianceId, setAllianceId] = useState(alliances[0]?.id ?? "");
  const filtered = useMemo(() => members.filter((member) => member.allianceId === allianceId), [allianceId, members]);
  const [memberId, setMemberId] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/account/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allianceId, memberId }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "提交失败");
    router.push("/account"); router.refresh();
  }
  return <form className="auth-form" onSubmit={submit}><label><span>当前所属盟</span><select value={allianceId} onChange={(e) => { setAllianceId(e.target.value); setMemberId(""); }}>{alliances.map((alliance) => <option key={alliance.id} value={alliance.id}>{alliance.name}</option>)}</select></label><label><span>游戏角色</span><select value={memberId} onChange={(e) => setMemberId(e.target.value)} required><option value="">请选择未绑定角色</option>{filtered.map((member) => <option key={member.id} value={member.id}>{member.name}{member.externalNo ? `（#${member.externalNo}）` : ""}</option>)}</select></label>{message && <p className="form-message">{message}</p>}<button className="primary-action auth-submit" disabled={!memberId}>提交审核</button></form>;
}
