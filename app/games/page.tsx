import BottomNav from "@/components/BottomNav";
import { ALL_GAMES } from "@/lib/data/activities";

// 「ゲーム」タブ: 企画中のミニゲームを一覧にして見せる。
// 本体はどれも未実装で、チェックイン後の画面にも同じ定義(ALL_GAMES)から出し分けて表示している。

export default function GamesPage() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">ゲーム</h1>
        <p className="mt-1 text-xs text-gray-400">企画中のソロ活アクティビティ</p>
      </header>

      <section className="mt-2 space-y-2 px-4 py-4">
        {ALL_GAMES.map((game) => (
          <div key={game.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
            <span className="text-2xl">{game.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{game.title}</p>
              <p className="text-[11px] text-gray-400">{game.description}</p>
            </div>
            {game.status === "coming_soon" && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">計画中</span>
            )}
          </div>
        ))}
      </section>

      <BottomNav />
    </div>
  );
}
