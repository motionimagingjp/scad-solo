// チェックイン後に提示する「今夜のソロ活アクティビティ」と、「ゲーム」タブの一覧、
// 両方で使う定義。場所の種類に応じて出し分ける(チェックイン後はノイズにならないよう最大3件)。
// ゲーム本体は5種(ドリンクルーレット・ソロチン・ソロビンゴ・ソロ乾杯・強制選曲モード)
// とも実装済み・仕様確定(status: "available")。coming_soonは今後ゲームを追加する際に
// 使う拡張用ステータスとして型に残しているだけで、現時点で該当するものは無い。
export type Activity = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: "available" | "coming_soon";
  href?: string;
};

const NOMI: Activity[] = [
  {
    id: "drink-roulette",
    emoji: "🍹",
    title: "ドリンクルーレット",
    description: "メニュー表や壁紙をスキャン→AIが4〜6択を選出→ルーレットで1つに決定",
    status: "available",
    href: "/games/drink-roulette",
  },
  { id: "solo-chin", emoji: "🎲", title: "ソロチン", description: "人数を入れてチンチロ勝負", status: "available", href: "/games/chinchiro" },
  { id: "solo-bingo", emoji: "🎯", title: "ソロビンゴ", description: "お題を達成してポイント", status: "available", href: "/games/solo-bingo" },
  { id: "kanpai-timer", emoji: "⏱", title: "ソロ乾杯", description: "飲みペースを記録", status: "available", href: "/games/kanpai-timer" },
];
const KARAOKE: Activity[] = [
  { id: "forced-song", emoji: "🎤", title: "強制選曲モード", description: "3曲から1曲、1番は必ず歌う", status: "available", href: "/games/forced-song" },
];

/** チェックイン後の画面用。場所の種類でどれを出すか絞る */
export function pickActivities(category: string, subCategories: string[]): Activity[] {
  if (subCategories.includes("カラオケ")) return KARAOKE;
  if (category === "SOLO_NOMI") return NOMI;
  return [];
}

/** 「ゲーム」タブ用。実装済みのゲームを全部並べる */
export const ALL_GAMES: Activity[] = [...NOMI, ...KARAOKE];
