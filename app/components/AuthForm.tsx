"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ purpose }: { purpose: "LOGIN" | "SETUP" }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/auth/sms/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, purpose, bootstrapToken: purpose === "SETUP" ? bootstrapToken : undefined }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "发送失败");
    setSent(true);
    setMessage(data.devMode ? "开发模式验证码请使用环境变量 SMS_DEV_CODE。" : "验证码已发送，5分钟内有效。");
  }

  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth/sms/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code, purpose, bootstrapToken: purpose === "SETUP" ? bootstrapToken : undefined }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "验证失败");
    router.push(data.redirectTo ?? "/account");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={verify}>
      {purpose === "SETUP" && <label><span>一次性初始化令牌</span><input type="password" value={bootstrapToken} onChange={(e) => setBootstrapToken(e.target.value)} autoComplete="off" required /></label>}
      <label><span>手机号</span><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="中国大陆手机号" required /></label>
      <div className="code-row"><label><span>短信验证码</span><input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6位验证码" required /></label><button type="button" onClick={requestCode} disabled={busy || phone.length !== 11}>{sent ? "重新发送" : "获取验证码"}</button></div>
      {message && <p className="form-message">{message}</p>}
      <button className="primary-action auth-submit" disabled={busy || code.length !== 6}>{busy ? "处理中…" : purpose === "SETUP" ? "创建首位区管理" : "登录 / 注册"}</button>
    </form>
  );
}
