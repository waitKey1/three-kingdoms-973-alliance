import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SiteNav } from "./components/SiteNav";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: { default: "973冰河盟府", template: "%s · 973冰河盟府" },
    description: "三国冰河时代973区联盟、迁盟与战斗编成管理中心。",
    openGraph: {
      title: "973冰河盟府",
      description: "三国冰河时代 · 联盟指挥台",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "973冰河盟府" }],
    },
    twitter: { card: "summary_large_image", title: "973冰河盟府", description: "三国冰河时代 · 联盟指挥台", images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body><SiteNav /><div className="site-shell">{children}</div></body>
    </html>
  );
}
