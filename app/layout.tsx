import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND, IS_DEMO } from "@/lib/brand";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

// og:image等の絶対URL解決に必要。VercelのProduction URLを優先し、
// プレビュー環境ではVERCEL_URL、ローカルではlocalhostにフォールバックする
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

// 開発コード名は SCAD-SOLO のまま維持。ユーザーに見せるブランド名のみ
// ヨイナビ を使用する(ソロ限定の命名だったTokyo Solo Clubから、
// ソロ・グループ・デートのシーン拡張に合わせて2026年9月に改名)。
// 会社共有用デモ版では lib/brand.ts 側で MIRAI-Dev-Solo に切り替わる。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: BRAND.appName,
  description: BRAND.description,
  openGraph: {
    title: BRAND.appName,
    description: BRAND.description,
    type: "website",
    images: [BRAND.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.appName,
    description: BRAND.description,
    images: [BRAND.ogImage.url],
  },
  // ホーム画面に追加したとき、Safariのアドレスバーなしで単独アプリとして起動させる
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.appName,
  },
  // デモ版は本番サイトと検索結果で競合させないためインデックスさせない
  ...(IS_DEMO ? { robots: { index: false, follow: false } } : {}),
};

// viewportFit:"cover" が無いと、ノッチ/ダイナミックアイランド付きiPhoneでSafariが
// env(safe-area-inset-*)を有効化せず、BottomNav・PwaInstallPromptの余白計算が0扱いになり
// 画面いっぱいに表示されない(上下に隙間ができる/ホームバーに被る)ことがあったため追加。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
