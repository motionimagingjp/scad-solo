// チェックイン後に提示する「今夜のソロ活アクティビティ」と、「ゲーム」タブの一覧、
// 両方で使う定義。場所の種類に応じて出し分ける(チェックイン後はノイズにならないよう最大3件)。
// ゲーム本体はどれも未実装(すべて coming_soon)。
export type Activity = { id: string; emoji: string; title: string; description: string; status: "available" | "coming_soon" };

const NOMI: Activity[] = [
  { id: "kanpai-timer", emoji: "⏱", title: "一人乾杯タイマー", description: "飲みペースを記録", status: "coming_soon" },
  { id: "solo-chin", emoji: "🎲", title: "ソロチン", description: "人数を入れてチンチロ勝負", status: "coming_soon" },
  { id: "solo-bingo", emoji: "🎯", title: "ソロビンゴ", description: "お題を達成してポイント", status: "coming_soon" },
  {
    id: "drink-roulette",
    emoji: "🍹",
    title: "ドリンクルーレット",
    description: "メニュー表や壁紙をスキャン→AIが5〜6択を選出→ルーレットで1つに決定",
    status: "coming_soon",
  },
];
const KARAOKE: Activity[] = [
  { id: "forced-song", emoji: "🎤", title: "強制選曲モード", description: "3曲から1曲、1番は必ず歌う", status: "coming_soon" },
];

/** チェックイン後の画面用。場所の種類でどれを出すか絞る */
export function pickActivities(category: string, subCategories: string[]): Activity[] {
  if (subCategories.includes("カラオケ")) return KARAOKE;
  if (category === "SOLO_NOMI") return NOMI;
  return [];
}

/** 「ゲーム」タブ用。企画中のものを全部並べる */
export const ALL_GAMES: Activity[] = [...NOMI, ...KARAOKE];
