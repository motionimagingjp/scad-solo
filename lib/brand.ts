// 会社共有用デモ版(MIRAI-Dev-Solo)と本番でブランド名・外部リンクを切り替える定義。
//
// デモ版のVercelプロジェクトにのみ環境変数 NEXT_PUBLIC_APP_VARIANT=demo を設定する。
// NEXT_PUBLIC_ 接頭辞はビルド時にインライン化されるため、サーバーコンポーネント
// (layout の metadata)とクライアントコンポーネントの両方から同じ値を参照できる。
//
// デモ版の方針:
//   - 個人アカウントに繋がる外部リンクは一切張らない(SNSアイコンは表示のみ)
//   - 姉妹アプリ導線はデモ版同士で閉じ、デモから本番サイトへ着地させない
//   - DBは本番と共有するため、来店ログが本番の記録に混ざらないよう userId を分ける
export const IS_DEMO = process.env.NEXT_PUBLIC_APP_VARIANT === "demo";

type Brand = {
  appName: string;
  description: string;
  shareText: string;
  /** 来店ログ・実績の保存先を分けるための暫定ユーザーID(lib/auth.ts の x-user-id に対応) */
  userId: string;
  seriesLabel: string;
  beautyName: string;
  beautyUrl: string;
  chatName: string;
  chatUrl: string;
  /** url が null のSNSはアイコンのみ表示し、リンクを張らない */
  sns: { label: string; url: string | null }[];
  /** 「私について」の文面。デモ版では個人の背景に踏み込まない表現にする */
  story: string;
  /** マイページのエコシステムセクション見出し。本番は開発者個人のInstagramハンドルを含む */
  ecosystemContact: string;
};

const PRODUCTION: Brand = {
  appName: "Tokyo Solo Club",
  description: "今夜のソロ飲みを1秒で決める",
  shareText: "一人でも気兼ねなく行ける店が、すぐ見つかる。SCAD-SOLO",
  userId: "demo-user",
  seriesLabel: "SCADシリーズ",
  beautyName: "SCAD-BEAUTY",
  beautyUrl: "https://scad-beauty.vercel.app/",
  chatName: "SCAD-CHAT",
  chatUrl: "https://scad-chat.vercel.app/",
  sns: [{ label: "X (旧Twitter)", url: "https://x.com/jakeimages" }],
  story:
    "一人で飲みに行きたい日はあるのに、「入りにくそう」「浮きそう」で結局いつもの店に戻ってしまう。そんな経験から、カウンター席があって一人客に慣れた店だけを集めたら、もっと気軽に新しい店に挑戦できるはずだと思い、個人でこのアプリを開発しています。",
  ecosystemContact: "✉️ @motion.imaging がおすすめする関連サービス",
};

const DEMO: Brand = {
  appName: "MIRAI-Dev-Solo",
  description: "今夜のソロ飲みを1秒で決める",
  shareText: "一人でも気兼ねなく行ける店が、すぐ見つかる。MIRAI-Dev-Solo",
  // 本番の来店ログと混ざらないよう、デモ版は別のユーザーIDで記録する
  userId: "mirai-demo-user",
  seriesLabel: "MIRAI-Dev-Appsシリーズ",
  beautyName: "MIRAI-Dev-Beauty",
  beautyUrl: "https://mirai-dev-beauty.vercel.app/",
  chatName: "MIRAI-Dev-Chat",
  chatUrl: "https://mirai-dev-chat.vercel.app/",
  sns: [{ label: "X (旧Twitter)", url: null }],
  story:
    "一人で飲みに行きたい日はあるのに、「入りにくそう」「浮きそう」で結局いつもの店に戻ってしまう。そんな状況を解消するため、カウンター席があって一人客に慣れた店だけを集め、気軽に新しい店へ挑戦できるようにしたアプリです。",
  // 開発者個人のSNSハンドルを含めないよう、一般的な表現にする
  ecosystemContact: "✉️ 関連サービスのご紹介",
};

export const BRAND: Brand = IS_DEMO ? DEMO : PRODUCTION;

/** APIリクエストに付与する暫定の認証ヘッダ(本番/デモで記録先を分ける) */
export const USER_HEADERS = { "x-user-id": BRAND.userId } as const;
