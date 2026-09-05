// SCADグループアプリの紹介データ
// マイページのエコシステムセクションで使用。ここだけ編集すればアプリの追加/変更が可能。

export type ScadApp = {
  id: string;
  name: string;
  tagline: string;
  benefit: string; // 「あなたに合うおすすめ」文脈での訴求ポイント(1アプリ1メリット)
  url: string;
  isCurrent?: boolean;
};

export const SCAD_APPS: ScadApp[] = [
  {
    id: "scad-solo",
    name: "SCAD-SOLO",
    tagline: "ソロ活・ソロ飲みナビ",
    benefit: "今使っているアプリです",
    url: "/",
    isCurrent: true,
  },
  {
    id: "scad-beauty",
    name: "SCAD-BEAUTY",
    tagline: "おひとり様歓迎サロン",
    benefit: "ソロ活の後に立ち寄れる美容室を探せます",
    url: "https://scad-beauty.example.com",
  },
  {
    id: "scad-chat",
    name: "SCAD-CHAT",
    tagline: "AIチャットプラットフォーム",
    benefit: "今日の気分に合う店をAIに相談できます",
    url: "https://scad-chat.example.com",
  },
];

// ランク昇格しきい値(prisma/schema.prisma の SoloRank と対応)
export const RANK_THRESHOLDS = {
  BEGINNER: { min: 1, max: 3, label: "ソロ活はじめました" },
  REGULAR: { min: 4, max: 9, label: "ソロ飲みレギュラー" },
  MASTER: { min: 10, max: Infinity, label: "ソロ活マスター" },
} as const;

// エコシステムセクションを表示する最低来店数(離脱防止のためのゲート条件)
export const ECOSYSTEM_REVEAL_THRESHOLD = 3;

// ソロ活記念日通知のマイルストーン(来店数ベース)。実績は UserAchievement に "visit:<count>" キーで保存する
export type Milestone = { count: number; label: string; message: string };

export const ANNIVERSARY_MILESTONES: Milestone[] = [
  { count: 3, label: "ソロ活はじめました", message: "はじめての3回来店、おめでとう!" },
  { count: 10, label: "ソロ活マスター突入", message: "来店10回達成。もう立派なソロマスターです。" },
  { count: 30, label: "ソロ活30回記念", message: "30回来店達成!常連の域に入ってきました。" },
  { count: 50, label: "ソロ飲み50回達成", message: "50回達成の大台。お疲れさまでした。" },
  { count: 100, label: "ソロ活100回達成", message: "ついに100回。もはやソロ活の伝説です。" },
];

// 同一店で何回来店したら「常連」実績を付与するか(常連バッジは記念日通知に統合済み)
export const REGULAR_VISITS_PER_SPOT = 3;
