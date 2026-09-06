"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import StampCard from "@/components/StampCard";
import AnniversaryBanner from "@/components/AnniversaryBanner";
import { RANK_THRESHOLDS } from "@/lib/data/scadApps";

// 「ソロ活」タブ: 旧マイページにあったランク表示をここに統合し、重複を解消。
// マイページからはここへのリンクのみを残す設計。
// GET /api/me から実データを取得する(未チェックインなら来店0件の初期値が返る)。

type MeResponse = {
  visitCount: number;
  soloRank: keyof typeof RANK_THRESHOLDS;
  rankLabel: string;
  stamps: { designId: string; createdAt: string }[];
  visitLogs: { id: string; spotName: string; comment: string | null; visitedAt: string }[];
  newAchievements: { key: string; label: string }[];
};

export default function SoloActivityPage() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    fetch("/api/me", { headers: { "x-user-id": "demo-user" } }) // TODO: 認証導入後はヘッダ付与を共通fetchに移す
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  if (!me) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
        <header className="border-b bg-white px-4 py-3">
          <h1 className="text-lg font-bold">ソロ活</h1>
        </header>
        <p className="px-4 py-8 text-center text-xs text-gray-400">読み込み中...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">ソロ活</h1>
      </header>

      {/* ランクサマリー */}
      <section className="bg-white px-4 py-4">
        <p className="text-xs text-gray-400">現在のランク</p>
        <p className="text-xl font-bold text-orange-500">{me.rankLabel}</p>
        <p className="mt-1 text-xs text-gray-400">来店 {me.visitCount} 回</p>
      </section>

      {/* 記念日バナー(未通知の実績があれば表示。表示と同時にAPI側で既読化) */}
      {me.newAchievements.map((a) => (
        <section key={a.key} className="px-4 py-3">
          <AnniversaryBanner milestone={{ count: 0, label: a.label, message: "おめでとう!" }} />
        </section>
      ))}

      {/* スタンプコレクション */}
      <section className="bg-white px-4 py-4">
        <p className="mb-3 text-sm font-medium">スタンプコレクション</p>
        <StampCard collected={me.stamps} />
      </section>

      {/* 来店ログ一覧 */}
      <section className="mt-2 bg-white px-4 py-4">
        <p className="mb-3 text-sm font-medium">来店ログ</p>
        {me.visitLogs.length === 0 ? (
          <p className="text-xs text-gray-400">まだ来店ログがありません。チェックインすると記録されます。</p>
        ) : (
          <ul className="space-y-2">
            {me.visitLogs.map((log) => (
              <li key={log.id} className="border-b pb-2 text-sm last:border-0">
                <p className="font-medium">{log.spotName}</p>
                <p className="text-[11px] text-gray-400">
                  {new Date(log.visitedAt).toLocaleDateString("ja-JP")}
                  {log.comment && ` · ${log.comment}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
