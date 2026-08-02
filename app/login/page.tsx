import { redirect } from "next/navigation";
import { AuthForm } from "../components/AuthForm";
import { getCurrentUser } from "../lib/server/session";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/account");
  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">ACCOUNT ACCESS</span><h1>登录 973 盟库</h1><p>新手机号验证成功后自动注册。首次登录需提交游戏角色认领，由本盟管理审核。</p><AuthForm purpose="LOGIN" /></section></main>;
}
