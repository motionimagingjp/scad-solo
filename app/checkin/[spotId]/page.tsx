"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import AnniversaryBanner from "@/components/AnniversaryBanner";

// 結果画面: 検索→決定→記録→シェアを結ぶ要。
//   記録するのは「来店した証明」ではなく「今夜ここに決めた」という意思決定。
//   決定は一覧の「今夜はここにする」で完了しているため、確認は挟まずこの画面到達時に記録する。
//   記録 → スタンプ+実績+アクティビティ+シェア が1画面に出る → 「Threadsでシェア」で完結。

// リロードでの二重記録を防ぐため、結果はセッション内で保持する
const RESULT_CACHE_PREFIX = "scad-solo:decision:";

type CheckinResult = {
  spot: { name: string };
  rankLabel: string;
  visitCount: number;
  stamp: { emoji: string; label: string };
  newAchievements: { key: string; label: string }[];
  activities: { id: string; emoji: string; title: string; description: string; status: string }[];
  share: { intentUrl: string };
};

export default function CheckinPage() {
  const { spotId } = useParams<{ spotId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // 開発時の二重実行(StrictMode)を防ぐ
    startedRef.current = true;

    const cacheKey = `${RESULT_CACHE_PREFIX}${spotId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setResult(JSON.parse(cached));
        return;
      }
    } catch {}

    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user" }, // TODO: 認証導入後はヘッダ付与を共通fetchに移す
      body: JSON.stringify({ spotId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setFailed(true);
          return;
        }
        setResult(data);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
      })
      .catch(() => setFailed(true));
  }, [spotId]);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50" style={{ paddingBottom: NAV_HEIGHT }}>
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <button onClick={() => router.back()} className="text-xs text-gray-400">← 戻る</button>
        <h1 className="text-base font-bold">今夜の一軒</h1>
      </header>

      {failed ? (
        <div className="flex flex-col items-center px-6 pt-16 text-center">
          <p className="text-sm text-gray-500">記録できませんでした</p>
          <button onClick={() => router.back()} className="mt-4 rounded-full border bg-white px-6 py-2 text-sm text-gray-600">
            戻ってやり直す
          </button>
        </div>
      ) : !result ? (
        <p className="px-6 pt-20 text-center text-sm text-gray-400">記録しています...</p>
      ) : (
        <div className="space-y-3 px-4 pt-4">
          {/* スタンプ獲得 */}
          <section className="rounded-2xl bg-white p-5 text-center">
            <p className="text-5xl">{result.stamp.emoji}</p>
            <p className="mt-2 font-bold">{result.stamp.label}</p>
            <p className="text-xs text-gray-400">{result.spot.name} · 来店{result.visitCount}回 · {result.rankLabel}</p>
          </section>

          {/* 実績(新規達成時のみ) */}
          {result.newAchievements.map((a) => (
            <AnniversaryBanner key={a.key} milestone={{ count: 0, label: a.label, message: "おめでとう!" }} />
          ))}

          {/* シェア: 最重要CTAとして最上段に */}
          <a href={result.share.intentUrl} target="_blank" rel="noreferrer"
            className="block rounded-full bg-black py-3 text-center text-sm font-bold text-white">
            Threadsでシェア
          </a>

          {/* 今夜のアクティビティ(場所の種類に応じて最大3件) */}
          {result.activities.length > 0 && (
            <section className="rounded-2xl bg-white p-4">
              <p className="mb-2 text-xs text-gray-400">今夜のソロ活アクティビティ</p>
              <div className="space-y-2">
                {result.activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border p-3 opacity-90">
                    <span className="text-2xl">{a.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-[11px] text-gray-400">{a.description}</p>
                    </div>
                    {a.status === "coming_soon" && <span className="text-[10px] text-gray-400">近日</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
