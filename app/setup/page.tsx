import { notFound, redirect } from "next/navigation";
import { AuthForm } from "../components/AuthForm";
import { getCurrentUser } from "../lib/server/session";
import { bootstrapAvailable } from "../lib/server/sms";

export const metadata = { title: "系统初始化" };

export default async function SetupPage() {
  if (await getCurrentUser()) redirect("/account");
  if (!await bootstrapAvailable()) notFound();
  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">ONE-TIME SETUP</span><h1>初始化区管理</h1><p>此入口只允许成功一次。需要部署环境中的初始化令牌和短信验证，成功后永久关闭。</p><AuthForm purpose="SETUP" /></section></main>;
}
