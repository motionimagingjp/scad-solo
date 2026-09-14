import type { Metadata } from "next";
import "./globals.css";
import { BRAND, IS_DEMO } from "@/lib/brand";

// og:image等の絶対URL解決に必要。VercelのProduction URLを優先し、
// プレビュー環境ではVERCEL_URL、ローカルではlocalhostにフォールバックする
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

// 開発コード名は SCAD-SOLO のまま維持。ユーザーに見せるブランド名のみ
// Tokyo Solo Club を使用する(対象エリアを東京23区中心に絞った命名)。
// 会社共有用デモ版では lib/brand.ts 側で MIRAI-Dev-Solo に切り替わる。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: BRAND.appName,
  description: BRAND.description,
  openGraph: {
    title: BRAND.appName,
    description: BRAND.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.appName,
    description: BRAND.description,
  },
  // デモ版は本番サイトと検索結果で競合させないためインデックスさせない
  ...(IS_DEMO ? { robots: { index: false, follow: false } } : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
