import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/server/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "ACTIVE" || user.role === "ALLIANCE_MEMBER") redirect("/account");
  return <div className="admin-shell">{children}</div>;
}
