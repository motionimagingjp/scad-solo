import type { Metadata } from "next";
import "./globals.css";

// og:image等の絶対URL解決に必要。VercelのProduction URLを優先し、
// プレビュー環境ではVERCEL_URL、ローカルではlocalhostにフォールバックする
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

// 開発コード名は SCAD-SOLO のまま維持。ユーザーに見せるブランド名のみ
// Tokyo Solo Club を使用する(対象エリアを東京23区中心に絞った命名)。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tokyo Solo Club",
  description: "今夜のソロ飲みを1秒で決める",
  openGraph: {
    title: "Tokyo Solo Club",
    description: "今夜のソロ飲みを1秒で決める",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokyo Solo Club",
    description: "今夜のソロ飲みを1秒で決める",
  },
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
