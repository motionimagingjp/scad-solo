import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import InfoButton from "@/components/InfoButton";
import ShareButton from "@/components/ShareButton";
import { ALL_GAMES } from "@/lib/data/activities";

// 「ゲーム」タブ: ミニゲームを一覧にして見せる。
// 実装済み(available)のものはタップで遊べる。それ以外は計画中バッジのみ表示。
// チェックイン後の画面にも同じ定義(ALL_GAMES)から出し分けて表示している。

export default function GamesPage() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-bold">ゲーム</h1>
          <p className="mt-1 text-xs text-gray-400">ソロ活アクティビティ</p>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton />
          <InfoButton />
        </div>
      </header>

      <section className="mt-2 space-y-2 px-4 py-4">
        {ALL_GAMES.map((game) => {
          const content = (
            <>
              <span className="text-2xl">{game.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{game.title}</p>
                <p className="text-[11px] text-gray-400">{game.description}</p>
              </div>
              {game.status === "coming_soon" ? (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">計画中</span>
              ) : (
                <ChevronRight size={18} className="shrink-0 text-gray-300" />
              )}
            </>
          );

          if (game.status === "available" && game.href) {
            return (
              <Link key={game.id} href={game.href} className="flex items-center gap-3 rounded-xl border bg-white p-3">
                {content}
              </Link>
            );
          }
          return (
            <div key={game.id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
              {content}
            </div>
          );
        })}
      </section>

      <BottomNav />
    </div>
  );
}
