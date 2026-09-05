"use client";

import { useState } from "react";
import { MapPin, MessageCircle } from "lucide-react";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import SpotCard, { type SpotSummary } from "@/components/SpotCard";

// 「1秒で決める」導線:
//   起動 → 現在地周辺の地図がすぐ出る(0タップ) → ピン(1タップ) → チェックイン(2タップ)
// フィルターはトグル式(選択状態が残る)にして、毎回打ち直す判断コストを無くす。

const QUICK_FILTERS = ["カウンター席", "せんべろ", "相席なし", "今すぐ入れる", "カラオケ", "サウナ", "イベント"];

// ダミー(実装時は /api/spots?lat=..&lng=..&filters=.. から取得)
const MOCK_SPOT: SpotSummary = {
  id: "spot_demo", name: "立飲み・〇〇", category: "SOLO_NOMI", subCategories: [],
  hasCounterSeat: true, senberoAvailable: true, distanceLabel: "徒歩3分",
};

export default function HomePage() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SpotSummary | null>(null);

  const toggle = (f: string) =>
    setActive((prev) => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-gray-50" style={{ paddingBottom: NAV_HEIGHT }}>
      <header className="flex items-center justify-between border-b bg-white px-4 py-2">
        <h1 className="text-base font-bold text-orange-500">SCAD-SOLO</h1>
        <span className="text-[11px] text-gray-400">現在地周辺</span>
      </header>

      {/* フィルター: 横スクロール1行。ヘッダーと合わせて上部は約90pxに抑え、地図を最大化 */}
      <div className="flex gap-2 overflow-x-auto border-b bg-white px-3 py-2">
        {QUICK_FILTERS.map((f) => {
          const on = active.has(f);
          return (
            <button key={f} onClick={() => toggle(f)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${on ? "border-orange-400 bg-orange-50 text-orange-600" : "text-gray-600"}`}>
              {f}
            </button>
          );
        })}
      </div>

      {/* 地図: 残り領域を全て使う。実装時はここを地図ライブラリのコンテナに置き換え */}
      <div className="relative flex-1 bg-gray-200">
        <button onClick={() => setSelected(MOCK_SPOT)} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500" aria-label="店舗ピン">
          <MapPin size={36} fill="currentColor" className="text-orange-500" />
        </button>

        {/* AI相談への導線。カードが開いている時はカードの上に退避 */}
        {!selected && (
          <a href="/chat" className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs text-orange-500 shadow-lg">
            <MessageCircle size={14} /> 迷ったらAIに相談
          </a>
        )}
      </div>

      {selected && <SpotCard spot={selected} onClose={() => setSelected(null)} />}
      <BottomNav />
    </div>
  );
}
