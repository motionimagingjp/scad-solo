"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Dices, MapPin } from "lucide-react";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import LocationChip from "@/components/LocationChip";
import { spotMetaLine, type SpotSummary } from "@/components/SpotCard";
import { distanceLabel, googleMapsUrl, haversineMeters } from "@/lib/geo";
import { useBaseLocation } from "@/lib/useBaseLocation";

// 「ソロ飲みルーレット」: 今夜のソロ飲みを1秒で決める中心画面。
// 一覧から選ばせるのではなく、アプリ側が3軒に絞って提示する。引き直しは2回まで
// (無制限にすると結局「迷う」体験に戻るため)。

const PICK_SIZE = 3;
const MAX_REDRAWS = 2;
const POOL_SIZE = 15; // 近い順にこの件数までを抽選対象にする

// 飲みに絞った気分の指定。複数選ぶと「ワインが飲めてカウンターがある店」のように絞り込まれる。
// カラオケ・サウナは飲みではないので、ここには置かず地図側のフィルターに残してある。
const MODES = ["カウンター席", "立ち飲み", "せんべろ", "日本酒", "ワイン", "ビール", "女性ひとり歓迎"];

function drawSpots(pool: SpotSummary[], excludeIds: Set<string>): SpotSummary[] {
  const candidates = pool.filter((s) => !excludeIds.has(s.id));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, PICK_SIZE);
}

export default function HomePage() {
  const { location, setManualLocation, requestGps } = useBaseLocation();
  const [modes, setModes] = useState<Set<string>>(new Set());
  const [spots, setSpots] = useState<SpotSummary[] | null>(null);
  const [picks, setPicks] = useState<SpotSummary[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());
  const [redraws, setRedraws] = useState(0);

  const toggleMode = (mode: string) =>
    setModes((prev) => { const n = new Set(prev); n.has(mode) ? n.delete(mode) : n.add(mode); return n; });

  // 「ソロ飲み」ルーレットなので、飲み屋(SOLO_NOMI)だけを抽選対象にする。
  // サウナやラーメン屋が混ざると体験が壊れるため、大分類でAPI側で絞る。
  useEffect(() => {
    setSpots(null);
    const filters = modes.size > 0 ? `&filters=${encodeURIComponent([...modes].join(","))}` : "";
    fetch(`/api/spots?category=SOLO_NOMI${filters}`)
      .then((res) => (res.ok ? res.json() : { spots: [] }))
      .then((data) => setSpots(data.spots ?? []))
      .catch(() => setSpots([]));
  }, [modes]);

  // 基準地からの近い順。距離ラベルもここで確定させる
  const pool = useMemo(() => {
    if (!spots || !location) return null;
    return spots
      .map((s) => ({
        spot: s,
        meters: haversineMeters(location, { lat: s.latitude, lng: s.longitude }),
      }))
      .sort((a, b) => a.meters - b.meters)
      .slice(0, POOL_SIZE)
      .map(({ spot, meters }) => ({ ...spot, distanceLabel: distanceLabel(meters) }));
  }, [spots, location]);

  // 基準地かモードが変わったら引き直す
  useEffect(() => {
    if (!pool) return;
    const first = drawSpots(pool, new Set());
    setPicks(first);
    setShownIds(new Set(first.map((s) => s.id)));
    setRedraws(0);
  }, [pool]);

  const redraw = () => {
    if (!pool || redraws >= MAX_REDRAWS) return;
    const next = drawSpots(pool, shownIds);
    if (next.length === 0) return;
    setPicks(next);
    setShownIds((prev) => new Set([...prev, ...next.map((s) => s.id)]));
    setRedraws((n) => n + 1);
  };

  const canRedraw = redraws < MAX_REDRAWS && pool !== null && pool.length > shownIds.size;
  const loading = pool === null;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50" style={{ paddingBottom: NAV_HEIGHT + 16 }}>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <h1 className="text-base font-bold text-orange-500">SCAD-SOLO</h1>
        <LocationChip location={location} onSelectManual={setManualLocation} onRequestGps={requestGps} />
      </header>

      <div className="px-4 pt-5">
        <p className="flex items-center gap-1.5 text-lg font-bold">
          <Dices size={20} className="text-orange-500" />
          ソロ飲みルーレット
        </p>
        <p className="mt-1 text-xs text-gray-400">この中から選べば、もう迷わない</p>
      </div>

      {/* 気分のモード。何も選ばなければ「おまかせ」 */}
      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
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

      <div className="space-y-3 px-4 pt-4">
        {loading && <p className="py-10 text-center text-xs text-gray-400">お店を探しています...</p>}

        {!loading && picks.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="text-sm text-gray-500">
              {modes.size > 0 ? "条件に合うお店が見つかりませんでした" : "この周辺にはまだ登録されたお店がありません"}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {modes.size > 0 ? "モードを減らすか、別のエリアを試してみてください" : "上の場所ボタンから、別のエリアを指定してみてください"}
            </p>
          </div>
        )}

        {picks.map((spot) => (
          <div key={spot.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-bold">{spot.name}</p>
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
            onClick={redraw}
            disabled={!canRedraw}
            className="flex w-full items-center justify-center gap-2 rounded-full border bg-white py-3 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            <Dices size={16} />
            {canRedraw ? `もう3軒 (あと${MAX_REDRAWS - redraws}回)` : "引き直しはここまで"}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
