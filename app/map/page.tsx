"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import SpotCard, { type SpotSummary } from "@/components/SpotCard";
import SearchMap from "@/components/SearchMap";
import LocationChip from "@/components/LocationChip";
import { distanceLabel, haversineMeters } from "@/lib/geo";
import { useBaseLocation } from "@/lib/useBaseLocation";

// 地図画面: 「今夜の3軒」で決めきれない人向けの補助。自分でエリアを見渡して探せる。
//
// フィルターは「おひとり様が実際に店を選ぶ基準」に揃えてある。
// 旧版にあった「相席なし」「今すぐ入れる」「イベント」は、対応するデータを持っておらず
// 押しても結果が変わらない飾りだったため外した(空席状況や相席可否を取れるようになったら戻す)。
const QUICK_FILTERS = ["カウンター席", "立ち飲み", "せんべろ", "日本酒", "ワイン", "ビール", "カラオケ", "サウナ", "女性ひとり歓迎"];

export default function MapPage() {
  const { location, setManualLocation, requestGps } = useBaseLocation();
  const [active, setActive] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SpotSummary | null>(null);
  const [spots, setSpots] = useState<SpotSummary[]>([]);

  const toggle = (f: string) =>
    setActive((prev) => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });

  // フィルター変更のたびに検索し直す
  useEffect(() => {
    const params = active.size > 0 ? `?filters=${encodeURIComponent([...active].join(","))}` : "";
    fetch(`/api/spots${params}`)
      .then((res) => (res.ok ? res.json() : { spots: [] }))
      .then((data) => setSpots(data.spots ?? []))
      .catch(() => setSpots([]));
  }, [active]);

  const spotsWithDistance = location
    ? spots.map((s) => ({
        ...s,
        distanceLabel: distanceLabel(haversineMeters(location, { lat: s.latitude, lng: s.longitude })),
      }))
    : spots;

  const handleSelect = useCallback((spot: SpotSummary) => setSelected(spot), []);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-gray-50" style={{ paddingBottom: NAV_HEIGHT }}>
      <header className="flex items-center justify-between border-b bg-white px-3 py-2">
        <Link href="/" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <LocationChip location={location} onSelectManual={setManualLocation} onRequestGps={requestGps} />
      </header>

      {/* フィルター: 横スクロール1行。上部を抑えて地図を最大化。右端は横スクロールできる合図としてグラデーションを重ねる */}
      <div className="relative border-b bg-white">
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
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
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
      </div>

      <div className="relative flex-1 bg-gray-200">
        <SearchMap spots={spotsWithDistance} userLocation={location} onSelectSpot={handleSelect} />
      </div>

      {selected && <SpotCard spot={selected} onClose={() => setSelected(null)} />}
      <BottomNav />
    </div>
  );
}
