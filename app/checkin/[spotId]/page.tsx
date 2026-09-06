"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import AnniversaryBanner from "@/components/AnniversaryBanner";

// 決定画面: 検索→決定→記録→シェアを結ぶ要。
//   記録するのは「来店した証明」ではなく「今夜ここに決めた」という意思決定。
//   店の前でアプリを開き直す人はいないので、探している最中に押せる文言にしてある。
//   決定 → スタンプ+実績+アクティビティ+シェア が1画面に出る → 「Threadsでシェア」で完結。

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
  const [loading, setLoading] = useState(false);
  const [spot, setSpot] = useState<{ name: string; hasCounterSeat: boolean; senberoAvailable: boolean; subCategories: string[] } | null>(null);

  // 何を選んでいるかを決定前に確認できるようにする
  useEffect(() => {
    fetch(`/api/spots/${spotId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setSpot)
      .catch(() => setSpot(null));
  }, [spotId]);

  const checkin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" }, // TODO: 認証導入後はヘッダ付与を共通fetchに移す
        body: JSON.stringify({ spotId }),
      });
      if (res.ok) setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50" style={{ paddingBottom: NAV_HEIGHT }}>
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <button onClick={() => router.back()} className="text-xs text-gray-400">← 戻る</button>
        <h1 className="text-base font-bold">今夜の店を決める</h1>
      </header>

      {!result ? (
        <div className="flex flex-col items-center px-6 pt-10">
          <p className="text-xl font-bold">{spot?.name ?? "..."}</p>
          {spot && (
            <p className="mt-1 text-xs text-gray-400">
              {[
                spot.hasCounterSeat && "カウンター席",
                spot.senberoAvailable && "せんべろ",
                ...spot.subCategories,
              ].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-6 text-sm text-gray-500">この店で決まり?</p>
          <button onClick={checkin} disabled={loading}
            className="mt-4 h-40 w-40 rounded-full bg-orange-500 text-lg font-bold text-white shadow-xl active:scale-95 disabled:opacity-50">
            {loading ? "記録中..." : "ここに決めた"}
          </button>
          <p className="mt-4 text-[11px] text-gray-400">決めた時点で記録されます</p>
        </div>
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
