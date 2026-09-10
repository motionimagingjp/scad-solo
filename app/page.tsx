"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Store, MapPin } from "lucide-react";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import InfoButton from "@/components/InfoButton";
import LocationChip from "@/components/LocationChip";
import ShareButton from "@/components/ShareButton";
import { AiSuggestedBadge, spotMetaLine, type SpotSummary } from "@/components/SpotCard";
import { distanceLabel, googleMapsUrl, haversineMeters } from "@/lib/geo";
import { useBaseLocation } from "@/lib/useBaseLocation";

// 「今夜の3軒」: 近い順に絞った3軒をそのまま提示する検索画面。
// シャッフル性は持たせない(エンターテイメント性はゲームタブ側で担うため)。
// 「次の3軒」は距離順プールを先頭から3件ずつページ送りするだけで、乱数は使わない。

const PICK_SIZE = 3;
const MAX_REDRAWS = 2; // 「次の3軒」を送れる回数(無制限だと結局「迷う」体験に戻るため)
const POOL_SIZE = 15; // 近い順にこの件数までを候補にする
const MAX_DISTANCE_METERS = 5000; // これより遠い店は「今夜」の範囲外として候補から外す

// 飲みに絞った気分の指定。複数選ぶと「ワインが飲めてカウンターがある店」のように絞り込まれる。
// カラオケ・サウナは飲みではないので、ここには置かず地図側のフィルターに残してある。
const MODES = ["カウンター席", "立ち飲み", "せんべろ", "日本酒", "ワイン", "ビール", "女性ひとり歓迎"];

// 「このエリアにはデータがない」空状態から1タップで実データのあるエリアへ逃がすための固定値
const TOKYO_STATION = { lat: 35.681236, lng: 139.767125, label: "東京駅" };

export default function HomePage() {
  const { location, setManualLocation, requestGps } = useBaseLocation();
  const [modes, setModes] = useState<Set<string>>(new Set());
  const [spots, setSpots] = useState<SpotSummary[] | null>(null);
  const [page, setPage] = useState(0);

  const toggleMode = (mode: string) =>
    setModes((prev) => { const n = new Set(prev); n.has(mode) ? n.delete(mode) : n.add(mode); return n; });

  // 「今夜の3軒」は飲み屋(SOLO_NOMI)だけを候補にする。
  // サウナやラーメン屋が混ざると体験が壊れるため、大分類でAPI側で絞る。
  useEffect(() => {
    setSpots(null);
    const filters = modes.size > 0 ? `&filters=${encodeURIComponent([...modes].join(","))}` : "";
    fetch(`/api/spots?category=SOLO_NOMI${filters}`)
      .then((res) => (res.ok ? res.json() : { spots: [] }))
      .then((data) => setSpots(data.spots ?? []))
      .catch(() => setSpots([]));
  }, [modes]);

  // 基準地からの近い順。5km圏外の店は「今夜ふらっと」の範囲外として除外する
  // (店が少ないエリアだと無理に遠方を出してしまい、「約28km」のような結果になるため)。
  const pool = useMemo(() => {
    if (!spots || !location) return null;
    return spots
      .map((s) => ({
        spot: s,
        meters: haversineMeters(location, { lat: s.latitude, lng: s.longitude }),
      }))
      .filter(({ meters }) => meters <= MAX_DISTANCE_METERS)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, POOL_SIZE)
      .map(({ spot, meters }) => ({ ...spot, distanceLabel: distanceLabel(meters) }));
  }, [spots, location]);

  // 基準地かモードが変わったら先頭ページに戻す
  useEffect(() => {
    setPage(0);
  }, [pool]);

  const picks = useMemo(
    () => (pool ? pool.slice(page * PICK_SIZE, page * PICK_SIZE + PICK_SIZE) : []),
    [pool, page],
  );

  const showNext = () => {
    if (!pool || page >= MAX_REDRAWS) return;
    if ((page + 1) * PICK_SIZE >= pool.length) return;
    setPage((p) => p + 1);
  };

  const canShowNext = pool !== null && page < MAX_REDRAWS && (page + 1) * PICK_SIZE < pool.length;
  const loading = pool === null;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50" style={{ paddingBottom: NAV_HEIGHT + 16 }}>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <h1 className="text-base font-bold text-orange-500">SCAD-SOLO</h1>
        <div className="flex items-center gap-2">
          <LocationChip location={location} onSelectManual={setManualLocation} onRequestGps={requestGps} />
          <ShareButton />
          <InfoButton />
        </div>
      </header>

      <div className="px-4 pt-5">
        <p className="flex items-center gap-1.5 text-lg font-bold">
          <Store size={20} className="text-orange-500" />
          今夜のおすすめ3軒
        </p>
        <p className="mt-1 text-xs text-gray-400">近くのおすすめはこれ</p>
      </div>

      {/* 気分のモード。何も選ばなければ「おまかせ」。右端は横スクロールできる合図としてグラデーションを重ねる */}
      <div className="relative mt-3">
        <div className="flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setModes(new Set())}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
              modes.size === 0 ? "border-orange-400 bg-orange-50 text-orange-600" : "bg-white text-gray-600"
            }`}
          >
            おまかせ
          </button>
          {MODES.map((mode) => {
            const on = modes.has(mode);
            return (
              <button
                key={mode}
                onClick={() => toggleMode(mode)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                  on ? "border-orange-400 bg-orange-50 text-orange-600" : "bg-white text-gray-600"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent" />
      </div>

      <div className="space-y-3 px-4 pt-4">
        {loading && <p className="py-10 text-center text-xs text-gray-400">お店を探しています...</p>}

        {!loading && picks.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 text-center">
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url(/images/bar-mood.jpg)" }}
            />
            <div className="relative">
              <p className="text-sm text-gray-500">
                {modes.size > 0 ? "条件に合うお店が見つかりませんでした" : "この周辺にはまだ登録されたお店がありません"}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {modes.size > 0 ? "モードを減らすか、別のエリアを試してみてください" : "上の場所ボタンから、別のエリアを指定してみてください"}
              </p>
              {modes.size === 0 && (
                <button
                  onClick={() => setManualLocation(TOKYO_STATION)}
                  className="mt-4 rounded-full border border-orange-400 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-600"
                >
                  東京駅エリアを見る
                </button>
              )}
            </div>
          </div>
        )}

        {picks.map((spot) => (
          <div key={spot.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-bold">
              {spot.name}
              <AiSuggestedBadge status={spot.status} />
            </p>
            <p className="mt-1 text-xs text-gray-400">{spotMetaLine(spot)}</p>
            {spot.tagline && <p className="mt-1 text-xs text-gray-600">{spot.tagline}</p>}
            <p className="mt-1 text-[11px] text-gray-400">{spot.address}</p>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/checkin/${spot.id}`}
                className="flex-1 rounded-full bg-orange-500 py-3 text-center text-sm font-bold text-white"
              >
                今夜はここにする
              </Link>
              <a
                href={googleMapsUrl(spot)}
                target="_blank"
                rel="noreferrer"
                aria-label="Googleマップで開く"
                className="flex w-12 items-center justify-center rounded-full border text-gray-600"
              >
                <MapPin size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {picks.length > 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={showNext}
            disabled={!canShowNext}
            className="flex w-full items-center justify-center gap-2 rounded-full border bg-white py-3 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            <Store size={16} />
            {canShowNext ? `次の3軒 (あと${MAX_REDRAWS - page}回)` : "これ以上近くのお店はありません"}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
