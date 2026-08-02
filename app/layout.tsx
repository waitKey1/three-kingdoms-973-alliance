import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "./components/SiteNav";
import { getCurrentUser } from "./lib/server/session";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "973冰封三国", template: "%s · 973冰封三国" },
  description: "三国冰河时代973区联盟、迁盟与战斗编成管理中心。",
  openGraph: { title: "973冰封三国", description: "三国冰河时代 · 联盟指挥台", type: "website", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "973冰封三国", description: "三国冰河时代 · 联盟指挥台", images: ["/og.png"] },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="zh-CN">
      <body>
        <SiteNav viewer={user ? { displayName: user.displayName, role: user.role, status: user.status } : null} />
        <div className="site-shell">{children}</div>
      </body>
    </html>
  );
}
