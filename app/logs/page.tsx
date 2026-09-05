import BottomNav from "@/components/BottomNav";
import StampCard from "@/components/StampCard";
import AnniversaryBanner from "@/components/AnniversaryBanner";
import { RANK_THRESHOLDS } from "@/lib/data/scadApps";

// 「ソロ活」タブ: 旧マイページにあったランク表示をここに統合し、重複を解消。
// マイページからはここへのリンクのみを残す設計。

// ダミーデータ(実装時はセッション/DBから取得)
const mockUser = {
  visitCount: 5,
  soloRank: "REGULAR" as const,
};

const mockStamps = [
  { designId: "cheers", createdAt: "2026-08-01" },
  { designId: "counter", createdAt: "2026-08-10" },
];

// 実装時は UserAchievement を notified=false で取得し、表示後に notified=true へ更新
const latestMilestone = { count: 3, label: "ソロ活はじめました", message: "はじめての3回来店、おめでとう!" };

export default function SoloActivityPage() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">ソロ活</h1>
      </header>

      {/* ランクサマリー */}
      <section className="bg-white px-4 py-4">
        <p className="text-xs text-gray-400">現在のランク</p>
        <p className="text-xl font-bold text-orange-500">
          {RANK_THRESHOLDS[mockUser.soloRank].label}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          来店 {mockUser.visitCount} 回
        </p>
      </section>

      {/* 記念日バナー(直近で達成したものがあれば表示) */}
      <section className="px-4 py-3">
        <AnniversaryBanner milestone={latestMilestone} />
      </section>

      {/* スタンプコレクション */}
      <section className="bg-white px-4 py-4">
        <p className="mb-3 text-sm font-medium">スタンプコレクション</p>
        <StampCard collected={mockStamps} />
      </section>

      {/* 来店ログ一覧 */}
      <section className="mt-2 bg-white px-4 py-4">
        <p className="mb-3 text-sm font-medium">来店ログ</p>
        <p className="text-xs text-gray-400">
          (来店履歴のリストをここに表示。実装時は VisitLog を新しい順に取得)
        </p>
      </section>

      <BottomNav />
    </div>
  );
}
