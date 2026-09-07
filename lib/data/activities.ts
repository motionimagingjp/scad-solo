// チェックイン後に提示する「今夜のソロ活アクティビティ」。
// 場所の種類に応じて出し分ける(ノイズにならないよう最大3件)。ゲーム本体は後続フェーズで実装。
export type Activity = { id: string; emoji: string; title: string; description: string; status: "available" | "coming_soon" };

const NOMI: Activity[] = [
  { id: "kanpai-timer", emoji: "⏱", title: "一人乾杯タイマー", description: "飲みペースを記録", status: "coming_soon" },
  { id: "solo-chin", emoji: "🎲", title: "ソロチン", description: "人数を入れてチンチロ勝負", status: "coming_soon" },
  { id: "solo-bingo", emoji: "🎯", title: "ソロビンゴ", description: "お題を達成してポイント", status: "coming_soon" },
  // 構想メモ(未実装): 「メニュー選びルーレット」
  //   店のメニュー表や壁紙をスマホでスキャン(画像認識、飲み物中心・食べ物も可)
  //   → 認識した候補から5〜6個をAIが選出 → ルーレットを回して1つに決定。
  //   デフォルトは均等確率だが、的の面積(=当選確率)を項目ごとに変えられる関数も欲しい
  //   (例: 1番を広く、6番に向かって徐々に狭くするような重み付け)。
];
const KARAOKE: Activity[] = [
  { id: "forced-song", emoji: "🎤", title: "強制選曲モード", description: "3曲から1曲、1番は必ず歌う", status: "coming_soon" },
];

export function pickActivities(category: string, subCategories: string[]): Activity[] {
  if (subCategories.includes("カラオケ")) return KARAOKE;
  if (category === "SOLO_NOMI") return NOMI;
  return [];
}
