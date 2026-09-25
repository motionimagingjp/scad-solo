// MOTION IMAGINGシリーズ共通の「私について」「アプリ一覧」「お問い合わせ・SNS」データ。
// 実体はmotionimagingリポジトリで管理しており、アプリ名や紹介文の変更はそちら側だけで完結する。
const SHARED_ABOUT_URL = "https://motionimaging.vercel.app/api/shared-about";

export type SharedApp = {
  id: string;
  emoji: string;
  name: string;
  sub: string;
  prodUrl: string;
  demoUrl?: string;
};

export type SharedSns = { label: string; icon: string; url: string };

export type SharedAbout = {
  me: { name: string; text: string };
  apps: SharedApp[];
  sns: SharedSns[];
};

// motionimaging側のAPIに到達できない場合だけ使う最終フォールバック（表示が空にならないための保険）。
const FALLBACK: SharedAbout = {
  me: {
    name: "はじめまして",
    text: "空いた時間で「あったら便利・楽しい」と思ったWebアプリを、企画からリリースまで一人で手がけています。",
  },
  apps: [
    { id: "sukuado", emoji: "💬", name: "SCAD CHAT", sub: "恋活・婚活AIチャット", prodUrl: "https://scad-chat.vercel.app", demoUrl: "https://mirai-dev-chat.vercel.app" },
    { id: "beauty", emoji: "✂️", name: "イロナビ", sub: "パーソナルカラー診断", prodUrl: "https://scad-beauty.vercel.app", demoUrl: "https://mirai-dev-beauty.vercel.app" },
    { id: "solo", emoji: "🍶", name: "ヨイナビ", sub: "今夜の店探し", prodUrl: "https://scad-solo.vercel.app", demoUrl: "https://mirai-dev-solo.vercel.app" },
    { id: "partyconnect", emoji: "🎉", name: "SCADコネクト", sub: "街コン運営サポートシステム", prodUrl: "https://scad-partyconnect.vercel.app/" },
    { id: "migoron", emoji: "🌸", name: "ミゴロンナビ", sub: "花見・花スポット検索", prodUrl: "https://motionimaging.vercel.app/migoron" },
  ],
  sns: [
    { label: "Instagram", icon: "instagram", url: "https://www.instagram.com/motion.imaging/" },
    { label: "X", icon: "x", url: "https://x.com/motion_imaging" },
  ],
};

export async function getSharedAbout(): Promise<SharedAbout> {
  try {
    const res = await fetch(SHARED_ABOUT_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as SharedAbout;
  } catch {
    return FALLBACK;
  }
}
