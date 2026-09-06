"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { BaseLocation } from "@/lib/useBaseLocation";

// 提案の基準地を常時表示し、タップで「現在地 / 駅名指定」に切り替えるための部品。
// 駅名→座標の変換はブラウザ側から呼ぶ(APIキーがリファラー制限のため、サーバー側からは呼べない)。

// これらが末尾にあれば、駅名以外の地名指定とみなしてそのまま検索する
const AREA_SUFFIX = /(駅|区|市|町|村|丁目|通り|公園|口)$/;

export default function LocationChip({
  location,
  onSelectManual,
  onRequestGps,
}: {
  location: BaseLocation | null;
  onSelectManual: (next: { lat: number; lng: number; label: string }) => void;
  onRequestGps: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const searchPlace = async () => {
    const keyword = query.trim();
    if (!keyword || !apiKey) return;
    setSearching(true);
    setError(null);
    try {
      const google = await loadGoogleMaps(apiKey);
      const geocoder = new google.maps.Geocoder();

      // 「渋谷」のような省略形は駅として探したいので、まず「駅」を補って検索する。
      // それで見つからなければ入力そのままで再検索する(地名・施設名も拾えるように)。
      const candidates = AREA_SUFFIX.test(keyword) ? [keyword] : [`${keyword}駅`, keyword];
      for (const address of candidates) {
        const { results } = await geocoder
          .geocode({ address, componentRestrictions: { country: "jp" } })
          .catch(() => ({ results: [] }));
        const hit = results?.[0];
        if (!hit) continue;

        onSelectManual({
          lat: hit.geometry.location.lat(),
          lng: hit.geometry.location.lng(),
          label: address,
        });
        setQuery("");
        setOpen(false);
        return;
      }
      setError("その場所は見つかりませんでした");
    } catch {
      setError("検索に失敗しました。通信環境を確認してください");
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
      >
        <MapPin size={13} className="text-orange-500" />
        {location?.label ?? "場所を確認中..."}
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="mx-auto w-full max-w-md rounded-t-2xl bg-white p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">どこで飲む?</p>
              <button onClick={() => setOpen(false)} aria-label="閉じる" className="text-gray-400">
                <X size={18} />
              </button>
            </div>

            <button
              onClick={() => {
                onRequestGps();
                setOpen(false);
              }}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-bold text-white"
            >
              <MapPin size={16} /> 現在地を使う
            </button>

            <p className="mb-2 text-xs text-gray-400">駅名・エリア名で指定</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPlace()}
                placeholder="例: 池袋駅"
                className="h-11 flex-1 rounded-full border px-4 text-sm"
              />
              <button
                onClick={searchPlace}
                disabled={searching || !query.trim()}
                className="h-11 rounded-full border px-4 text-sm font-medium text-gray-700 disabled:opacity-40"
              >
                {searching ? "検索中" : "決定"}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
